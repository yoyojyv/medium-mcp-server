# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.2.0] - 2026-01-03

### Added
- **Author Articles Tool** (`list_author_articles`): Author의 글 목록을 가져오는 기능
  - RSS 피드 기반 (빠르고 안정적, ~10개 최근 글)
  - 스크래핑 기반 옵션 (더 많은 글, 봇 탐지 위험)
  - 키워드 필터링 지원
- **Search Articles Tool** (`search_articles`): Medium 전체 검색 기능
  - Playwright 기반 스크래핑
- **Search Author Articles Tool** (`search_author_articles`): 특정 Author 내 검색 기능
  - RSS 피드 기반 키워드 필터링
- New types: `AuthorArticle`, `AuthorArticlesResponse`, `SearchResult`, `SearchResponse`
- New error classes: `RSSFeedError`, `AuthorScraperError`, `SearchScraperError`
- `rss-parser` dependency for RSS feed parsing

### Changed
- Exported `getBrowser` and `BROWSER_CONTEXT_OPTIONS` from `article-extractor.ts` for reuse

## [1.1.0] - 2025-12-xx

### Added
- Domain configuration file-based management
- `add_domain`, `list_domains`, `remove_domain` tools
- Environment variable support for additional domains (`MEDIUM_ADDITIONAL_DOMAINS`)
- Custom domain persistence in `~/.medium-mcp/config.json`

## [1.0.0] - 2025-12-xx

### Added
- Initial release
- `read_article` tool for extracting Medium article content
- `login`, `save_login`, `logout`, `login_status` tools for authentication
- Playwright-based headless browser for dynamic content
- Mozilla Readability for content extraction
- Markdown conversion with Turndown
- Support for Medium partner domains (towardsdatascience.com, betterprogramming.pub, etc.)
- Stealth plugin for bot detection bypass

[Unreleased]: https://github.com/yoyojyv/medium-mcp-server/compare/v1.2.0...HEAD
[1.2.0]: https://github.com/yoyojyv/medium-mcp-server/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/yoyojyv/medium-mcp-server/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/yoyojyv/medium-mcp-server/releases/tag/v1.0.0
