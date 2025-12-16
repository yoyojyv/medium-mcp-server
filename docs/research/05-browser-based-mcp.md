# 웹 브라우저 기반 MCP 서버 Research

## 1. 개요

웹 브라우저 기반 MCP 서버는 Puppeteer나 Playwright 같은 헤드리스 브라우저를 활용하여 동적 웹 콘텐츠에 접근합니다. RSS 피드의 제한(최대 10개 포스트)을 극복하고, JavaScript 렌더링이 필요한 페이지에서도 콘텐츠를 추출할 수 있습니다.

## 2. 주요 브라우저 기반 MCP 서버들

### 2.1 fetcher-mcp (권장)

**GitHub**: https://github.com/jae-jae/fetcher-mcp

Playwright 헤드리스 브라우저와 Mozilla Readability를 결합한 MCP 서버입니다.

#### 핵심 특징
- **JavaScript 실행**: 동적 웹 콘텐츠 처리 가능
- **자동 콘텐츠 추출**: Readability 알고리즘으로 본문만 추출
- **병렬 처리**: 다중 URL 동시 처리
- **리소스 최적화**: 이미지/폰트/미디어 자동 차단

#### 제공 Tools

| Tool | 설명 | 주요 파라미터 |
|------|------|-------------|
| `fetch_url` | 단일 URL 콘텐츠 추출 | url, timeout, extractContent, returnHtml |
| `fetch_urls` | 다중 URL 병렬 처리 | urls, timeout |
| `browser_install` | Chromium 브라우저 설치 | withDeps, force |

#### 설정 예시
```json
{
  "mcpServers": {
    "fetcher": {
      "command": "npx",
      "args": ["-y", "fetcher-mcp"]
    }
  }
}
```

#### 사용 라이브러리
- Playwright (브라우저 제어)
- Readability (콘텐츠 추출)
- TypeScript

---

### 2.2 Microsoft Playwright MCP

**GitHub**: https://github.com/microsoft/playwright-mcp

Microsoft 공식 Playwright MCP 서버입니다.

#### 핵심 특징
- **접근성 트리 기반**: 스크린샷 대신 구조화된 데이터 사용
- **비전 모델 불필요**: 순수 텍스트 기반 처리
- **다중 브라우저**: Chrome, Firefox, WebKit, Edge 지원
- **결정론적 도구**: 스크린샷 기반의 모호함 회피

#### 주요 설정 옵션
```bash
--browser <browser>      # chromium, firefox, webkit
--headless              # 헤드리스 모드
--user-data-dir <path>  # 프로필 디렉토리
--isolated              # 격리 모드
--timeout-action <ms>   # 액션 타임아웃
```

#### 설정 예시
```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"]
    }
  }
}
```

---

### 2.3 executeautomation/mcp-playwright

**GitHub**: https://github.com/executeautomation/mcp-playwright

5.1k+ 스타를 받은 인기 Playwright MCP 서버입니다.

#### 핵심 특징
- **143개 디바이스 에뮬레이션**: iPhone, iPad, Pixel, Galaxy 등
- **자동 브라우저 설치**: Chromium, Firefox, WebKit 자동 다운로드
- **스크린샷 캡처**: 시각적 검증 지원
- **HTTP/stdio 모드**: 다양한 연결 방식

#### 설정 예시 (stdio)
```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["-y", "@executeautomation/playwright-mcp-server"]
    }
  }
}
```

---

### 2.4 Firecrawl MCP Server

**GitHub**: https://github.com/firecrawl/firecrawl-mcp-server

클라우드 기반 웹 스크래핑 서비스입니다.

#### 핵심 특징
- **클라우드 API**: 서버 관리 불필요
- **배치 스크래핑**: 대량 URL 처리
- **사이트 맵핑**: URL 자동 발견
- **구조화된 데이터 추출**: JSON 형식 지원

#### 제공 Tools

| Tool | 설명 |
|------|------|
| `scrape` | 단일 페이지 스크래핑 |
| `batch_scrape` | 배치 스크래핑 |
| `map` | 사이트 URL 발견 |
| `crawl` | 다중 페이지 크롤링 |
| `search` | 웹 검색 |
| `extract` | 구조화된 데이터 추출 |

