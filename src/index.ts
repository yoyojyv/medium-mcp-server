#!/usr/bin/env node

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { server } from "./server.js";
import "./tools/read-article.js";
import "./tools/auth.js";
import "./tools/domains.js";
import "./tools/author-articles.js";
import "./tools/search.js";
import { closeBrowser } from "./services/article-extractor.js";

let isShuttingDown = false;

async function gracefulShutdown(signal: string): Promise<void> {
  // Prevent multiple shutdown attempts
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.error(`Received ${signal}, shutting down gracefully...`);

  try {
    await closeBrowser();
  } catch (error) {
    console.error("Error closing browser:", error);
  }

  try {
    await server.close();
  } catch (error) {
    console.error("Error closing server:", error);
  }

  process.exit(0);
}

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Cleanup on exit
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
}

main().catch(console.error);
