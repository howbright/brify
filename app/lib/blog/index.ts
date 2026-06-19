import { adminSupabase } from "@/utils/supabase/admin";
import type { BlogPost } from "./types";

type BlogLocale = BlogPost["locale"];

type BlogPostRow = {
  id: string;
  locale: BlogLocale;
  slug: string;
  title: string;
  excerpt: string | null;
  image_url: string | null;
  markdown: string | null;
  status: BlogPost["status"];
  published_at: string | null;
  translation_group_id?: string | null;
  updated_at: string;
};

function normalizeLocale(locale: string): BlogLocale {
  if (locale === "ko" || locale === "fr") return locale;
  return "en";
}

function toBlogPost(row: BlogPostRow): BlogPost {
  return {
    id: row.id,
    locale: row.locale,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt ?? "",
    imageUrl: row.image_url ?? "",
    markdown: row.markdown ?? "",
    status: row.status,
    publishedAt: row.published_at,
    translationGroupId: row.translation_group_id ?? null,
    updatedAt: row.updated_at,
  };
}

export async function getBlogPostsByLocale(locale: string): Promise<BlogPost[]> {
  const normalized = normalizeLocale(locale);
  const now = new Date().toISOString();
  const { data, error } = await adminSupabase
    .from("blog_posts")
    .select("id,locale,slug,title,excerpt,image_url,markdown,status,published_at,translation_group_id,updated_at")
    .eq("locale", normalized)
    .eq("status", "published")
    .or(`published_at.is.null,published_at.lte.${now}`)
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[blog] failed to load posts", error);
    return [];
  }

  return ((data ?? []) as BlogPostRow[]).map(toBlogPost);
}

export async function getAllPublishedBlogPosts(): Promise<BlogPost[]> {
  const now = new Date().toISOString();
  const { data, error } = await adminSupabase
    .from("blog_posts")
    .select("id,locale,slug,title,excerpt,image_url,markdown,status,published_at,translation_group_id,updated_at")
    .eq("status", "published")
    .or(`published_at.is.null,published_at.lte.${now}`)
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[blog] failed to load sitemap posts", error);
    return [];
  }

  return ((data ?? []) as BlogPostRow[]).map(toBlogPost);
}

export async function getBlogPostByLocaleAndSlug(
  locale: string,
  slug: string
): Promise<BlogPost | null> {
  const normalized = normalizeLocale(locale);
  const now = new Date().toISOString();
  const { data, error } = await adminSupabase
    .from("blog_posts")
    .select("id,locale,slug,title,excerpt,image_url,markdown,status,published_at,translation_group_id,updated_at")
    .eq("locale", normalized)
    .eq("slug", slug)
    .eq("status", "published")
    .or(`published_at.is.null,published_at.lte.${now}`)
    .maybeSingle();

  if (error) {
    console.error("[blog] failed to load post", error);
    return null;
  }

  return data ? toBlogPost(data as BlogPostRow) : null;
}

export async function getPublishedBlogPostAlternates(post: BlogPost): Promise<BlogPost[]> {
  const now = new Date().toISOString();

  if (!post.translationGroupId) {
    return [post];
  }

  const { data, error } = await adminSupabase
    .from("blog_posts")
    .select("id,locale,slug,title,excerpt,image_url,markdown,status,published_at,translation_group_id,updated_at")
    .eq("translation_group_id", post.translationGroupId)
    .eq("status", "published")
    .or(`published_at.is.null,published_at.lte.${now}`)
    .order("locale", { ascending: true });

  if (error) {
    console.error("[blog] failed to load alternate posts", error);
    return [post];
  }

  const alternates = ((data ?? []) as BlogPostRow[]).map(toBlogPost);
  return alternates.length > 0 ? alternates : [post];
}
