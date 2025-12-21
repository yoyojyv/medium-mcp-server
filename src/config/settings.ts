import { existsSync, readFileSync, writeFileSync, mkdirSync, chmodSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import { logger } from "../utils/logger.js";

const CONFIG_DIR = join(homedir(), ".medium-mcp");
const CONFIG_PATH = join(CONFIG_DIR, "config.json");

/**
 * 설정 파일 구조
 */
export interface Settings {
  additionalDomains: string[];
}

const DEFAULT_SETTINGS: Settings = {
  additionalDomains: [],
};

/**
 * 설정 파일 경로 반환
 */
export function getConfigPath(): string {
  return CONFIG_PATH;
}

/**
 * 설정 파일 읽기
 */
export function loadSettings(): Settings {
  if (!existsSync(CONFIG_PATH)) {
    return { ...DEFAULT_SETTINGS };
  }

  try {
    const content = readFileSync(CONFIG_PATH, "utf-8");
    const parsed = JSON.parse(content) as Partial<Settings>;

    // 필수 필드 기본값 병합
    return {
      additionalDomains: Array.isArray(parsed.additionalDomains)
        ? parsed.additionalDomains.filter((d): d is string => typeof d === "string")
        : [],
    };
  } catch (error) {
    logger.warn("Failed to load settings, using defaults", { error, path: CONFIG_PATH });
    return { ...DEFAULT_SETTINGS };
  }
}

/**
 * 환경변수에서 추가 도메인 파싱
 * MEDIUM_ADDITIONAL_DOMAINS=domain1.com,domain2.com
 */
export function getEnvDomains(): string[] {
  const envValue = process.env.MEDIUM_ADDITIONAL_DOMAINS;
  if (!envValue) return [];

  return envValue
    .split(",")
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * 설정 파일 저장
 */
export function saveSettings(settings: Settings): void {
  mkdirSync(CONFIG_DIR, { recursive: true, mode: 0o700 });
  writeFileSync(CONFIG_PATH, JSON.stringify(settings, null, 2));
  chmodSync(CONFIG_PATH, 0o600);

  logger.info("Settings saved", { path: CONFIG_PATH });
}
