import { z } from "zod";
import { server } from "../server.js";
import {
  fetchAuthorArticlesFromRSS,
  filterArticlesByKeyword,
} from "../services/rss-feed.js";
import { scrapeAuthorArticles } from "../services/author-scraper.js";
import { successResponse, jsonErrorResponse } from "../utils/response.js";
import { logger } from "../utils/logger.js";
import { RSSFeedError, AuthorScraperError } from "../utils/errors.js";

/**
 * Author 글 목록 가져오기 도구
 */
server.registerTool(
  "list_author_articles",
  {
    title: "List Author Articles",
    description:
      "Get a list of articles from a Medium author. " +
      "Uses RSS feed by default (fast, ~10 recent articles with full content). " +
      "Use source='scrape' for more articles (slower, may trigger bot detection).",
    inputSchema: {
      username: z
        .string()
        .min(1)
        .describe("Medium username (without @ prefix)"),
      source: z
        .enum(["rss", "scrape"])
        .default("rss")
        .describe(
          "Data source: 'rss' (fast, limited to ~10 recent) or 'scrape' (more articles, slower)"
        ),
      limit: z
        .number()
        .min(1)
        .max(50)
        .default(10)
        .describe("Maximum number of articles (only applies to scrape mode)"),
      keyword: z
        .string()
        .optional()
        .describe("Filter articles by keyword in title, excerpt, or tags"),
    },
  },
  async ({ username, source, limit, keyword }) => {
    try {
      // @ 접두사 제거
      const cleanUsername = username.replace(/^@/, "");

      let response;

      if (source === "rss") {
        response = await fetchAuthorArticlesFromRSS(cleanUsername);
      } else {
        response = await scrapeAuthorArticles(cleanUsername, { limit });
      }

      // 키워드 필터링 (있는 경우)
      if (keyword) {
        response.articles = filterArticlesByKeyword(response.articles, keyword);
        response.articleCount = response.articles.length;
      }

      return successResponse(response);
    } catch (error) {
      if (error instanceof RSSFeedError) {
        return jsonErrorResponse({
          error: error.message,
          details: error.toUserMessage(),
        });
      }

      if (error instanceof AuthorScraperError) {
        return jsonErrorResponse({
          error: error.message,
          details: error.toUserMessage(),
        });
      }

      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      logger.error("Unexpected error in list_author_articles", error as Error, {
        username,
      });
      return jsonErrorResponse({ error: errorMessage });
    }
  }
);
