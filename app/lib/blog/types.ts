export type BlogPost = {
  id: string;
  slug: string;
  locale: "ko" | "en" | "fr";
  title: string;
  excerpt: string;
  imageUrl: string;
  markdown: string;
  status: "draft" | "published";
  publishedAt: string | null;
  updatedAt: string;
};
