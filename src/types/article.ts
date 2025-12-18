import { z } from "zod";

/**
 * Article Zod 스키마 - 런타임 검증용
 */
export const ArticleSchema = z.object({
  title: z.string().min(1, "Title cannot be empty"),
  author: z.string().nullable(),
  publishedAt: z.string().nullable(),
  content: z.string().min(1, "Content cannot be empty"),
  excerpt: z.string().nullable(),
  url: z.string().url("Invalid URL format"),
});

/**
 * Article 타입 (Zod 스키마에서 추론)
 */
export type Article = z.infer<typeof ArticleSchema>;

/**
 * Article 데이터 검증 및 파싱
 */
export function parseArticle(data: unknown): Article {
  return ArticleSchema.parse(data);
}

/**
 * Article 데이터 안전하게 검증 (에러 시 null 반환)
 */
export function safeParseArticle(data: unknown): Article | null {
  const result = ArticleSchema.safeParse(data);
  return result.success ? result.data : null;
}
