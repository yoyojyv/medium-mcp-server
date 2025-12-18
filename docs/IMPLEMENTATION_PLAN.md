# Medium MCP Server - Implementation Plan

## 개요

이 문서는 Medium MCP Server 개발을 위한 단계별 실행 계획입니다.
**Browser 기반 (Playwright + Readability)** 방식으로 URL에서 콘텐츠를 직접 추출합니다.

---

## Phase 1: 프로젝트 설정

### Step 1.1: 기본 프로젝트 초기화

```bash
npm init -y

# 핵심 의존성
npm install @modelcontextprotocol/sdk zod
npm install playwright @mozilla/readability jsdom turndown

# 개발 의존성
npm install -D typescript @types/node @types/jsdom @types/turndown tsx vitest
```

**산출물:**
- `package.json`
- `tsconfig.json`
- `.gitignore`

### Step 1.2: 디렉토리 구조

```
src/
├── index.ts           # 진입점
├── server.ts          # MCP 서버 설정
├── tools/
│   └── read-article.ts    # read_article Tool
├── services/
│   └── article-extractor.ts  # Playwright + Readability
└── types/
    └── article.ts     # 타입 정의
```

### Step 1.3: TypeScript 설정

**tsconfig.json:**
- `target`: ES2022
- `module`: NodeNext
- `strict`: true

---

## Phase 2: 핵심 서비스 구현

### Step 2.1: 타입 정의

**파일:** `src/types/article.ts`

```typescript
export interface Article {
  title: string;
  author: string | null;
  publishedAt: string | null;
  content: string;       // Markdown
  excerpt: string | null;
  url: string;
}
```

### Step 2.2: Article Extractor 서비스

**파일:** `src/services/article-extractor.ts`

```typescript
import { chromium } from 'playwright';
import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';
import TurndownService from 'turndown';

export async function extractArticle(url: string): Promise<Article> {
  // 1. Playwright로 페이지 로드
  // 2. HTML 가져오기
  // 3. Readability로 본문 추출
  // 4. Turndown으로 Markdown 변환
  // 5. 결과 반환
}
```

---

## Phase 3: MCP 서버 구현

### Step 3.1: 서버 설정

**파일:** `src/server.ts`

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export const server = new McpServer({
  name: "medium-mcp-server",
  version: "1.0.0",
});
```

### Step 3.2: read_article Tool

**파일:** `src/tools/read-article.ts`

```typescript
import { z } from "zod";
import { server } from "../server.js";
import { extractArticle } from "../services/article-extractor.js";

const schema = z.object({
  url: z.string().url().describe("Medium article URL"),
});

server.tool("read_article", "Read content from a Medium article URL", schema, async ({ url }) => {
  const article = await extractArticle(url);
  return {
    content: [{ type: "text", text: JSON.stringify(article, null, 2) }],
  };
});
```

### Step 3.3: 진입점

**파일:** `src/index.ts`

```typescript
#!/usr/bin/env node

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { server } from "./server.js";
import "./tools/read-article.js";

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
```

---

## Phase 4: 테스트 및 배포

### Step 4.1: 빌드 및 테스트

```bash
npm run build
echo '{"jsonrpc":"2.0","method":"tools/list","id":1}' | node dist/index.js
```

### Step 4.2: Claude Desktop 설정

```json
{
  "mcpServers": {
    "medium": {
      "command": "node",
      "args": ["/path/to/dist/index.js"]
    }
  }
}
```

---

## 체크리스트

### Phase 1: 프로젝트 설정
- [ ] npm 초기화 및 의존성 설치
- [ ] TypeScript 설정
- [ ] 디렉토리 구조 생성

### Phase 2: 핵심 서비스
- [ ] 타입 정의
- [ ] ArticleExtractor 서비스 구현

### Phase 3: MCP 서버
- [ ] 서버 설정
- [ ] read_article Tool 구현
- [ ] 진입점 구현

### Phase 4: 테스트
- [ ] 빌드 테스트
- [ ] Claude Desktop 통합 테스트

---

## 의존성 다이어그램

```
index.ts
    └── server.ts
            └── tools/read-article.ts
                    └── services/article-extractor.ts
                            ├── playwright
                            ├── @mozilla/readability
                            ├── jsdom
                            └── turndown
```
