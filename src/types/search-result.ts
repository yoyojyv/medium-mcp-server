import { z } from "zod";

/**
 * 검색 결과 아이템 스키마
 */
export const SearchResultSchema = z.object({
  title: z.string().min(1, "Title cannot be empty"),
  url: z.string().url("Invalid URL format"),
  author: z.string().nullable(),
  publishedAt: z.string().nullable(),
  excerpt: z.string().nullable(),
  claps: z.number().nullable(),
  readingTime: z.string().nullable(),
  publication: z.string().nullable(),
});

export type SearchResult = z.infer<typeof SearchResultSchema>;

/**
 * 검색 응답 스키마
 */
export const SearchResponseSchema = z.object({
  query: z.string(),
  resultCount: z.number(),
  results: z.array(SearchResultSchema),
  hasMore: z.boolean(),
});

export type SearchResponse = z.infer<typeof SearchResponseSchema>;

/**
 * SearchResult 데이터 검증 및 파싱
 */
export function parseSearchResult(data: unknown): SearchResult {
  return SearchResultSchema.parse(data);
}

/**
 * SearchResponse 데이터 검증 및 파싱
 */
export function parseSearchResponse(data: unknown): SearchResponse {
  return SearchResponseSchema.parse(data);
}
