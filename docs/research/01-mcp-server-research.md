# MCP (Model Context Protocol) Server Research

## 1. Overview

Model Context Protocol (MCP)은 2024년 11월 Anthropic이 도입한 오픈 표준 프레임워크로, LLM과 외부 도구/시스템/데이터 소스 간의 통합을 표준화합니다.

### 주요 채택 현황
- 2025년 3월: OpenAI 공식 채택 (ChatGPT Desktop, Agents SDK, Responses API)
- 2025년 12월: Linux Foundation 산하 Agentic AI Foundation(AAIF)에 기증
- 주요 지원사: Anthropic, Block, OpenAI, Google, Microsoft, AWS, Cloudflare, Bloomberg

## 2. Architecture

### 핵심 컴포넌트

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   MCP Client    │────▶│   MCP Server    │────▶│  External Data  │
│  (AI 앱 내장)    │◀────│  (Tool Provider)│◀────│    Sources      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### 지원 기능
- **Tools**: LLM이 서버에 작업 수행 요청 (계산, 네트워크 호출 등)
- **Resources**: 읽기 전용 데이터 노출 (문서, 파일 등)
- **Prompts**: 재사용 가능한 템플릿 제공

### Transport 방식
- **stdio**: 로컬 프로세스 통합 (권장 - 로컬 개발)
- **Streamable HTTP**: 원격 서버 (권장 - 프로덕션)
- **HTTP + SSE**: 하위 호환성
- **WebSockets**: 실시간 양방향 통신

## 3. TypeScript SDK

### 설치

```bash
npm install @modelcontextprotocol/sdk zod
npm install -D @types/node typescript
```

> **Note**: Zod는 스키마 검증을 위한 필수 피어 의존성입니다 (v3.25+)

### 기본 서버 구조

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new McpServer({
  name: "my-mcp-server",
  version: "1.0.0",
});

// Tool 등록
server.tool("tool_name", "Tool description", {
  inputSchema: z.object({
    param: z.string().describe("Parameter description"),
  }),
  handler: async (params) => {
    // Tool 로직
    return { result: "data" };
  },
});

// Transport 연결 및 시작
const transport = new StdioServerTransport();
await server.connect(transport);
```

### package.json 설정

```json
{
  "type": "module",
  "main": "dist/index.js",
  "bin": {
    "my-mcp-server": "dist/index.js"
  },
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.24.3",
    "zod": "^3.25.0"
  }
}
```

## 4. 클라이언트 통합

### Claude Desktop 설정

`claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "my-server": {
      "command": "npx",
      "args": ["my-mcp-server"]
    }
  }
}
```

### 로컬 개발 설정

```json
{
  "mcpServers": {
    "my-server": {
      "command": "node",
      "args": ["/absolute/path/to/dist/index.js"]
    }
  }
}
```

## 5. 고급 기능

| 기능 | 설명 |
|------|------|
| Sampling | 서버 측에서 클라이언트에 LLM 완성 요청 |
| Form Elicitation | 구조화된 사용자 입력 수집 |
| URL Elicitation | 브라우저 기반 OAuth/API 키 입력 |
| Operations | 장시간 실행 작업의 폴링 지원 |

## 6. 참고 자료

- [MCP 공식 GitHub](https://github.com/modelcontextprotocol)
- [TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [MCP 서버 레포지토리](https://github.com/modelcontextprotocol/servers)
- [MCP 명세서 (2025-06-18)](https://modelcontextprotocol.io/specification/2025-06-18)
- [npm: @modelcontextprotocol/sdk](https://www.npmjs.com/package/@modelcontextprotocol/sdk)
