import { z } from "zod";
import { server } from "../server.js";
import { searchMedium } from "../services/search-scraper.js";
import {
  fetchAuthorArticlesFromRSS,
  filterArticlesByKeyword,
} from "../services/rss-feed.js";
import { successResponse, jsonErrorResponse } from "../utils/response.js";
import { logger } from "../utils/logger.js";
import { SearchScraperError, RSSFeedError } from "../utils/errors.js";

/**
 * Medium 전체 검색 도구
 */
server.registerTool(
  "search_articles",
  {
    title: "Search Articles",
    description:
      "Search for articles across all of Medium. " +
      "Uses web scraping (may trigger bot detection).",
    inputSchema: {
      query: z.string().min(1).describe("Search query"),
      limit: z
        .number()
        .min(1)
        .max(20)
        .default(10)
        .describe("Maximum number of results"),
    },
  },
  async ({ query, limit }) => {
    try {
      const response = await searchMedium(query, { limit });
      return successResponse(response);
    } catch (error) {
      if (error instanceof SearchScraperError) {
        return jsonErrorResponse({
          error: error.message,
          details: error.toUserMessage(),
        });
      }

      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      logger.error("Unexpected error in search_articles", error as Error, {
        query,
      });
      return jsonErrorResponse({ error: errorMessage });
    }
  }
);

/**
 * 특정 Author 내 검색 도구
 */
server.registerTool(
  "search_author_articles",
  {
    title: "Search Author Articles",
    description:
      "Search for articles within a specific author's posts. " +
      "Uses RSS feed (fast, limited to ~10 recent articles).",
    inputSchema: {
      username: z
        .string()
        .min(1)
        .describe("Medium username (without @ prefix)"),
      keyword: z.string().min(1).describe("Keyword to search for"),
    },
  },
  async ({ username, keyword }) => {
    try {
      const cleanUsername = username.replace(/^@/, "");
      const response = await fetchAuthorArticlesFromRSS(cleanUsername);

      // 키워드 필터링
      const filteredArticles = filterArticlesByKeyword(
        response.articles,
        keyword
      );

      return successResponse({
        username: cleanUsername,
        keyword,
        matchCount: filteredArticles.length,
        articles: filteredArticles,
        note: "Search is limited to author's ~10 most recent articles from RSS feed",
      });
    } catch (error) {
      if (error instanceof RSSFeedError) {
        return jsonErrorResponse({
          error: error.message,
          details: error.toUserMessage(),
        });
      }

      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      logger.error("Unexpected error in search_author_articles", error as Error, {
        username,
        keyword,
      });
      return jsonErrorResponse({ error: errorMessage });
    }
  }
);
