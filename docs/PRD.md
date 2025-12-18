# Medium MCP Server - Product Requirements Document

## 1. 개요

### 1.1 프로젝트 명
**Medium MCP Server**

### 1.2 목적
AI 어시스턴트(Claude, ChatGPT 등)가 Medium 블로그 콘텐츠에 접근하고 읽을 수 있도록 하는 Model Context Protocol (MCP) 서버를 개발합니다.

### 1.3 배경
- MCP는 LLM과 외부 데이터 소스를 연결하는 표준 프로토콜입니다
- Medium은 공식적인 읽기 API를 제공하지 않습니다
- 웹 브라우저 자동화(Playwright)와 Readability를 통해 콘텐츠를 추출합니다
- 현재 Medium 전용 MCP 서버가 존재하지 않아 시장 기회가 있습니다

### 1.4 타겟 사용자
- AI 어시스턴트를 활용하는 개발자
- Medium 콘텐츠를 자동화하려는 콘텐츠 크리에이터
- 리서치 및 정보 수집에 AI를 활용하는 사용자

## 2. 기능 요구사항

### 2.1 핵심 기능 (MVP)

#### Tool 1: `read_article`
Medium 포스트 URL에서 콘텐츠를 읽어옵니다.

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| url | string | O | Medium 포스트 URL |

**출력:**
```json
{
  "title": "포스트 제목",
  "author": "작성자",
  "publishedAt": "2025-12-15",
  "content": "마크다운 형식의 본문...",
  "excerpt": "요약/발췌문",
  "url": "원본 URL"
}
```

### 2.2 확장 기능 (Phase 2)

#### Tool 2: `read_multiple_articles`
여러 Medium URL에서 콘텐츠를 병렬로 읽어옵니다.

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| urls | string[] | O | Medium 포스트 URL 배열 |

#### Tool 3: `install_browser`
Playwright 브라우저를 설치합니다.

## 3. 비기능 요구사항

### 3.1 성능
- 단일 URL 조회: 10초 이내 응답
- 병렬 처리 지원

### 3.2 안정성
- 네트워크 오류 시 재시도 (최대 3회)
- 적절한 에러 메시지 반환
- Rate limiting 고려

### 3.3 호환성
- Node.js 18+ 지원
- Claude Desktop, Cursor, 기타 MCP 클라이언트와 호환
- Windows, macOS, Linux 지원

### 3.4 보안
- Medium 도메인 URL만 허용
- XSS 방지를 위한 콘텐츠 새니타이징

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
| playwright | 헤드리스 브라우저 |
| @mozilla/readability | 콘텐츠 추출 |
| jsdom | DOM 파싱 |
| turndown | HTML → Markdown 변환 |

## 5. 제약사항

### 5.1 Medium 제약
- Paywall 콘텐츠는 전체 내용 접근 불가
- Rate limiting 가능성

### 5.2 기술 제약
- stdio 전송 방식 사용 (로컬 실행)
- Playwright 브라우저 설치 필요 (~300MB)

## 6. 릴리스 계획

### Phase 1 (MVP) - Browser 기반
- 기본 프로젝트 구조 설정
- `read_article` Tool 구현 (Playwright + Readability)
- Claude Desktop 통합 테스트
- npm 배포

### Phase 2 - 확장
- 다중 URL 병렬 처리
- 캐싱 최적화
- 에러 처리 강화

### Phase 3 - 고급 기능
- RSS 기반 목록 조회 (선택)
- Resource 지원
- Prompt 템플릿

## 7. 성공 지표

| 지표 | 목표 |
|------|------|
| npm 다운로드 | 첫 달 100+ |
| GitHub 스타 | 50+ |
| 이슈 해결율 | 90%+ |

## 8. 위험 요소

| 위험 | 영향 | 대응 |
|------|------|------|
| Medium Rate Limiting | 서비스 중단 | 캐싱, 백오프 구현 |
| Medium DOM 구조 변경 | 파싱 실패 | Readability 활용 |
| MCP 스펙 변경 | 호환성 문제 | SDK 업데이트 추적 |

## 9. 참고 문서

- [MCP 리서치](./research/01-mcp-server-research.md)
- [Medium 접근 방법](./research/02-medium-content-access.md)
- [기술 스택](./research/03-tech-stack.md)
- [기존 구현 분석](./research/04-existing-implementations.md)
- [브라우저 기반 MCP](./research/05-browser-based-mcp.md)
