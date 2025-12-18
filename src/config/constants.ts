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
 * 지원하는 Medium 도메인 목록
 */
export const VALID_MEDIUM_DOMAINS = [
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
 * URL이 유효한 Medium 도메인인지 확인
 */
export function isValidMediumUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return VALID_MEDIUM_DOMAINS.some(
      (domain) =>
        urlObj.hostname === domain ||
        urlObj.hostname.endsWith(`.${domain}`) ||
        urlObj.hostname.endsWith(".medium.com")
    );
  } catch {
    return false;
  }
}
