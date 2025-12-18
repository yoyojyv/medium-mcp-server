import { chromium } from "playwright-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import type { Browser } from "playwright";
import { Readability } from "@mozilla/readability";
import { parseHTML } from "linkedom";
import TurndownService from "turndown";
import { existsSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import type { Article } from "../types/article.js";

// Apply stealth plugin to avoid bot detection
chromium.use(StealthPlugin());

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

// Realistic browser context options to avoid bot detection
const BROWSER_CONTEXT_OPTIONS = {
  userAgent:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  viewport: { width: 1920, height: 1080 },
  deviceScaleFactor: 2,
  hasTouch: false,
  locale: "en-US",
  timezoneId: "America/New_York",
  permissions: ["geolocation"],
  extraHTTPHeaders: {
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    "sec-ch-ua": '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"macOS"',
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Sec-Fetch-User": "?1",
    "Upgrade-Insecure-Requests": "1",
  },
};

export async function openLoginPage(): Promise<string> {
  // Close existing browser if any
  await closeBrowser();

  // Launch browser in headful mode for manual login
  const browserInstance = await getBrowser(false);
  const context = await browserInstance.newContext(BROWSER_CONTEXT_OPTIONS);
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
  const contextOptions = {
    ...BROWSER_CONTEXT_OPTIONS,
    ...(existsSync(STORAGE_STATE_PATH) && { storageState: STORAGE_STATE_PATH }),
  };

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

    // Parse with linkedom and Readability
    const { document } = parseHTML(html);
    // Set document URL for relative path resolution
    Object.defineProperty(document, "baseURI", { value: url });
    const reader = new Readability(document);
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
