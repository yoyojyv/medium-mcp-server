import { z } from "zod";

/**
 * Author 글 목록 아이템 스키마
 * RSS와 스크래핑 양쪽 소스를 커버
 */
export const AuthorArticleSchema = z.object({
  title: z.string().min(1, "Title cannot be empty"),
  url: z.string().url("Invalid URL format"),
  publishedAt: z.string().nullable(),
  updatedAt: z.string().nullable(),
  author: z.string().nullable(),
  excerpt: z.string().nullable(),
  categories: z.array(z.string()).default([]),
  content: z.string().nullable(),
  claps: z.number().nullable(),
  readingTime: z.string().nullable(),
  source: z.enum(["rss", "scrape"]),
});

export type AuthorArticle = z.infer<typeof AuthorArticleSchema>;

/**
 * Author 글 목록 응답 스키마
 */
export const AuthorArticlesResponseSchema = z.object({
  username: z.string(),
  articleCount: z.number(),
  articles: z.array(AuthorArticleSchema),
  source: z.enum(["rss", "scrape", "mixed"]),
  hasMore: z.boolean(),
});

export type AuthorArticlesResponse = z.infer<typeof AuthorArticlesResponseSchema>;

/**
 * AuthorArticle 데이터 검증 및 파싱
 */
export function parseAuthorArticle(data: unknown): AuthorArticle {
  return AuthorArticleSchema.parse(data);
}

/**
 * AuthorArticlesResponse 데이터 검증 및 파싱
 */
export function parseAuthorArticlesResponse(
  data: unknown
): AuthorArticlesResponse {
  return AuthorArticlesResponseSchema.parse(data);
}
