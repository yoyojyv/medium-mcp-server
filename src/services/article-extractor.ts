import { chromium, Browser } from "playwright";
import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
import TurndownService from "turndown";
import { existsSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import type { Article } from "../types/article.js";

let browser: Browser | null = null;

// Storage state file path
const STORAGE_STATE_PATH = join(homedir(), ".medium-mcp", "auth.json");

export function getStorageStatePath(): string {
  return STORAGE_STATE_PATH;
}

export function isLoggedIn(): boolean {
  return existsSync(STORAGE_STATE_PATH);
}

async function getBrowser(headless: boolean = true): Promise<Browser> {
  if (!browser || !browser.isConnected()) {
    browser = await chromium.launch({ headless });
  }
  return browser;
}

export async function closeBrowser(): Promise<void> {
  if (browser) {
    await browser.close();
    browser = null;
  }
}

export async function openLoginPage(): Promise<string> {
  // Close existing browser if any
  await closeBrowser();

  // Launch browser in headful mode for manual login
  const browserInstance = await getBrowser(false);
  const context = await browserInstance.newContext({
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  });
  const page = await context.newPage();

  await page.goto("https://medium.com/m/signin", {
    waitUntil: "domcontentloaded",
  });

  return "Browser opened for login. Please complete the login process in the browser window, then use 'save_login' tool to save your session.";
}

export async function saveLoginState(): Promise<string> {
  if (!browser || !browser.isConnected()) {
    throw new Error("No browser session found. Please run 'login' first.");
  }

  const contexts = browser.contexts();
  if (contexts.length === 0) {
    throw new Error("No browser context found.");
  }

  const context = contexts[0];

  // Ensure directory exists
  const dir = join(homedir(), ".medium-mcp");
  const { mkdirSync } = await import("fs");
  mkdirSync(dir, { recursive: true });

  // Save storage state
  await context.storageState({ path: STORAGE_STATE_PATH });

  // Close the browser after saving
  await closeBrowser();

  return `Login state saved to ${STORAGE_STATE_PATH}. You can now use 'read_article' to access member-only content.`;
}

export async function clearLoginState(): Promise<string> {
  const { unlinkSync } = await import("fs");

  if (existsSync(STORAGE_STATE_PATH)) {
    unlinkSync(STORAGE_STATE_PATH);
    return "Login state cleared successfully.";
  }

  return "No login state found.";
}

export async function extractArticle(url: string): Promise<Article> {
  const browserInstance = await getBrowser(true);

  // Create context with storage state if available
  const contextOptions: Parameters<Browser["newContext"]>[0] = {
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  };

  if (existsSync(STORAGE_STATE_PATH)) {
    contextOptions.storageState = STORAGE_STATE_PATH;
  }

  const context = await browserInstance.newContext(contextOptions);
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
