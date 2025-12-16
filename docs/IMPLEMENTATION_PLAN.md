# Medium MCP Server - Implementation Plan

## 개요

이 문서는 Medium MCP Server 개발을 위한 단계별 실행 계획입니다.

---

## Phase 1: 프로젝트 설정

### Step 1.1: 기본 프로젝트 초기화

```bash
# 수행할 작업
npm init -y

# 핵심 의존성
npm install @modelcontextprotocol/sdk zod rss-parser axios cheerio

# Browser 모드 (선택사항 - Phase 2에서 추가)
npm install playwright @mozilla/readability

# 개발 의존성
npm install -D typescript @types/node tsx vitest eslint
```

**산출물:**
- `package.json`
- `tsconfig.json`
- `.gitignore`

### Step 1.2: 디렉토리 구조 생성

```
src/
├── index.ts           # 진입점
├── server.ts          # MCP 서버 설정
├── tools/             # Tool 구현
├── services/          # 비즈니스 로직
├── types/             # TypeScript 타입
└── utils/             # 유틸리티 함수
```

### Step 1.3: TypeScript 설정

**tsconfig.json 설정:**
- `target`: ES2022
- `module`: NodeNext
- `strict`: true
- `outDir`: ./dist

---

## Phase 2: 핵심 서비스 구현

### Step 2.1: RSS URL 빌더

**파일:** `src/utils/url-builder.ts`

```typescript
// 구현할 함수
export function buildUserFeedUrl(username: string): string
export function buildPublicationFeedUrl(publication: string): string
export function buildTagFeedUrl(tag: string): string
```

**테스트 케이스:**
- `@username` → `https://medium.com/feed/@username`
- `username` (@ 없이) → `https://medium.com/feed/@username`
- `publication` → `https://medium.com/feed/publication`

### Step 2.2: RSS 파서 서비스

**파일:** `src/services/rss-parser.ts`

```typescript
// 구현할 함수
export async function parseRssFeed(url: string): Promise<FeedResult>
export function transformFeedItem(item: RssItem): MediumPost
```

**기능:**
- rss-parser 라이브러리 래핑
- 에러 핸들링
- 타임아웃 설정 (5초)
- 재시도 로직 (최대 3회)

### Step 2.3: 콘텐츠 추출 서비스

**파일:** `src/services/content-extractor.ts`

```typescript
// 구현할 함수
export async function extractPostContent(url: string): Promise<PostContent>
export function cleanHtml(html: string): string
export function htmlToMarkdown(html: string): string
```

**기능:**
- Medium 포스트 페이지에서 콘텐츠 추출
- HTML → Markdown 변환
- 불필요한 요소 제거 (광고, 네비게이션 등)

---

## Phase 3: MCP Tools 구현

### Step 3.1: 기본 서버 설정

**파일:** `src/server.ts`

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function createServer(): McpServer {
  return new McpServer({
    name: "medium-mcp-server",
    version: "1.0.0",
  });
}
```

### Step 3.2: get_user_posts Tool

**파일:** `src/tools/get-user-posts.ts`

**입력 스키마:**
```typescript
z.object({
  username: z.string().describe("Medium username (with or without @)"),
  count: z.number().min(1).max(10).default(10).optional(),
})
```

**구현 로직:**
1. username 정규화 (@ 처리)
2. RSS URL 생성
3. 피드 파싱
4. 결과 변환 및 반환

### Step 3.3: get_publication_posts Tool

**파일:** `src/tools/get-publication-posts.ts`

**입력 스키마:**
```typescript
z.object({
  publication: z.string().describe("Medium publication name"),
  count: z.number().min(1).max(10).default(10).optional(),
})
```

### Step 3.4: get_tag_posts Tool

**파일:** `src/tools/get-tag-posts.ts`

**입력 스키마:**
```typescript
z.object({
  tag: z.string().describe("Topic/tag name"),
  count: z.number().min(1).max(10).default(10).optional(),
})
```

### Step 3.5: get_post_content Tool

**파일:** `src/tools/get-post-content.ts`

**입력 스키마:**
```typescript
z.object({
  url: z.string().url().describe("Medium post URL"),
})
```

**구현 로직:**
1. URL 유효성 검증 (Medium 도메인 확인)
2. 페이지 콘텐츠 가져오기
3. 본문 추출 및 정제
4. Markdown 변환
5. 메타데이터 추출 (작성자, 날짜, 태그)

---

## Phase 4: 진입점 및 통합

### Step 4.1: 메인 진입점

**파일:** `src/index.ts`

```typescript
#!/usr/bin/env node

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./server.js";
import { registerTools } from "./tools/index.js";

