import Parser from "rss-parser";
import type {
  AuthorArticle,
  AuthorArticlesResponse,
} from "../types/author-article.js";
import { logger } from "../utils/logger.js";
import { RSSFeedError } from "../utils/errors.js";

// Medium RSS 피드의 커스텀 필드 정의
interface MediumFeedItem {
  "dc:creator"?: string;
  "atom:updated"?: string;
  "content:encoded"?: string;
  categories?: string[];
}

// RSS 파서 설정 (Medium 커스텀 필드 포함)
const parser = new Parser<object, MediumFeedItem>({
  customFields: {
    item: [
      ["dc:creator", "dc:creator"],
      ["atom:updated", "atom:updated"],
      ["content:encoded", "content:encoded"],
    ],
  },
});

/**
 * Author의 RSS 피드에서 글 목록 가져오기
 * 빠르고 안정적이지만 최근 ~10개 글만 제공
 */
export async function fetchAuthorArticlesFromRSS(
  username: string
): Promise<AuthorArticlesResponse> {
  const feedUrl = `https://medium.com/feed/@${username}`;
  logger.info("Fetching RSS feed", { username, feedUrl });

  try {
    const feed = await parser.parseURL(feedUrl);

    const articles: AuthorArticle[] = feed.items.map((item) => ({
      title: item.title || "Untitled",
      url: item.link || "",
      publishedAt: item.pubDate || null,
      updatedAt: item["atom:updated"] || null,
      author: item["dc:creator"] || null,
      excerpt: item.contentSnippet || null,
      categories: item.categories || [],
      content: item["content:encoded"] || null,
      claps: null,
      readingTime: null,
      source: "rss" as const,
    }));

    logger.info("RSS feed fetched successfully", {
      username,
      articleCount: articles.length,
    });

    return {
      username,
      articleCount: articles.length,
      articles,
      source: "rss",
      hasMore: true, // RSS는 최근 ~10개만 제공하므로 더 있을 수 있음
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error("Failed to fetch RSS feed", error as Error, { username });
    throw new RSSFeedError(message, username);
  }
}

/**
 * 글 목록에서 키워드로 필터링
 * 제목, 요약, 카테고리에서 검색
 */
export function filterArticlesByKeyword(
  articles: AuthorArticle[],
  keyword: string
): AuthorArticle[] {
  const lowerKeyword = keyword.toLowerCase();

  return articles.filter(
    (article) =>
      article.title.toLowerCase().includes(lowerKeyword) ||
      article.excerpt?.toLowerCase().includes(lowerKeyword) ||
      article.categories.some((cat) => cat.toLowerCase().includes(lowerKeyword))
  );
}