#### 설정 (API 키 필요)
```json
{
  "mcpServers": {
    "firecrawl": {
      "command": "npx",
      "args": ["-y", "firecrawl-mcp"],
      "env": {
        "FIRECRAWL_API_KEY": "fc-YOUR_API_KEY"
      }
    }
  }
}
```

**단점**: API 키 필요, 유료 서비스

---

### 2.5 Mozilla Readability 기반 서버들

#### read-website-fast
- 로컬에서 실행
- Mozilla Readability + Turndown
- robots.txt 준수
- 디스크 캐싱

#### server-moz-readability
- Node.js 기반
- 깔끔한 마크다운 변환
- 광고/네비게이션 제거

## 3. 기술 비교

### 3.1 RSS vs Browser 기반 비교

| 항목 | RSS 기반 | Browser 기반 |
|------|---------|-------------|
| **포스트 수 제한** | 최대 10개 | 제한 없음 |
| **JavaScript 렌더링** | 불가 | 가능 |
| **동적 콘텐츠** | 불가 | 가능 |
| **속도** | 빠름 | 상대적으로 느림 |
| **리소스 사용** | 낮음 | 높음 (브라우저 필요) |
| **설정 복잡도** | 간단 | 복잡 |
| **Rate Limiting 위험** | 낮음 | 높음 |

### 3.2 브라우저 라이브러리 비교

| 라이브러리 | 장점 | 단점 |
|-----------|------|------|
| **Playwright** | 다중 브라우저, 안정적, Microsoft 지원 | 용량 큼 |
| **Puppeteer** | Chrome 최적화, 널리 사용 | Chrome만 지원 |
| **Cheerio** | 가볍고 빠름 | JavaScript 렌더링 불가 |

## 4. Medium에 적용 시 고려사항

### 4.1 장점
- RSS 10개 제한 극복
- 전체 아티클 콘텐츠 접근
- 동적 로딩 콘텐츠 처리
- Clap 수, 댓글 등 메타데이터 추출 가능

### 4.2 단점/위험
- Medium의 Rate Limiting/차단 가능성
- Terms of Service 위반 가능성
- 리소스 사용량 증가
- 응답 시간 증가

### 4.3 권장 하이브리드 전략

```
┌─────────────────────────────────────────────────────────────┐
│                    Medium MCP Server                        │
├─────────────────────────────────────────────────────────────┤
│  1차: RSS 기반 (빠른 목록 조회)                              │
│     └─ 최신 10개 포스트 빠르게 조회                          │
│                                                             │
│  2차: Browser 기반 (상세 콘텐츠)                             │
│     └─ 개별 포스트 전체 내용 추출                           │
│     └─ Readability로 본문만 깔끔하게 추출                    │
└─────────────────────────────────────────────────────────────┘
```

## 5. 구현 옵션

### Option A: fetcher-mcp 재사용
- 기존 fetcher-mcp를 의존성으로 사용
- Medium 특화 래퍼 구현
- 장점: 검증된 구현, 빠른 개발
- 단점: 외부 의존성

### Option B: Playwright 직접 구현
- Playwright + Readability 직접 통합
- Medium 최적화된 셀렉터 사용
- 장점: 완전한 제어, Medium 특화 최적화
- 단점: 개발 시간 증가

### Option C: 하이브리드 (권장)
- RSS: 목록 조회 (rss-parser)
- Browser: 상세 콘텐츠 (Playwright + Readability)
- 장점: 각 방식의 장점 활용
- 단점: 구현 복잡도 증가

## 6. 참고 자료

- [fetcher-mcp GitHub](https://github.com/jae-jae/fetcher-mcp)
- [Microsoft Playwright MCP](https://github.com/microsoft/playwright-mcp)
- [executeautomation/mcp-playwright](https://github.com/executeautomation/mcp-playwright)
- [Firecrawl MCP Server](https://github.com/firecrawl/firecrawl-mcp-server)
- [Mozilla Readability](https://github.com/mozilla/readability)
- [Playwright 공식 문서](https://playwright.dev/)