async function main() {
  const server = createServer();
  registerTools(server);

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
```

### Step 4.2: Tool 등록 통합

**파일:** `src/tools/index.ts`

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerGetUserPosts } from "./get-user-posts.js";
import { registerGetPublicationPosts } from "./get-publication-posts.js";
import { registerGetTagPosts } from "./get-tag-posts.js";
import { registerGetPostContent } from "./get-post-content.js";

export function registerTools(server: McpServer): void {
  registerGetUserPosts(server);
  registerGetPublicationPosts(server);
  registerGetTagPosts(server);
  registerGetPostContent(server);
}
```

---

## Phase 5: 테스트

### Step 5.1: 단위 테스트

**테스트 파일 구조:**
```
tests/
├── utils/
│   └── url-builder.test.ts
├── services/
│   ├── rss-parser.test.ts
│   └── content-extractor.test.ts
└── tools/
    └── *.test.ts
```

**테스트 케이스:**
- URL 빌더 함수 테스트
- RSS 파싱 성공/실패 케이스
- HTML 정제 테스트
- Tool 입력 검증 테스트

### Step 5.2: 통합 테스트

**테스트 시나리오:**
1. 실제 Medium RSS 피드 조회
2. 실제 포스트 콘텐츠 추출
3. MCP 클라이언트와의 통합 테스트

### Step 5.3: 수동 테스트

```bash
# 빌드
npm run build

# 테스트 실행
echo '{"jsonrpc":"2.0","method":"tools/list","id":1}' | node dist/index.js
```

---

## Phase 6: 문서화 및 배포

### Step 6.1: README 작성

**포함 내용:**
- 프로젝트 소개
- 설치 방법
- 사용 예시
- 설정 방법 (Claude Desktop, Cursor)
- API 레퍼런스
- 기여 가이드

### Step 6.2: npm 배포

```bash
# package.json 설정 확인
# - name: medium-mcp-server
# - version: 1.0.0
# - bin 필드 설정

npm login
npm publish
```

### Step 6.3: GitHub 릴리스

- 태그 생성 (v1.0.0)
- 릴리스 노트 작성
- 변경 사항 문서화

---

## Phase 7: Browser 모드 추가 (선택)

### Step 7.1: Playwright 서비스 구현

**파일:** `src/services/browser-fetcher.ts`

```typescript
import { chromium, Browser, Page } from 'playwright';
import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';

export class BrowserFetcher {
  private browser: Browser | null = null;

  async init(): Promise<void> {
    this.browser = await chromium.launch({ headless: true });
  }

  async fetchContent(url: string): Promise<ArticleContent> {
    const page = await this.browser!.newPage();
    await page.goto(url, { waitUntil: 'networkidle' });

    const html = await page.content();
    const doc = new JSDOM(html, { url });
    const reader = new Readability(doc.window.document);
    const article = reader.parse();

    await page.close();
    return article;
  }

  async close(): Promise<void> {
    await this.browser?.close();
  }
}
```

### Step 7.2: get_post_content Tool 업데이트

**입력 스키마 확장:**
```typescript
z.object({
  url: z.string().url().describe("Medium post URL"),
  useBrowser: z.boolean().default(false).describe("Use browser for full content extraction"),
})
```

**구현 로직:**
1. `useBrowser: false` → RSS/cheerio 기반 추출 (기존)
2. `useBrowser: true` → Playwright + Readability 사용

### Step 7.3: Browser 설치 Tool 추가

**파일:** `src/tools/install-browser.ts`

```typescript
server.tool(
  "install_browser",
  "Install Playwright browser for enhanced content extraction",
  z.object({}),
  async () => {
    // playwright install chromium 실행
  }
);
```

### 참고: 기존 MCP 서버 활용 옵션

대안으로 기존 `fetcher-mcp`를 활용할 수도 있습니다:
- 장점: 검증된 구현, 빠른 개발
- 단점: 외부 의존성, Medium 특화 최적화 어려움

---

## 체크리스트

### Phase 1: 프로젝트 설정
- [ ] npm 초기화 및 의존성 설치
- [ ] TypeScript 설정
- [ ] 디렉토리 구조 생성
- [ ] ESLint/Prettier 설정

### Phase 2: 핵심 서비스
- [ ] URL 빌더 구현
- [ ] RSS 파서 서비스 구현
- [ ] 콘텐츠 추출 서비스 구현
- [ ] 타입 정의

### Phase 3: MCP Tools
- [ ] 기본 서버 설정
- [ ] get_user_posts 구현
- [ ] get_publication_posts 구현
- [ ] get_tag_posts 구현
- [ ] get_post_content 구현

### Phase 4: 통합
- [ ] 메인 진입점 구현
- [ ] Tool 등록 통합
- [ ] 에러 핸들링

### Phase 5: 테스트
- [ ] 단위 테스트 작성
- [ ] 통합 테스트 작성
- [ ] 수동 테스트 완료

### Phase 6: 배포
- [ ] README 작성
- [ ] npm 배포
- [ ] GitHub 릴리스

### Phase 7: Browser 모드 (선택)
- [ ] Playwright 의존성 추가
- [ ] BrowserFetcher 서비스 구현
- [ ] get_post_content Tool에 useBrowser 옵션 추가
- [ ] install_browser Tool 구현
- [ ] Browser 모드 테스트

---

## 예상 작업량

| Phase | 작업 |
|-------|------|
| Phase 1 | 프로젝트 초기 설정 |
| Phase 2 | 핵심 서비스 구현 (RSS 기반) |
| Phase 3 | MCP Tools 구현 |
| Phase 4 | 진입점 및 통합 |
| Phase 5 | 테스트 |
| Phase 6 | 문서화 및 배포 |
| Phase 7 | Browser 모드 추가 (선택) |

---

## 의존성 다이어그램

```
index.ts
    └── server.ts
            └── tools/
                    ├── get-user-posts.ts ──┐
                    ├── get-publication-posts.ts ──┼── services/rss-parser.ts
                    ├── get-tag-posts.ts ──┘              └── utils/url-builder.ts
                    │
                    └── get-post-content.ts ─┬─ services/content-extractor.ts (cheerio)
                                             └─ services/browser-fetcher.ts (Playwright, 선택)
                                                      └── @mozilla/readability
```

---

## 시작하기

Phase 1부터 순차적으로 진행합니다. 각 단계 완료 후 다음 단계로 넘어갑니다.

```bash
# 시작
cd /home/user/medium-mcp-server
npm init -y
```
