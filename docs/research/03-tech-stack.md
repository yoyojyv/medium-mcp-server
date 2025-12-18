# 기술 스택 및 라이브러리 Research

## 1. 권장 기술 스택

### 핵심 기술

| 분류 | 기술 | 버전 | 용도 |
|------|------|------|------|
| Runtime | Node.js | 18+ | JavaScript 런타임 |
| Language | TypeScript | 5.x | 타입 안전성 |
| Protocol | MCP SDK | 1.24+ | MCP 서버 구현 |
| Validation | Zod | 3.25+ | 스키마 검증 |

### RSS 파싱

| 라이브러리 | 특징 | 권장도 |
|-----------|------|--------|
| **rss-parser** | 가볍고 TypeScript 지원 | ★★★★★ |
| fast-xml-parser | 의존성 없음, 빠름 | ★★★★☆ |
| xml2js | 유연한 옵션 | ★★★☆☆ |

### HTTP 클라이언트

| 라이브러리 | 특징 | 권장도 |
|-----------|------|--------|
| **axios** | 널리 사용, 인터셉터 | ★★★★★ |
| node-fetch | 표준 Fetch API | ★★★★☆ |
| got | 재시도/타임아웃 내장 | ★★★★☆ |

### HTML 파싱 (선택)

| 라이브러리 | 특징 | 권장도 |
|-----------|------|--------|
| **cheerio** | jQuery 스타일, 빠름 | ★★★★★ |
| jsdom | 완전한 DOM 구현 | ★★★☆☆ |
| puppeteer | 브라우저 자동화 | ★★☆☆☆ |

## 2. 의존성 구성

### package.json

```json
{
  "name": "medium-mcp-server",
  "version": "1.0.0",
  "type": "module",
  "main": "dist/index.js",
  "bin": {
    "medium-mcp": "dist/index.js"
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsx watch src/index.ts",
    "start": "node dist/index.js",
    "lint": "eslint src/",
    "test": "vitest"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.24.3",
    "zod": "^3.25.0",
    "rss-parser": "^3.13.0",
    "axios": "^1.7.0",
    "cheerio": "^1.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.4.0",
    "tsx": "^4.7.0",
    "vitest": "^1.0.0",
    "eslint": "^8.57.0",
    "@typescript-eslint/eslint-plugin": "^7.0.0"
  }
}
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

## 3. 프로젝트 구조

```
medium-mcp-server/
├── src/
│   ├── index.ts           # 진입점, MCP 서버 설정
│   ├── server.ts          # MCP 서버 클래스
│   ├── tools/
│   │   ├── index.ts       # Tool 등록
│   │   ├── get-user-posts.ts
│   │   ├── get-publication-posts.ts
│   │   ├── get-post-content.ts
│   │   └── search-by-tag.ts
│   ├── services/
│   │   ├── rss-parser.ts  # RSS 파싱 서비스
│   │   ├── medium-api.ts  # Medium 접근 래퍼
│   │   └── content-extractor.ts  # 콘텐츠 추출
│   ├── types/
│   │   ├── medium.ts      # Medium 관련 타입
│   │   └── rss.ts         # RSS 관련 타입
│   └── utils/
│       ├── url-builder.ts # RSS URL 생성
│       └── html-cleaner.ts # HTML 정제
├── docs/
│   ├── research/          # 리서치 문서
│   └── prd.md            # PRD
├── tests/
│   └── *.test.ts         # 테스트 파일
├── package.json
├── tsconfig.json
└── README.md
```

## 4. 기존 MCP RSS 서버 분석

### veithly/rss-mcp

**사용 라이브러리:**
- @modelcontextprotocol/sdk
- axios
- rss-parser
- cheerio
- date-fns-tz
- dotenv

**구현된 Tool:**
- `get_feed`: RSS 피드 조회 (URL, count 파라미터)

### imprvhub/mcp-rss-aggregator

**특징:**
- OPML/JSON 형식 지원
- 카테고리별 피드 조직화
- 최신/상위 콘텐츠 필터링

## 5. 개발 도구

### 필수 도구

| 도구 | 용도 |
|------|------|
| tsx | TypeScript 실행 (개발) |
| vitest | 테스트 프레임워크 |
| eslint | 코드 린팅 |
| prettier | 코드 포맷팅 |

### 선택 도구

| 도구 | 용도 |
|------|------|
| MCP Inspector | MCP 서버 디버깅 |
| nodemon | 개발 중 자동 재시작 |

## 6. 배포 고려사항

### npm 배포

```bash
npm publish
```

사용자가 `npx medium-mcp`로 실행 가능

### Docker 배포

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist/ ./dist/
CMD ["node", "dist/index.js"]
```

## 7. 참고 자료

- [rss-parser npm](https://www.npmjs.com/package/rss-parser)
- [cheerio npm](https://www.npmjs.com/package/cheerio)
- [axios npm](https://www.npmjs.com/package/axios)
- [veithly/rss-mcp](https://github.com/veithly/rss-mcp)
- [MCP TypeScript SDK Examples](https://github.com/modelcontextprotocol/typescript-sdk/tree/main/src/examples)
