import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import type { BlogPost } from "./types";

const BLOG_CONTENT_BASE_DIR = path.join(process.cwd(), "app", "content", "blog");

function normalizeLocale(locale: string): "ko" | "en" {
  return locale === "ko" ? "ko" : "en";
}

async function loadPostsFromDirectory(locale: "ko" | "en"): Promise<BlogPost[]> {
  const localeDir = path.join(BLOG_CONTENT_BASE_DIR, locale);
  const filenames = await readdir(localeDir);
  const jsonFiles = filenames.filter((name) => name.endsWith(".json"));

  const posts = await Promise.all(
    jsonFiles.map(async (filename) => {
      const filePath = path.join(localeDir, filename);
      const raw = await readFile(filePath, "utf-8");
      return JSON.parse(raw) as BlogPost;
    })
  );

  return posts.sort((a, b) => a.title.localeCompare(b.title));
}

export async function getBlogPostsByLocale(locale: string): Promise<BlogPost[]> {
  return loadPostsFromDirectory(normalizeLocale(locale));
}

export async function getBlogPostByLocaleAndSlug(
  locale: string,
  slug: string
): Promise<BlogPost | null> {
  const posts = await getBlogPostsByLocale(locale);
  return posts.find((post) => post.slug === slug) ?? null;
}
