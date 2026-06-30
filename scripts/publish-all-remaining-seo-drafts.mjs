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

const publishedAt = "2026-06-26T00:00:00.000Z";

const { data: drafts, error: fetchError } = await supabase
  .from("blog_posts")
  .select("id,locale,slug,title,status,published_at,translation_group_id")
  .eq("status", "draft")
  .order("created_at", { ascending: true });

if (fetchError) throw fetchError;

const remainingSeoDrafts = drafts ?? [];

if (remainingSeoDrafts.length === 0) {
  console.log(JSON.stringify({ count: 0, publishedAt, summary: {}, results: [] }, null, 2));
  process.exit(0);
}

const results = [];

for (const draft of remainingSeoDrafts) {
  const { data, error } = await supabase
    .from("blog_posts")
    .update({
      status: "published",
      published_at: publishedAt,
    })
    .eq("id", draft.id)
    .eq("status", "draft")
    .select("id,locale,slug,title,status,published_at,translation_group_id,updated_at")
    .single();

  if (error) throw error;
  results.push(data);
}

const summary = results.reduce((acc, post) => {
  acc[post.locale] = (acc[post.locale] ?? 0) + 1;
  return acc;
}, {});

console.log(JSON.stringify({ count: results.length, publishedAt, summary, results }, null, 2));
