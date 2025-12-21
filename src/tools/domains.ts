import { z } from "zod";
import { server } from "../server.js";
import { loadSettings, saveSettings, getConfigPath } from "../config/settings.js";
import {
  getValidDomains,
  invalidateDomainCache,
  DEFAULT_MEDIUM_DOMAINS,
} from "../config/constants.js";
import { successResponse, errorResponse } from "../utils/response.js";
import { logger } from "../utils/logger.js";

/**
 * 도메인 추가 도구
 */
server.registerTool(
  "add_domain",
  {
    title: "Add Medium Domain",
    description:
      "Add a custom Medium partner domain to the allowed list. The domain will be saved to config file.",
    inputSchema: {
      domain: z
        .string()
        .min(3)
        .describe("Domain to add (e.g., stackademic.com, blog.example.com)"),
    },
  },
  async ({ domain }) => {
    try {
      // 도메인 정규화 (소문자, 공백 제거)
      const normalizedDomain = domain.trim().toLowerCase();

      // 기본 유효성 검사
      if (!normalizedDomain.includes(".")) {
        return errorResponse("Invalid domain format. Domain must include a dot.");
      }

      const settings = loadSettings();

      // 이미 기본 도메인에 있는지 확인
      if (DEFAULT_MEDIUM_DOMAINS.includes(normalizedDomain as typeof DEFAULT_MEDIUM_DOMAINS[number])) {
        return successResponse({
          message: `Domain '${normalizedDomain}' is already a default domain.`,
          domain: normalizedDomain,
        });
      }

      // 이미 추가된 도메인인지 확인
      if (settings.additionalDomains.includes(normalizedDomain)) {
        return successResponse({
          message: `Domain '${normalizedDomain}' already exists in custom domains.`,
          domain: normalizedDomain,
        });
      }

      // 도메인 추가 및 저장
      settings.additionalDomains.push(normalizedDomain);
      saveSettings(settings);
      invalidateDomainCache();

      logger.info("Domain added", { domain: normalizedDomain });

      return successResponse({
        message: `Domain added: ${normalizedDomain}`,
        domain: normalizedDomain,
        allDomains: getValidDomains(),
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logger.error("Failed to add domain", error as Error, { domain });
      return errorResponse(errorMessage);
    }
  }
);

/**
 * 도메인 목록 조회 도구
 */
server.registerTool(
  "list_domains",
  {
    title: "List Medium Domains",
    description: "Show all allowed Medium domains (default + custom + environment)",
    inputSchema: {},
  },
  async () => {
    try {
      const settings = loadSettings();
      const allDomains = getValidDomains();

      return successResponse({
        defaultDomains: [...DEFAULT_MEDIUM_DOMAINS],
        customDomains: settings.additionalDomains,
        allDomains,
        configPath: getConfigPath(),
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logger.error("Failed to list domains", error as Error);
      return errorResponse(errorMessage);
    }
  }
);

/**
 * 도메인 제거 도구
 */
server.registerTool(
  "remove_domain",
  {
    title: "Remove Custom Domain",
    description: "Remove a custom domain from the allowed list. Cannot remove default domains.",
    inputSchema: {
      domain: z.string().min(3).describe("Domain to remove"),
    },
  },
  async ({ domain }) => {
    try {
      const normalizedDomain = domain.trim().toLowerCase();
      const settings = loadSettings();

      // 기본 도메인은 제거 불가
      if (DEFAULT_MEDIUM_DOMAINS.includes(normalizedDomain as typeof DEFAULT_MEDIUM_DOMAINS[number])) {
        return errorResponse(
          `Cannot remove '${normalizedDomain}' - it is a default domain.`
        );
      }

      const index = settings.additionalDomains.indexOf(normalizedDomain);
      if (index === -1) {
        return errorResponse(`Domain '${normalizedDomain}' not found in custom domains.`);
      }

      settings.additionalDomains.splice(index, 1);
      saveSettings(settings);
      invalidateDomainCache();

      logger.info("Domain removed", { domain: normalizedDomain });

      return successResponse({
        message: `Domain removed: ${normalizedDomain}`,
        domain: normalizedDomain,
        allDomains: getValidDomains(),
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logger.error("Failed to remove domain", error as Error, { domain });
      return errorResponse(errorMessage);
    }
  }
);
