import { z } from "zod";
import { server } from "../server.js";
import { extractArticle } from "../services/article-extractor.js";

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
      const urlObj = new URL(url);
      const validDomains = [
        "medium.com",
        "towardsdatascience.com",
        "betterprogramming.pub",
        "levelup.gitconnected.com",
      ];
      const isMediumUrl = validDomains.some(
        (domain) =>
          urlObj.hostname === domain ||
          urlObj.hostname.endsWith(`.${domain}`) ||
          urlObj.hostname.endsWith(".medium.com")
      );

      if (!isMediumUrl) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                { error: "Invalid URL. Please provide a Medium article URL." },
                null,
                2
              ),
            },
          ],
          isError: true,
        };
      }

      const article = await extractArticle(url);

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(article, null, 2),
          },
        ],
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ error: errorMessage }, null, 2),
          },
        ],
        isError: true,
      };
    }
  }
);
