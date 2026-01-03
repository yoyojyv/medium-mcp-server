import type { Page } from "playwright";
import type { SearchResult, SearchResponse } from "../types/search-result.js";
import { TIMEOUTS } from "../config/constants.js";
import { logger } from "../utils/logger.js";
import { SearchScraperError } from "../utils/errors.js";
import { getBrowser, BROWSER_CONTEXT_OPTIONS } from "./article-extractor.js";

interface SearchOptions {
  limit?: number;
}

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
      .waitForSelector("article", { timeout: TIMEOUTS.SELECTOR })
      .catch(() => {
        logger.warn("Search results not found", { query });
      });

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
 * 검색 결과 페이지에서 글 목록 추출
 */
async function extractSearchResults(
  page: Page,
  limit: number
): Promise<SearchResult[]> {
  const articleElements = await page.locator("article").all();
  const results: SearchResult[] = [];
  const seenUrls = new Set<string>();

  for (const element of articleElements) {
    if (results.length >= limit) break;

    try {
      // 제목 추출
      const titleElement = element.locator("h2, h3").first();
      const title = await titleElement.textContent().catch(() => null);

      // 링크 추출
      const linkElement = element.locator('a[href*="/@"], a[href*="/p/"]').first();
      const href = await linkElement.getAttribute("href").catch(() => null);

      if (!title || !href) continue;

      // URL 정규화
      const url = href.startsWith("http")
        ? href
        : `https://medium.com${href}`;

      // 중복 제거
      if (seenUrls.has(url)) continue;
      seenUrls.add(url);

      // 저자 추출
      const authorElement = element.locator('a[href*="/@"]').first();
      const authorHref = await authorElement.getAttribute("href").catch(() => null);
      const authorText = await authorElement.textContent().catch(() => null);
      const author = authorText?.trim() || extractUsernameFromHref(authorHref);

      // 요약 추출
      const excerptElement = element.locator("p").first();
      const excerpt = await excerptElement.textContent().catch(() => null);

      // 발행일 추출
      const dateElement = element.locator("time");
      const publishedAt = await dateElement.getAttribute("datetime").catch(() => null);

      // 읽기 시간 추출
      const readingTimeElement = element.locator('[class*="readingTime"], span:has-text("min read")');
      const readingTime = await readingTimeElement.textContent().catch(() => null);

      // 퍼블리케이션 추출 (있는 경우)
      const pubElement = element.locator('a[href*="/publication/"], a[href^="https://"][href$=".com"]');
      const publication = await pubElement.textContent().catch(() => null);

      results.push({
        title: title.trim(),
        url,
        author,
        publishedAt,
        excerpt: excerpt?.trim() || null,
        claps: null,
        readingTime: readingTime?.trim() || null,
        publication: publication?.trim() || null,
      });
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
