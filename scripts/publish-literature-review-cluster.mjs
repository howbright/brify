import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const root = process.cwd();

function loadEnvFile(fileName) {
  const filePath = path.join(root, fileName);
  if (!fs.existsSync(filePath)) return {};
  return Object.fromEntries(
    fs
      .readFileSync(filePath, "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const index = line.indexOf("=");
        return [
          line.slice(0, index).trim(),
          line.slice(index + 1).trim().replace(/^['"]|['"]$/g, ""),
        ];
      })
  );
}

const env = { ...loadEnvFile(".env"), ...loadEnvFile(".env.local"), ...process.env };

if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const koSlugs = [
  "how-to-start-literature-review",
  "how-to-organize-prior-research",
  "why-literature-review-matrix-matters",
  "why-grad-students-struggle-with-paper-notes",
  "how-to-find-research-gap",
  "literature-review-for-research-proposal",
  "prepare-papers-for-advisor-meeting",
  "group-papers-by-theme-for-literature-review",
  "when-zotero-notion-is-not-enough-for-literature-review",
  "how-to-select-papers-for-literature-review",
  "literature-review-outline-before-writing",
  "how-to-explain-differences-between-papers",
  "weekly-literature-review-routine-for-grad-students",
  "what-to-check-when-using-ai-for-literature-review",
];

const publishedAt = "2026-06-25T00:00:00.000Z"; // 2026-06-25 09:00:00 KST

const { data: koreanPosts, error: koreanError } = await supabase
  .from("blog_posts")
  .select("slug,translation_group_id")
  .eq("locale", "ko")
  .in("slug", koSlugs);

if (koreanError) throw koreanError;

const missingKoreanSlugs = koSlugs.filter(
  (slug) => !koreanPosts.some((post) => post.slug === slug)
);

if (missingKoreanSlugs.length > 0) {
  throw new Error(`Missing Korean source posts: ${missingKoreanSlugs.join(", ")}`);
}

const translationGroupIds = koreanPosts.map((post) => post.translation_group_id).filter(Boolean);

const { data: targetPosts, error: targetError } = await supabase
  .from("blog_posts")
  .select("id,locale,slug,status,published_at,translation_group_id")
  .in("locale", ["ko", "en", "fr"])
  .in("translation_group_id", translationGroupIds);

if (targetError) throw targetError;

const expectedCount = koSlugs.length * 3;
if (targetPosts.length !== expectedCount) {
  const groupCounts = translationGroupIds.map((groupId) => ({
    groupId,
    locales: targetPosts
      .filter((post) => post.translation_group_id === groupId)
      .map((post) => post.locale)
      .sort(),
  }));
  throw new Error(
    `Expected ${expectedCount} localized posts, found ${targetPosts.length}: ${JSON.stringify(groupCounts, null, 2)}`
  );
}

const { data: updatedPosts, error: updateError } = await supabase
  .from("blog_posts")
  .update({
    status: "published",
    published_at: publishedAt,
  })
  .in("id", targetPosts.map((post) => post.id))
  .select("id,locale,slug,status,published_at,translation_group_id")
  .order("locale", { ascending: true })
  .order("slug", { ascending: true });

if (updateError) throw updateError;

const summary = updatedPosts.reduce((acc, post) => {
  acc[post.locale] = (acc[post.locale] ?? 0) + 1;
  return acc;
}, {});

console.log(JSON.stringify({ publishedAt, count: updatedPosts.length, summary }, null, 2));
