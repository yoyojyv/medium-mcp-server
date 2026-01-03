import type { Page } from "playwright";
import type { SearchResult, SearchResponse } from "../types/search-result.js";
import { TIMEOUTS } from "../config/constants.js";
import { logger } from "../utils/logger.js";
import { SearchScraperError } from "../utils/errors.js";
import { getBrowser, BROWSER_CONTEXT_OPTIONS } from "./article-extractor.js";

interface SearchOptions {
  limit?: number;
}

// 검색 결과 아이템 셀렉터
const SEARCH_RESULT_SELECTOR = 'article[data-testid="post-preview"]';
const SHOW_MORE_BUTTON_SELECTOR = 'button:has-text("Show more")';

/**
 * Medium 전체 검색
 * 검색 결과 페이지를 스크래핑하여 글 목록 반환
 */
export async function searchMedium(
  query: string,
  options: SearchOptions = {}
): Promise<SearchResponse> {
  const { limit = 10 } = options;
  const searchUrl = `https://medium.com/search?q=${encodeURIComponent(query)}`;

  logger.info("Searching Medium", { query, searchUrl, limit });

  const browser = await getBrowser(true);
  const context = await browser.newContext(BROWSER_CONTEXT_OPTIONS);
  const page = await context.newPage();

  try {
    await page.goto(searchUrl, {
      waitUntil: "domcontentloaded",
      timeout: TIMEOUTS.NAVIGATION,
    });

    // 검색 결과 로딩 대기
    await page
      .waitForSelector(SEARCH_RESULT_SELECTOR, { timeout: TIMEOUTS.SELECTOR })
      .catch(() => {
        logger.warn("Search results not found", { query });
      });

    // 필요한 만큼 "Show more" 버튼 클릭하여 결과 로드
    await loadMoreResults(page, limit);

    // 검색 결과 추출
    const results = await extractSearchResults(page, limit);

    logger.info("Search completed successfully", {
      query,
      resultCount: results.length,
    });

    return {
      query,
      resultCount: results.length,
      results,
      hasMore: results.length >= limit,
    };
  } catch (error) {
    if (error instanceof SearchScraperError) {
      throw error;
    }

    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error("Search failed", error as Error, { query });
    throw new SearchScraperError(message, query);
  } finally {
    await context.close();
  }
}

/**
 * "Show more" 버튼을 클릭하여 더 많은 결과 로드
 */
async function loadMoreResults(page: Page, targetCount: number): Promise<void> {
  const maxClicks = 5; // 최대 클릭 횟수 제한
  let clicks = 0;

  while (clicks < maxClicks) {
    // 현재 로드된 결과 수 확인
    const currentCount = await page.locator(SEARCH_RESULT_SELECTOR).count();

    if (currentCount >= targetCount) {
      logger.debug("Enough results loaded", { currentCount, targetCount });
      break;
    }

    // "Show more" 버튼 찾기
    const showMoreButton = page.locator(SHOW_MORE_BUTTON_SELECTOR).first();
    const isVisible = await showMoreButton.isVisible().catch(() => false);

    if (!isVisible) {
      logger.debug("Show more button not found or not visible");
      break;
    }

    // 버튼 클릭
    try {
      await showMoreButton.click();
      clicks++;
      logger.debug("Clicked Show more button", { clicks });

      // 새 결과 로딩 대기
      await page.waitForTimeout(1500);
    } catch (error) {
      logger.debug("Failed to click Show more button", { error });
      break;
    }
  }
}

/**
 * 검색 결과 페이지에서 글 목록 추출
 */
async function extractSearchResults(
  page: Page,
  limit: number
): Promise<SearchResult[]> {
  const articleElements = await page.locator(SEARCH_RESULT_SELECTOR).all();
  const results: SearchResult[] = [];
  const seenUrls = new Set<string>();

  logger.debug("Found article elements", { count: articleElements.length });

  for (const element of articleElements) {
    if (results.length >= limit) break;

    try {
      // 제목 추출 (h2 또는 h3)
      const titleElement = element.locator("h2, h3").first();
      const title = await titleElement.textContent().catch(() => null);

      // 링크 추출 - 제목 링크 우선
      const titleLink = element.locator("h2 a, h3 a").first();
      let href = await titleLink.getAttribute("href").catch(() => null);

      // 제목 링크가 없으면 article 내 다른 링크 시도
      if (!href) {
        const anyLink = element.locator('a[href*="/@"], a[href*="/p/"]').first();
        href = await anyLink.getAttribute("href").catch(() => null);
      }

      if (!title || !href) {
        logger.debug("Skipping article - missing title or href", { title, href });
        continue;
      }

      // URL 정규화
      const url = href.startsWith("http")
        ? href
        : `https://medium.com${href}`;

      // 중복 제거 (source 파라미터 제외하고 비교)
      const normalizedUrl = url.split("?")[0];
      if (seenUrls.has(normalizedUrl)) continue;
      seenUrls.add(normalizedUrl);

      // 저자 추출
      const authorElement = element.locator('a[href*="/@"]').first();
      const authorText = await authorElement.textContent().catch(() => null);
      const authorHref = await authorElement.getAttribute("href").catch(() => null);
      const author = authorText?.trim() || extractUsernameFromHref(authorHref);

      // 요약 추출
      const excerptElement = element.locator("h3 + p, h2 + p, p").first();
      const excerpt = await excerptElement.textContent().catch(() => null);

      // 발행일 추출
      const dateElement = element.locator("time");
      const publishedAt = await dateElement.getAttribute("datetime").catch(() => null);

      // 읽기 시간 추출
      const readingTimeText = await element
        .locator('span:has-text("min read")')
        .textContent()
        .catch(() => null);

      results.push({
        title: title.trim(),
        url: normalizedUrl,
        author,
        publishedAt,
        excerpt: excerpt?.trim() || null,
        claps: null,
        readingTime: readingTimeText?.trim() || null,
        publication: null,
      });

      logger.debug("Extracted article", { title: title.trim(), url: normalizedUrl });
    } catch {
      continue;
    }
  }

  return results;
}

/**
 * href에서 username 추출
 */
function extractUsernameFromHref(href: string | null): string | null {
  if (!href) return null;
  const match = href.match(/@([^/?]+)/);
  return match ? match[1] : null;
}
