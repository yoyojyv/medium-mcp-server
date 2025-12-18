/**
 * 커스텀 에러 클래스
 */

export class ArticleExtractionError extends Error {
  constructor(
    message: string,
    public readonly url: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = "ArticleExtractionError";
  }

  toUserMessage(): string {
    return (
      `${this.message}\n\n` +
      `URL: ${this.url}\n` +
      `가능한 원인:\n` +
      `- URL이 유효하지 않음\n` +
      `- 멤버십 전용 콘텐츠 (로그인 필요)\n` +
      `- 지원하지 않는 Medium 페이지 형식\n\n` +
      `멤버십 콘텐츠라면 'login' 도구로 먼저 로그인하세요.`
    );
  }
}

export class BrowserError extends Error {
  constructor(
    message: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = "BrowserError";
  }
}

export class LoginError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LoginError";
  }
}
