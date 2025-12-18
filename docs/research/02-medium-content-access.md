# Medium 콘텐츠 접근 방법 Research

## 1. Medium API 현황

### 공식 API 제한사항

Medium 공식 API는 **더 이상 유지보수되지 않으며**, 기능이 매우 제한적입니다:

| 기능 | 지원 여부 |
|------|----------|
| 사용자 정보 조회 | O |
| 새 포스트 작성 | O |
| 포스트 목록 조회 | X |
| 포스트 내용 읽기 | X |
| 댓글/반응 조회 | X |

> Medium은 모든 콘텐츠를 자체 플랫폼에서만 읽히길 원하기 때문에 읽기 API를 제공하지 않습니다.

## 2. RSS Feed 접근 방식 (권장)

Medium은 RSS 피드를 통해 콘텐츠에 접근할 수 있도록 지원합니다.

### RSS Feed URL 형식

| 유형 | URL 형식 | 예시 |
|------|---------|------|
| 사용자 프로필 | `medium.com/feed/@username` | `https://medium.com/feed/@dan_abramov` |
| 사용자 (서브도메인) | `username.medium.com/feed` | `https://timdenning.medium.com/feed` |
| 퍼블리케이션 | `medium.com/feed/publication-name` | `https://medium.com/feed/netflix-techblog` |
| 커스텀 도메인 | `customdomain.com/feed` | `https://betterprogramming.pub/feed` |
| 태그별 | `medium.com/feed/tag/topic-name` | `https://medium.com/feed/tag/javascript` |
| 퍼블리케이션 태그 | `medium.com/feed/pub-name/tagged/tag` | `https://medium.com/feed/better-programming/tagged/react` |

### RSS Feed 제한사항

- **최대 10개 포스트만 조회 가능**
- Paywall 뒤의 콘텐츠는 전체 내용 제공 안됨
- 실시간 업데이트 불가 (폴링 필요)
- CORS 정책으로 브라우저에서 직접 접근 불가

### RSS Feed 데이터 구조

```xml
<rss version="2.0">
  <channel>
    <title>Author Name - Medium</title>
    <description>Author's Medium posts</description>
    <link>https://medium.com/@username</link>
    <item>
      <title>Article Title</title>
      <link>https://medium.com/@username/article-slug</link>
      <pubDate>Mon, 15 Dec 2025 10:00:00 GMT</pubDate>
      <dc:creator>Author Name</dc:creator>
      <content:encoded><![CDATA[HTML content...]]></content:encoded>
      <category>tag1</category>
      <category>tag2</category>
    </item>
  </channel>
</rss>
```

## 3. 웹 스크래핑 접근 방식 (보조)

RSS 피드의 제한을 극복하기 위해 웹 스크래핑을 활용할 수 있습니다.

### Cheerio (권장 - 정적 콘텐츠)

- 가볍고 빠른 jQuery 스타일 HTML 파서
- 서버 사이드에서 동작 (CORS 문제 없음)
- 정적 HTML 파싱에 최적화

```typescript
import * as cheerio from 'cheerio';

const $ = cheerio.load(htmlContent);
const title = $('article h1').text();
const content = $('article section').html();
```

### Puppeteer (동적 콘텐츠 필요시)

- 헤드리스 Chrome 브라우저 제어
- JavaScript 렌더링 페이지 처리 가능
- 리소스 사용량이 높음

### 스크래핑 고려사항

- Medium의 robots.txt 및 Terms of Service 준수 필요
- Rate limiting 구현 필수
- User-Agent 헤더 설정
- IP 차단 가능성 고려

## 4. 제3자 서비스 및 라이브러리

### rss2json

RSS를 JSON API로 변환하는 서비스:
```
https://api.rss2json.com/v1/api.json?rss_url=https://medium.com/feed/@username
```

### medium-rss-api (Go)

- REST API 래퍼
- 내장 캐시 메커니즘
- HTML 토크나이저

### medium-article-api (npm)

```bash
npm install medium-article-api
```

## 5. 권장 구현 전략

### Phase 1: RSS 기반 접근 (MVP)

```
사용자 요청 → RSS URL 생성 → RSS 파싱 → JSON 변환 → 응답
```

**장점**: 간단, 안정적, Medium ToS 준수
**단점**: 10개 포스트 제한, 제한된 메타데이터

### Phase 2: 하이브리드 접근 (확장)

```
RSS로 포스트 목록 → 개별 URL로 상세 내용 스크래핑
```

**장점**: 더 풍부한 데이터, 전체 콘텐츠 접근
**단점**: 구현 복잡, Rate limiting 필요

## 6. 참고 자료

- [Medium RSS Feed 도움말](https://help.medium.com/hc/en-us/articles/214874118)
- [medium-rss-api GitHub](https://github.com/ByteSchneiderei/medium-rss-api)
- [rss-parser npm](https://www.npmjs.com/package/rss-parser)
- [Medium RSS URL 가이드](https://blog.julietedjere.com/posts/find-your-rss-feed-url-scheme-for-medium-blog)
