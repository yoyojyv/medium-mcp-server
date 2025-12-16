# Medium MCP Server - Product Requirements Document

## 1. 개요

### 1.1 프로젝트 명
**Medium MCP Server**

### 1.2 목적
AI 어시스턴트(Claude, ChatGPT 등)가 Medium 블로그 콘텐츠에 접근하고 읽을 수 있도록 하는 Model Context Protocol (MCP) 서버를 개발합니다.

### 1.3 배경
- MCP는 LLM과 외부 데이터 소스를 연결하는 표준 프로토콜입니다
- Medium은 공식적인 읽기 API를 제공하지 않지만, RSS 피드를 통해 콘텐츠에 접근할 수 있습니다
- 웹 브라우저 자동화(Playwright)를 통해 RSS의 제한(최대 10개)을 극복할 수 있습니다
- 현재 Medium 전용 MCP 서버가 존재하지 않아 시장 기회가 있습니다

### 1.4 타겟 사용자
- AI 어시스턴트를 활용하는 개발자
- Medium 콘텐츠를 자동화하려는 콘텐츠 크리에이터
- 리서치 및 정보 수집에 AI를 활용하는 사용자

## 2. 기능 요구사항

### 2.1 핵심 기능 (MVP)

#### Tool 1: `get_user_posts`
사용자의 Medium 포스트 목록을 조회합니다.

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| username | string | O | Medium 사용자명 (@username) |
| count | number | X | 조회할 포스트 수 (기본: 10, 최대: 10) |

**출력:**
```json
{
  "user": "@username",
  "posts": [
    {
      "title": "포스트 제목",
      "link": "https://medium.com/...",
      "pubDate": "2025-12-15",
      "summary": "포스트 요약...",
      "tags": ["tag1", "tag2"]
    }
  ]
}
```

#### Tool 2: `get_publication_posts`
퍼블리케이션의 포스트 목록을 조회합니다.

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| publication | string | O | 퍼블리케이션 이름 |
| count | number | X | 조회할 포스트 수 (기본: 10) |

#### Tool 3: `get_tag_posts`
특정 태그의 포스트를 조회합니다.

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| tag | string | O | 태그 이름 |
| count | number | X | 조회할 포스트 수 (기본: 10) |

#### Tool 4: `get_post_content`
특정 포스트의 전체 내용을 조회합니다.

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| url | string | O | Medium 포스트 URL |

**출력:**
```json
{
  "title": "포스트 제목",
  "author": "작성자",
  "pubDate": "2025-12-15",
  "content": "마크다운 형식의 본문...",
  "tags": ["tag1", "tag2"],
  "readingTime": "5 min read"
}
```

### 2.2 확장 기능 (Phase 2)

#### Tool 5: `search_posts`
키워드로 포스트를 검색합니다.

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| query | string | O | 검색 키워드 |
| count | number | X | 결과 수 (기본: 10) |

#### Resource: `medium://user/{username}`
사용자 프로필 정보를 리소스로 노출합니다.

#### Prompt: `summarize_posts`
여러 포스트를 요약하는 프롬프트 템플릿을 제공합니다.

## 3. 비기능 요구사항

### 3.1 성능
- RSS 피드 조회: 5초 이내 응답
- 캐싱: 동일 요청 1분 내 캐시 활용
- 동시 요청: 최대 10개 병렬 처리

### 3.2 안정성
- 네트워크 오류 시 재시도 (최대 3회)
- 적절한 에러 메시지 반환
- Rate limiting 준수 (Medium 정책)

### 3.3 호환성
- Node.js 18+ 지원
- Claude Desktop, Cursor, 기타 MCP 클라이언트와 호환
- Windows, macOS, Linux 지원

### 3.4 보안
- 외부 URL 검증
- XSS 방지를 위한 콘텐츠 새니타이징
- 민감 정보 로깅 금지

## 4. 기술 스택

### 4.1 핵심 기술
| 기술 | 버전 | 용도 |
|------|------|------|
| Node.js | 18+ | 런타임 |
| TypeScript | 5.x | 개발 언어 |
| @modelcontextprotocol/sdk | 1.24+ | MCP 구현 |
| zod | 3.25+ | 스키마 검증 |

### 4.2 라이브러리
| 라이브러리 | 용도 |
|-----------|------|
| rss-parser | RSS 피드 파싱 |
| axios | HTTP 요청 |
| cheerio | HTML 파싱 (경량) |
| playwright | 헤드리스 브라우저 (선택) |
| @mozilla/readability | 콘텐츠 추출 (선택) |

## 5. 제약사항

### 5.1 Medium 제약
- RSS 피드는 최대 10개 포스트만 제공 → Browser 모드로 극복 가능
- Paywall 콘텐츠는 전체 내용 접근 불가
- Rate limiting 가능성 (특히 Browser 모드)

### 5.2 기술 제약
- stdio 전송 방식 사용 (로컬 실행)
- 실시간 업데이트 불가 (폴링 방식)
- Browser 모드 시 Playwright 설치 필요 (~300MB)

## 6. 릴리스 계획

### Phase 1 (MVP) - RSS 기반
- 기본 프로젝트 구조 설정
- 4개 핵심 Tool 구현 (RSS 기반)
- Claude Desktop 통합 테스트
- npm 배포

### Phase 2 - Browser 모드 추가
- Playwright 기반 콘텐츠 추출 추가
- `get_post_content` Tool에 Browser 모드 옵션 추가
- Readability 기반 본문 추출
- 캐싱 최적화

### Phase 3 - 고급 기능
- 검색 기능 (`search_posts`)
- Resource 지원 (`medium://user/{username}`)
- Prompt 템플릿
- 다국어 지원

## 7. 성공 지표

| 지표 | 목표 |
|------|------|
| npm 다운로드 | 첫 달 100+ |
| GitHub 스타 | 50+ |
| 이슈 해결율 | 90%+ |
| 문서 완성도 | README, 예제 코드 포함 |

## 8. 위험 요소

| 위험 | 영향 | 대응 |
|------|------|------|
| Medium Rate Limiting | 서비스 중단 | 캐싱, 백오프 구현 |
| RSS 구조 변경 | 파싱 실패 | 버전 관리, 모니터링 |
| MCP 스펙 변경 | 호환성 문제 | SDK 업데이트 추적 |

## 9. 참고 문서

- [MCP 리서치](./research/01-mcp-server-research.md)
- [Medium 접근 방법](./research/02-medium-content-access.md)
- [기술 스택](./research/03-tech-stack.md)
- [기존 구현 분석](./research/04-existing-implementations.md)
- [브라우저 기반 MCP](./research/05-browser-based-mcp.md)
