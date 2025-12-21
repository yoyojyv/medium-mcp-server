import { loadSettings, getEnvDomains } from "./settings.js";

/**
 * 타임아웃 설정 (밀리초)
 */
export const TIMEOUTS = {
  /** 페이지 네비게이션 타임아웃 */
  NAVIGATION: 15_000,
  /** DOM 셀렉터 대기 타임아웃 */
  SELECTOR: 5_000,
  /** 로그인 페이지 대기 타임아웃 */
  LOGIN: 60_000,
} as const;

/**
 * 기본 지원 Medium 도메인 목록
 */
export const DEFAULT_MEDIUM_DOMAINS = [
  "medium.com",
  "towardsdatascience.com",
  "betterprogramming.pub",
  "levelup.gitconnected.com",
  "uxdesign.cc",
  "eand.co",
  "betterhumans.pub",
  "writingcooperative.com",
] as const;

/**
 * 도메인 캐시 (성능 최적화)
 */
let cachedDomains: string[] | null = null;

/**
 * 유효한 모든 도메인 목록 반환
 * - 기본 도메인 + config.json + 환경변수 병합
 */
export function getValidDomains(): string[] {
  if (cachedDomains) return cachedDomains;

  const settings = loadSettings();
  const envDomains = getEnvDomains();

  // 병합 및 중복 제거
  cachedDomains = [
    ...new Set([
      ...DEFAULT_MEDIUM_DOMAINS,
      ...settings.additionalDomains,
      ...envDomains,
    ]),
  ];

  return cachedDomains;
}

/**
 * 도메인 캐시 무효화 (설정 변경 시 호출)
 */
export function invalidateDomainCache(): void {
  cachedDomains = null;
}

/**
 * URL이 유효한 Medium 도메인인지 확인
 */
export function isValidMediumUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const domains = getValidDomains();
    return domains.some(
      (domain) =>
        urlObj.hostname === domain ||
        urlObj.hostname.endsWith(`.${domain}`) ||
        urlObj.hostname.endsWith(".medium.com")
    );
  } catch {
    return false;
  }
}
