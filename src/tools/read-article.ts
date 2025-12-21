import { z } from "zod";
import { server } from "../server.js";
import { extractArticle } from "../services/article-extractor.js";
import { isValidMediumUrl, getValidDomains } from "../config/constants.js";
import { successResponse, jsonErrorResponse } from "../utils/response.js";
import { logger } from "../utils/logger.js";
import { ArticleExtractionError } from "../utils/errors.js";

server.registerTool(
  "read_article",
  {
    title: "Read Medium Article",
    description:
      "Read and extract content from a Medium article URL. Returns the article title, author, content in Markdown format, and metadata.",
    inputSchema: {
      url: z.string().url().describe("Medium article URL to read"),
    },
  },
  async ({ url }) => {
    try {
      // Validate Medium URL
      if (!isValidMediumUrl(url)) {
        logger.warn("Invalid Medium URL provided", { url });
        return jsonErrorResponse({
          error: "Invalid URL. Please provide a Medium article URL.",
          details: `Supported domains: ${getValidDomains().join(", ")}`,
        });
      }

      const article = await extractArticle(url);
      return successResponse(article);
    } catch (error) {
      if (error instanceof ArticleExtractionError) {
        return jsonErrorResponse({
          error: error.message,
          details: error.toUserMessage(),
        });
      }

      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      logger.error("Unexpected error in read_article", error as Error, { url });
      return jsonErrorResponse({ error: errorMessage });
    }
  }
);
