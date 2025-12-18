import { chromium } from "playwright-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import type { Browser, BrowserContext } from "playwright";
import { Readability } from "@mozilla/readability";
import { parseHTML } from "linkedom";
import TurndownService from "turndown";
import { existsSync, mkdirSync, chmodSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import { parseArticle, type Article } from "../types/article.js";
import { TIMEOUTS } from "../config/constants.js";
import { logger } from "../utils/logger.js";
import { ArticleExtractionError } from "../utils/errors.js";

// Apply stealth plugin to avoid bot detection
chromium.use(StealthPlugin());

let browser: Browser | null = null;
let activeContext: BrowserContext | null = null;
let browserHeadlessMode: boolean | null = null;

// Storage state file path
const STORAGE_STATE_PATH = join(homedir(), ".medium-mcp", "auth.json");

export function getStorageStatePath(): string {
  return STORAGE_STATE_PATH;
}

export function isLoggedIn(): boolean {
  return existsSync(STORAGE_STATE_PATH);
}

async function getBrowser(headless: boolean = true): Promise<Browser> {
  // Close existing browser if headless mode changed
  if (browser && browser.isConnected() && browserHeadlessMode !== headless) {
    logger.info("Browser headless mode changed, restarting browser", { headless });
    await closeBrowser();
  }

  if (!browser || !browser.isConnected()) {
    logger.info("Launching browser", { headless });
    browser = await chromium.launch({ headless });
    browserHeadlessMode = headless;
  }
  return browser;
}

export async function closeBrowser(): Promise<void> {
  // Close active context first to prevent resource leak
  if (activeContext) {
    try {
      await activeContext.close();
      logger.debug("Browser context closed");
    } catch {
      // Context may already be closed, ignore
    }
    activeContext = null;
  }

  if (browser) {
    try {
      await browser.close();
      logger.debug("Browser closed");
    } catch {
      // Browser may already be closed, ignore
    }
    browser = null;
    browserHeadlessMode = null;
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
  logger.info("Opening login page");

  // Close existing browser if any
  await closeBrowser();

  // Launch browser in headful mode for manual login
  const browserInstance = await getBrowser(false);
  activeContext = await browserInstance.newContext(BROWSER_CONTEXT_OPTIONS);
  const page = await activeContext.newPage();

  await page.goto("https://medium.com/m/signin", {
    waitUntil: "domcontentloaded",
    timeout: TIMEOUTS.LOGIN,
  });

  logger.info("Login page opened successfully");
  return "Browser opened for login. Please complete the login process in the browser window, then use 'save_login' tool to save your session.";
}

export async function saveLoginState(): Promise<string> {
  if (!browser || !browser.isConnected()) {
    throw new Error("No browser session found. Please run 'login' first.");
  }

  if (!activeContext) {
    throw new Error("No browser context found. Please run 'login' first.");
  }

  // Ensure directory exists with secure permissions (owner only)
  const dir = join(homedir(), ".medium-mcp");
  mkdirSync(dir, { recursive: true, mode: 0o700 });

  // Save storage state
  await activeContext.storageState({ path: STORAGE_STATE_PATH });

  // Set secure file permissions (owner read/write only)
  chmodSync(STORAGE_STATE_PATH, 0o600);

  // Close the browser after saving
  await closeBrowser();

  logger.info("Login state saved", { path: STORAGE_STATE_PATH });
  return `Login state saved to ${STORAGE_STATE_PATH}. You can now use 'read_article' to access member-only content.`;
}

export async function clearLoginState(): Promise<string> {
  if (existsSync(STORAGE_STATE_PATH)) {
    const { unlinkSync } = await import("fs");
    unlinkSync(STORAGE_STATE_PATH);
    logger.info("Login state cleared");
    return "Login state cleared successfully.";
  }

  return "No login state found.";
}

export async function extractArticle(url: string): Promise<Article> {
  logger.info("Extracting article", { url });

  const browserInstance = await getBrowser(true);

  // Create context with storage state if available
  const hasAuth = existsSync(STORAGE_STATE_PATH);
  const contextOptions = {
    ...BROWSER_CONTEXT_OPTIONS,
    ...(hasAuth && { storageState: STORAGE_STATE_PATH }),
  };

  if (hasAuth) {
    logger.debug("Using saved authentication state");
  }

  const context = await browserInstance.newContext(contextOptions);
  const page = await context.newPage();

  try {
    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: TIMEOUTS.NAVIGATION,
    });

    // Wait for article content to load
    const hasArticle = await page
      .waitForSelector("article", { timeout: TIMEOUTS.SELECTOR })
      .then(() => true)
      .catch(() => {
        logger.warn("Article selector not found, proceeding anyway", { url });
        return false;
      });

    if (!hasArticle) {
      logger.debug("Attempting extraction without article selector");
    }

    const html = await page.content();

    // Parse with linkedom and Readability
    const { document } = parseHTML(html);
    // Set document URL for relative path resolution
    Object.defineProperty(document, "baseURI", { value: url });
    const reader = new Readability(document);
    const article = reader.parse();

    if (!article) {
      throw new ArticleExtractionError("Failed to extract article content", url);
    }

    // Convert HTML to Markdown
    const turndown = new TurndownService({
      headingStyle: "atx",
      codeBlockStyle: "fenced",
    });
    const markdown = turndown.turndown(article.content || "");

    if (!markdown.trim()) {
      throw new ArticleExtractionError("Extracted content is empty", url);
    }

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

    // Validate and return article using Zod schema
    const result = parseArticle({
      title: article.title || "Untitled",
      author: authorMeta ?? article.byline ?? null,
      publishedAt: publishedMeta ?? null,
      content: markdown,
      excerpt: article.excerpt ?? null,
      url,
    });

    logger.info("Article extracted successfully", {
      title: result.title,
      contentLength: result.content.length,
    });

    return result;
  } catch (error) {
    if (error instanceof ArticleExtractionError) {
      logger.error("Article extraction failed", error, { url });
      throw error;
    }

    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error("Unexpected error during extraction", error as Error, { url });
    throw new ArticleExtractionError(message, url, error as Error);
  } finally {
    await context.close();
  }
}
