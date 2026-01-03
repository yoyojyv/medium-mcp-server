import type { Page } from "playwright";
import type {
  AuthorArticle,
  AuthorArticlesResponse,
} from "../types/author-article.js";
import { TIMEOUTS } from "../config/constants.js";
import { logger } from "../utils/logger.js";
import { AuthorScraperError } from "../utils/errors.js";
import { getBrowser, BROWSER_CONTEXT_OPTIONS } from "./article-extractor.js";

interface ScrapeOptions {
  limit?: number;
  scrollCount?: number;
}

/**
 * Author 페이지에서 글 목록 스크래핑
 * RSS보다 더 많은 글과 메타데이터 제공 가능하지만 봇 탐지 위험 있음
 */
export async function scrapeAuthorArticles(
  username: string,
  options: ScrapeOptions = {}
): Promise<AuthorArticlesResponse> {
  const { limit = 20, scrollCount = 3 } = options;
  const authorUrl = `https://medium.com/@${username}`;

  logger.info("Scraping author page", { username, authorUrl, limit });

  const browser = await getBrowser(true);
  const context = await browser.newContext(BROWSER_CONTEXT_OPTIONS);
  const page = await context.newPage();

  try {
    await page.goto(authorUrl, {
      waitUntil: "domcontentloaded",
      timeout: TIMEOUTS.NAVIGATION,
    });

    // 글 목록 로딩 대기
    await page
      .waitForSelector("article", { timeout: TIMEOUTS.SELECTOR })
      .catch(() => {
        logger.warn("Article selector not found on author page", { username });
      });

    // 무한 스크롤로 더 많은 글 로드
    await scrollForMoreArticles(page, scrollCount);

    // 글 목록 추출
    const articles = await extractArticlesFromPage(page, limit);

    logger.info("Author page scraped successfully", {
      username,
      articleCount: articles.length,
    });

    return {
      username,
      articleCount: articles.length,
      articles,
      source: "scrape",
      hasMore: articles.length >= limit,
    };
  } catch (error) {
    if (error instanceof AuthorScraperError) {
      throw error;
    }

    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error("Failed to scrape author page", error as Error, { username });
    throw new AuthorScraperError(message, username);
  } finally {
    await context.close();
  }
}

/**
 * 무한 스크롤로 더 많은 글 로드
 */
async function scrollForMoreArticles(
  page: Page,
  count: number
): Promise<void> {
  for (let i = 0; i < count; i++) {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1500);
  }
}

/**
 * 페이지에서 글 목록 추출
 */
async function extractArticlesFromPage(
  page: Page,
  limit: number
): Promise<AuthorArticle[]> {
  // Medium의 글 링크 셀렉터 - article 내의 링크들 찾기
  const articleElements = await page.locator("article").all();
  const articles: AuthorArticle[] = [];
  const seenUrls = new Set<string>();

  for (const element of articleElements) {
    if (articles.length >= limit) break;

    try {
      // 제목 추출 (h2 또는 h3)
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

      // 요약 추출
      const excerptElement = element.locator("p").first();
      const excerpt = await excerptElement.textContent().catch(() => null);

      // 읽기 시간 추출
      const readingTimeElement = element.locator('[class*="readingTime"], span:has-text("min read")');
      const readingTime = await readingTimeElement.textContent().catch(() => null);

      // 발행일 추출 (있는 경우)
      const dateElement = element.locator("time");
      const publishedAt = await dateElement.getAttribute("datetime").catch(() => null);

      articles.push({
        title: title.trim(),
        url,
        publishedAt,
        updatedAt: null,
        author: null,
        excerpt: excerpt?.trim() || null,
        categories: [],
        content: null,
        claps: null,
        readingTime: readingTime?.trim() || null,
        source: "scrape",
      });
    } catch {
      // 개별 글 추출 실패 시 건너뜀
      continue;
    }
  }

  return articles;
}
