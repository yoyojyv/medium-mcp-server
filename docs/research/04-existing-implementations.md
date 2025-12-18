# 기존 MCP 서버 구현 사례 분석

## 1. RSS 관련 MCP 서버

### veithly/rss-mcp

**GitHub**: https://github.com/veithly/rss-mcp

#### 개요
TypeScript로 구현된 범용 RSS/Atom 피드 파서 MCP 서버

#### 주요 기능
- 표준 RSS/Atom 피드 파싱
- RSSHub 특별 지원
- 다중 인스턴스 자동 폴백
- JSON 형식 출력

#### 구현된 Tool

```typescript
// get_feed tool
{
  name: "get_feed",
  description: "Fetch and parse RSS/Atom feed",
  inputSchema: {
    url: z.string().describe("RSS feed URL"),
    count: z.number().optional().default(1)
  }
}
```

#### 출력 형식

```json
{
  "title": "Feed Title",
  "link": "https://...",
  "description": "...",
  "items": [
    {
      "title": "Article Title",
      "description": "...",
      "link": "https://...",
      "pubDate": "2025-12-15T10:00:00Z",
      "author": "Author Name",
      "categories": ["tag1", "tag2"]
    }
  ]
}
```

#### 의존성
- @modelcontextprotocol/sdk
- axios
- rss-parser
- cheerio
- date-fns-tz

---

### imprvhub/mcp-rss-aggregator

**GitHub**: https://github.com/imprvhub/mcp-rss-aggregator

#### 개요
Claude Desktop용 RSS 피드 애그리게이터

#### 주요 기능
- OPML/JSON 파일로 피드 관리
- 카테고리별 조직화
- 최신/인기 콘텐츠 필터링

#### 구현된 Commands

| 명령 | 설명 |
|------|------|
| `rss latest --N` | 최신 N개 아티클 |
| `rss top --N` | 인기 N개 아티클 |
| `rss list` | 등록된 피드 목록 |
| `rss [category]` | 카테고리 필터 |
| `rss --[feed-id]` | 특정 피드 조회 |

---

### naoto24kawa/rss-feed-mcp-server

**특징**: 피드 등록/관리 기능 포함

#### 주요 기능
- RSS/Atom 피드 조회
- 피드 목록 관리
- 새 피드 등록

---

### @missionsquad/mcp-rss

**npm**: `npx @missionsquad/mcp-rss`

#### 주요 기능
- 지능형 캐싱
- 배치 처리
- 콘텐츠 모니터링
- 전문 검색 (Full-text search)

## 2. Medium 특화 구현 예시

현재 Medium 전용 MCP 서버는 발견되지 않았습니다. 이는 우리 프로젝트의 기회입니다.

### 차별화 포인트

| 기능 | 기존 RSS MCP | Medium MCP (계획) |
|------|-------------|------------------|
| 범용 RSS 지원 | O | O |
| Medium 최적화 | X | O |
| 사용자 프로필 조회 | 수동 URL | 자동 생성 |
| 퍼블리케이션 지원 | X | O |
| 태그 검색 | X | O |
| 콘텐츠 정제 | 기본 | Medium 최적화 |
| 메타데이터 추출 | 제한적 | 풍부함 |

## 3. MCP 서버 구현 패턴

### 공통 구조

```typescript
// index.ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new McpServer({
  name: "server-name",
  version: "1.0.0",
});

// Tools 등록
server.tool("tool_name", schema, handler);

// 서버 시작
const transport = new StdioServerTransport();
await server.connect(transport);
```

### Tool 정의 패턴

```typescript
server.tool(
  "get_medium_posts",
  "Get posts from a Medium user or publication",
  {
    username: z.string().optional(),
    publication: z.string().optional(),
    tag: z.string().optional(),
    count: z.number().default(10).max(10),
  },
  async (params) => {
    // 1. 입력 검증
    // 2. RSS URL 생성
    // 3. 피드 조회 및 파싱
    // 4. 데이터 변환
    // 5. 결과 반환
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }
);
```

### 에러 처리 패턴

```typescript
try {
  const result = await fetchFeed(url);
  return { content: [{ type: "text", text: JSON.stringify(result) }] };
} catch (error) {
  return {
    content: [{ type: "text", text: `Error: ${error.message}` }],
    isError: true,
  };
}
```

## 4. 클라이언트 설정 패턴

### Claude Desktop

```json
{
  "mcpServers": {
    "medium": {
      "command": "npx",
      "args": ["medium-mcp-server"]
    }
  }
}
```

### Cursor

```json
{
  "mcp": {
    "servers": {
      "medium": {
        "command": "npx",
        "args": ["medium-mcp-server"]
      }
    }
  }
}
```

## 5. 배포 패턴

### npm 배포 (권장)

1. package.json에 bin 필드 설정
2. npm publish
3. 사용자는 `npx package-name`으로 실행

### Docker 배포

1. Dockerfile 작성
2. docker build & push
3. 사용자는 docker run으로 실행

## 6. 테스트 패턴

```typescript
import { describe, it, expect } from 'vitest';

describe('Medium RSS Parser', () => {
  it('should parse user feed', async () => {
    const result = await parseUserFeed('@username');
    expect(result.items).toBeDefined();
    expect(result.items.length).toBeLessThanOrEqual(10);
  });
});
```

## 7. 참고 자료

- [veithly/rss-mcp](https://github.com/veithly/rss-mcp)
- [imprvhub/mcp-rss-aggregator](https://github.com/imprvhub/mcp-rss-aggregator)
- [MCP Servers Repository](https://github.com/modelcontextprotocol/servers)
- [LobeHub MCP Servers](https://lobehub.com/mcp)
