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

const targets = [
  { locale: "ko", slug: "how-to-use-brify" },
  { locale: "ko", slug: "how-to-make-a-structure-map" },
  { locale: "ko", slug: "make-first-structure-map-in-brify" },
  { locale: "ko", slug: "clean-up-complex-structure-map" },
  { locale: "ko", slug: "reuse-brify-structure-map" },
  { locale: "en", slug: "how-to-use-brify" },
  { locale: "en", slug: "how-to-make-a-structure-map" },
  { locale: "en", slug: "make-first-structure-map-in-brify" },
  { locale: "en", slug: "clean-up-complex-structure-map" },
  { locale: "en", slug: "reuse-brify-structure-map" },
  { locale: "fr", slug: "comment-utiliser-brify" },
  { locale: "fr", slug: "comment-creer-carte-structure" },
  { locale: "fr", slug: "creer-premiere-carte-structure-brify" },
  { locale: "fr", slug: "simplifier-carte-structure-complexe" },
  { locale: "fr", slug: "reutiliser-carte-structure-brify" },
];

const results = [];

for (const target of targets) {
  const { data, error } = await supabase
    .from("blog_posts")
    .update({
      status: "published",
      published_at: publishedAt,
    })
    .eq("locale", target.locale)
    .eq("slug", target.slug)
    .select("id,locale,slug,title,status,published_at,translation_group_id,updated_at")
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    throw new Error(`Missing blog post: ${target.locale}/${target.slug}`);
  }
  results.push(data);
}

const summary = results.reduce((acc, post) => {
  acc[post.locale] = (acc[post.locale] ?? 0) + 1;
  return acc;
}, {});

console.log(JSON.stringify({ count: results.length, publishedAt, summary, results }, null, 2));
