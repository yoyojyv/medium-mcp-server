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
  // limit에 비례한 최대 클릭 횟수 (10개당 1클릭 + 여유분)
  const maxClicks = Math.min(Math.ceil(targetCount / 10) + 2, 20);
  let clicks = 0;
  let previousCount = 0;

  while (clicks < maxClicks) {
    // 현재 로드된 결과 수 확인
    const currentCount = await page.locator(SEARCH_RESULT_SELECTOR).count();

    if (currentCount >= targetCount) {
      logger.debug("Enough results loaded", { currentCount, targetCount });
      break;
    }

    // 클릭 후에도 결과 수가 증가하지 않으면 마지막 페이지
    if (clicks > 0 && currentCount === previousCount) {
      logger.debug("No more results available (count unchanged)", {
        currentCount,
        previousCount,
        clicks,
      });
      break;
    }
    previousCount = currentCount;

    // 페이지 바닥으로 스크롤 (Show more 버튼이 바닥에 있음)
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

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
 * evaluate()를 사용하여 한 번에 모든 데이터 추출 (성능 최적화)
 */
async function extractSearchResults(
  page: Page,
  limit: number
): Promise<SearchResult[]> {
  // 브라우저 내에서 한 번에 모든 데이터 추출
  const rawResults = await page.evaluate((selector) => {
    const articles = document.querySelectorAll(selector);
    const results: Array<{
      title: string | null;
      url: string | null;
      author: string | null;
      excerpt: string | null;
    }> = [];

    articles.forEach((article) => {
      // URL 추출 - div[role="link"][data-href]
      const linkDiv = article.querySelector('div[role="link"][data-href]');
      const url = linkDiv?.getAttribute("data-href") || null;

      // 제목 추출 - h2
      const h2 = article.querySelector("h2");
      const title = h2?.textContent || null;

      // 저자 추출 - a[href*="/@"]
      const authorLinks = article.querySelectorAll('a[href*="/@"]');
      let author: string | null = null;
      for (const link of authorLinks) {
        const text = link.textContent?.trim();
        if (text && text.length > 0 && !text.includes("·")) {
          author = text;
          break;
        }
      }

      // 요약 추출 - 두 번째 h3
      const h3Elements = article.querySelectorAll("h3");
      const excerpt = h3Elements[0]?.textContent || null;

      results.push({ title, url, author, excerpt });
    });

    return results;
  }, SEARCH_RESULT_SELECTOR);

  logger.debug("Raw results extracted", { count: rawResults.length });

  // 결과 정제
  const results: SearchResult[] = [];
  const seenUrls = new Set<string>();

  for (const raw of rawResults) {
    if (results.length >= limit) break;

    if (!raw.title || !raw.url) {
      continue;
    }

    // URL 정규화
    const normalizedUrl = raw.url.split("?")[0];
    if (seenUrls.has(normalizedUrl)) continue;
    seenUrls.add(normalizedUrl);

    results.push({
      title: raw.title.trim(),
      url: normalizedUrl,
      author: raw.author,
      publishedAt: null,
      excerpt: raw.excerpt?.trim() || null,
      claps: null,
      readingTime: null,
      publication: null,
    });

    logger.debug("Extracted article", { title: raw.title.trim().substring(0, 50) });
  }

  return results;
}

