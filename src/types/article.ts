export interface Article {
  title: string;
  author: string | null;
  publishedAt: string | null;
  content: string;
  excerpt: string | null;
  url: string;
}
