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

export class RSSFeedError extends Error {
  constructor(
    message: string,
    public readonly username: string
  ) {
    super(message);
    this.name = "RSSFeedError";
  }

  toUserMessage(): string {
    return (
      `${this.message}\n\n` +
      `Username: @${this.username}\n` +
      `가능한 원인:\n` +
      `- 사용자명이 올바르지 않음\n` +
      `- 사용자가 존재하지 않음\n` +
      `- 네트워크 연결 문제`
    );
  }
}

export class AuthorScraperError extends Error {
  constructor(
    message: string,
    public readonly username: string
  ) {
    super(message);
    this.name = "AuthorScraperError";
  }

  toUserMessage(): string {
    return (
      `${this.message}\n\n` +
      `Username: @${this.username}\n` +
      `가능한 원인:\n` +
      `- 봇 탐지로 차단됨\n` +
      `- 사용자 페이지에 접근 불가\n` +
      `- 네트워크 연결 문제\n\n` +
      `RSS 모드를 사용해보세요: source='rss'`
    );
  }
}

export class SearchScraperError extends Error {
  constructor(
    message: string,
    public readonly query: string
  ) {
    super(message);
    this.name = "SearchScraperError";
  }

  toUserMessage(): string {
    return (
      `${this.message}\n\n` +
      `Query: ${this.query}\n` +
      `가능한 원인:\n` +
      `- 봇 탐지로 차단됨\n` +
      `- 검색 페이지에 접근 불가\n` +
      `- 네트워크 연결 문제\n\n` +
      `나중에 다시 시도하거나 특정 Author의 RSS를 사용해보세요.`
    );
  }
}
