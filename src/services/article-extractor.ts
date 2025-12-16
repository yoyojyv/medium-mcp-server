import { chromium, Browser } from "playwright";
import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
import TurndownService from "turndown";
import type { Article } from "../types/article.js";

let browser: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (!browser) {
    browser = await chromium.launch({ headless: true });
  }
  return browser;
}

export async function closeBrowser(): Promise<void> {
  if (browser) {
    await browser.close();
    browser = null;
  }
}

export async function extractArticle(url: string): Promise<Article> {
  const browserInstance = await getBrowser();
  const context = await browserInstance.newContext({
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  });
  const page = await context.newPage();

  try {
    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    // Wait for article content to load
    await page.waitForSelector("article", { timeout: 10000 }).catch(() => {
      // Article selector might not exist, continue anyway
    });

    const html = await page.content();

    // Parse with JSDOM and Readability
    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (!article) {
      throw new Error("Failed to extract article content");
    }

    // Convert HTML to Markdown
    const turndown = new TurndownService({
      headingStyle: "atx",
      codeBlockStyle: "fenced",
    });
    const markdown = turndown.turndown(article.content || "");

    // Extract author from meta or page
    const authorMeta = await page
      .locator('meta[name="author"]')
      .getAttribute("content")
      .catch(() => null);

    // Extract published date
    const publishedMeta = await page
      .locator('meta[property="article:published_time"]')
      .getAttribute("content")
      .catch(() => null);

    return {
      title: article.title || "Untitled",
      author: authorMeta ?? article.byline ?? null,
      publishedAt: publishedMeta ?? null,
      content: markdown,
      excerpt: article.excerpt ?? null,
      url,
    };
  } finally {
    await context.close();
  }
}
