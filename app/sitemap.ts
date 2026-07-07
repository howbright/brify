import type { MetadataRoute } from "next";
import { getAllPublishedBlogPosts } from "@/app/lib/blog";

const BASE_URL = "https://www.brify.app";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/ko`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${BASE_URL}/en`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/fr`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/ko/features`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.55,
    },
    {
      url: `${BASE_URL}/en/features`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/fr/features`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/ko/mind-map`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.45,
    },
    {
      url: `${BASE_URL}/ko/ai-mindmap-convert`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.45,
    },
    {
      url: `${BASE_URL}/en/ai-mindmap-convert`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${BASE_URL}/fr/ai-mindmap-convert`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${BASE_URL}/en/mind-map`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${BASE_URL}/fr/mind-map`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${BASE_URL}/ko/terms`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${BASE_URL}/en/terms`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${BASE_URL}/fr/terms`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${BASE_URL}/ko/privacy`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${BASE_URL}/en/privacy`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${BASE_URL}/fr/privacy`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${BASE_URL}/ko/blog`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/en/blog`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.85,
    },
    {
      url: `${BASE_URL}/fr/blog`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.85,
    },
  ];

  const posts = await getAllPublishedBlogPosts();

  const blogRoutes: MetadataRoute.Sitemap = [
    ...posts.map((post) => ({
      url: `${BASE_URL}/${post.locale}/blog/${post.slug}`,
      lastModified: post.updatedAt ? new Date(post.updatedAt) : now,
      changeFrequency: "weekly" as const,
      priority: post.locale === "ko" ? 0.82 : 0.78,
    })),
  ];

  return [...staticRoutes, ...blogRoutes];
}
