import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const cwd = process.cwd();
const dryRun = process.argv.includes("--dry-run");
const overwrite = process.argv.includes("--overwrite");
const useAi = process.argv.includes("--ai");

function loadEnv(file) {
  const env = {};
  const filePath = path.join(cwd, file);
  if (!fs.existsSync(filePath)) return env;

  const text = fs.readFileSync(filePath, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

const env = {
  ...loadEnv(".env"),
  ...loadEnv(".env.local"),
  ...loadEnv(".env.production"),
  ...process.env,
};

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
const openAiApiKey = env.OPENAI_API_KEY;
const openAiModel = env.OPENAI_SEO_MODEL || env.OPENAI_MODEL || "gpt-4o-mini";

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

if (useAi && !openAiApiKey) {
  throw new Error("OPENAI_API_KEY is required when using --ai.");
}

const domainKeywords = {
  ko: [
    "AI 구조맵",
    "구조맵",
    "마인드맵",
    "논문 구조화",
    "논문 정리",
    "논문 요약",
    "문헌리뷰 도구",
    "전문 문서 구조화",
    "원문 근거 확인",
    "원문찾기",
    "연구 보고서 정리",
    "긴 글 요약",
    "유튜브 요약",
    "강의 노트 정리",
    "자료조사 정리",
    "연구자 생산성",
    "대학원생 도구",
    "PDF 구조화",
    "Brify",
  ],
  en: [
    "AI structure map",
    "structure map",
    "mind map",
    "research paper organization",
    "research paper summary",
    "literature review tool",
    "professional document analysis",
    "source trace",
    "source-grounded reading",
    "long text summary",
    "YouTube summary",
    "research workflow",
    "graduate student tool",
    "document structure tool",
    "Brify",
  ],
  fr: [
    "carte structurelle",
    "carte mentale",
    "résumé de documents",
    "outil de revue de littérature",
    "organisation d'articles scientifiques",
    "analyse de documents professionnels",
    "retour à la source",
    "lecture avec sources",
    "résumé de texte long",
    "outil pour chercheurs",
    "Brify",
  ],
};

const stopWords = new Set([
  "그리고",
  "그러나",
  "하지만",
  "입니다",
  "합니다",
  "있는",
  "없는",
  "위해",
  "에서",
  "으로",
  "에게",
  "보다",
  "때문",
  "the",
  "and",
  "for",
  "with",
  "that",
  "this",
  "from",
  "into",
  "pour",
  "avec",
  "dans",
  "des",
  "les",
  "une",
  "sur",
  "need",
  "researchers",
  "document",
  "documents",
  "work",
  "simple",
  "summary",
  "structure",
  "maps",
  "carte",
  "résumé",
]);

const genericSingleWords = new Set([
  "besoin",
  "chercheurs",
  "document",
  "documents",
  "need",
  "researchers",
  "simple",
  "structure",
  "maps",
  "work",
  "résumé",
  "carte",
  "structurelle",
  "professionnels",
  "필요합니다",
  "구조맵의",
  "연구자에게",
]);

function stripMarkdown(markdown) {
  return String(markdown || "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[[^\]]+\]\([^)]*\)/g, " ")
    .replace(/[>#*_`~-]/g, " ")
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeKeyword(keyword) {
  return String(keyword || "")
    .replace(/[“”"`]/g, "")
    .replace(/[.:;!?()[\]{}]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function extractHeadingPhrases(markdown) {
  const phrases = [];
  for (const line of String(markdown || "").split(/\r?\n/)) {
    const match = line.match(/^#{2,4}\s+(.+)/);
    if (match) {
      phrases.push(...match[1].split(/[,:：|/]/).map(normalizeKeyword));
    }
  }
  return phrases;
}

function ngrams(text, locale) {
  const cleaned = text
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
  const words = cleaned
    .split(" ")
    .map(normalizeKeyword)
    .filter((word) => word.length >= 2 && !stopWords.has(word.toLowerCase()));
  const out = [];
  const maxN = locale === "ko" ? 4 : 3;

  for (let n = maxN; n >= 1; n -= 1) {
    for (let i = 0; i <= words.length - n; i += 1) {
      const phrase = words.slice(i, i + n).join(" ");
      if (phrase.length >= 4 && phrase.length <= 42) {
        out.push(phrase);
      }
    }
  }

  return out;
}

function scoreKeyword(keyword, post, fullText) {
  const key = keyword.toLowerCase();
  const title = String(post.title || "").toLowerCase();
  const excerpt = String(post.excerpt || "").toLowerCase();
  const haystack = fullText.toLowerCase();
  let score = 0;

  if (title.includes(key)) score += 8;
  if (excerpt.includes(key)) score += 5;
  score += Math.min(haystack.split(key).length - 1, 6) * 2;
  if (keyword.split(" ").length >= 2) score += 2;
  if (keyword.length > 24) score -= 1;

  return score;
}

function seedKeywords(post) {
  const locale = ["ko", "en", "fr"].includes(post.locale) ? post.locale : "en";
  const text = `${post.slug || ""} ${post.title || ""} ${post.excerpt || ""}`.toLowerCase();

  if (locale === "ko") {
    const seeds = ["AI 구조맵", "Brify"];
    if (/논문|research-paper/.test(text)) {
      seeds.push("논문 구조화", "논문 정리", "논문 요약 한계", "문헌리뷰 도구", "원문 근거 확인");
    }
    if (/전문 문서|professional|document|문서/.test(text)) {
      seeds.push("전문 문서 구조화", "긴 문서 정리", "문서 구조화 도구", "원문찾기");
    }
    if (/요약/.test(text)) {
      seeds.push("요약보다 구조화", "긴 글 요약 한계");
    }
    return seeds;
  }

  if (locale === "fr") {
    const seeds = ["carte structurelle", "Brify"];
    if (/article|recherche|research-paper|chercheur/.test(text)) {
      seeds.push(
        "organisation d'articles scientifiques",
        "outil de revue de littérature",
        "résumé d'article de recherche",
        "retour à la source"
      );
    }
    if (/document|professionnel/.test(text)) {
      seeds.push(
        "analyse de documents professionnels",
        "structuration de documents longs",
        "outil de structuration documentaire",
        "lecture avec sources"
      );
    }
    return seeds;
  }

  const seeds = ["AI structure map", "Brify"];
  if (/research-paper|research|paper|researcher/.test(text)) {
    seeds.push(
      "research paper structure map",
      "research paper organization",
      "literature review tool",
      "source trace"
    );
  }
  if (/professional|document/.test(text)) {
    seeds.push(
      "professional document analysis",
      "long document structure map",
      "document structure tool",
      "source-grounded reading"
    );
  }
  if (/summary|summar/.test(text)) {
    seeds.push("summary vs structure map", "long text summary");
  }
  return seeds;
}

function inferKeywords(post) {
  const locale = ["ko", "en", "fr"].includes(post.locale) ? post.locale : "en";
  const markdown = stripMarkdown(post.markdown);
  const fullText = `${post.title || ""}\n${post.excerpt || ""}\n${markdown}`;
  const seeds = seedKeywords(post);
  const candidates = [];

  for (const keyword of domainKeywords[locale] || domainKeywords.en) {
    if (fullText.toLowerCase().includes(keyword.toLowerCase())) {
      candidates.push(keyword);
    }
  }

  candidates.push(...extractHeadingPhrases(post.markdown));
  candidates.push(...ngrams(`${post.title || ""} ${post.excerpt || ""}`, locale));

  const selected = [];
  const selectedKeys = new Set();

  for (const seed of seeds) {
    const keyword = normalizeKeyword(seed);
    const key = keyword.toLowerCase();
    if (!keyword || selectedKeys.has(key)) continue;
    selected.push(keyword);
    selectedKeys.add(key);
  }

  const byKey = new Map();
  for (const rawKeyword of candidates) {
    const keyword = normalizeKeyword(rawKeyword);
    if (!keyword || keyword.length < 2 || keyword.length > 42) continue;
    if (!keyword.includes(" ") && genericSingleWords.has(keyword.toLowerCase())) continue;
    const key = keyword.toLowerCase();
    if (selectedKeys.has(key)) continue;
    const score = scoreKeyword(keyword, post, fullText);
    const prev = byKey.get(key);
    if (!prev || score > prev.score) {
      byKey.set(key, { keyword, score });
    }
  }

  for (const item of [...byKey.values()]
    .sort((a, b) => b.score - a.score)
    .map((item) => item.keyword)) {
    if (selected.length >= 8) break;
    const key = item.toLowerCase();
    if (!selectedKeys.has(key)) {
      selected.push(item);
      selectedKeys.add(key);
    }
  }

  return selected.slice(0, 8);
}

function truncateForPrompt(value, maxChars) {
  const text = String(value || "").trim();
  return text.length > maxChars ? `${text.slice(0, maxChars)}\n...` : text;
}

async function inferKeywordsWithAi(post) {
  const localeName =
    post.locale === "ko" ? "Korean" : post.locale === "fr" ? "French" : "English";
  const fallback = inferKeywords(post);
  const prompt = [
    "You are an SEO editor for Brify, a product that turns long research/professional documents into detailed structure maps with source tracing.",
    `Post locale: ${post.locale} (${localeName})`,
    "",
    "Task:",
    "- Read the blog title, excerpt, and markdown.",
    "- Return 6 to 8 SEO keywords or short keyword phrases in the same language as the post.",
    "- Prefer search-intent phrases a real user would search.",
    "- Include Brify/product-specific terms only when relevant.",
    "- Avoid generic single words like document, need, summary, researchers, work, simple.",
    "- Avoid duplicate variants and overly long phrases.",
    "- Return only JSON: {\"keywords\":[\"...\"]}",
    "",
    "Good Korean examples: 논문 구조화, AI 구조맵, 문헌리뷰 도구, 원문 근거 확인",
    "Good English examples: research paper structure map, literature review tool, source tracing, AI structure map",
    "Good French examples: carte structurelle, outil de revue de littérature, retour à la source, analyse de documents professionnels",
    "",
    "Post:",
    JSON.stringify({
      title: post.title,
      excerpt: post.excerpt,
      markdown: truncateForPrompt(stripMarkdown(post.markdown), 9000),
      fallbackCandidates: fallback,
    }),
  ].join("\n");

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      authorization: `Bearer ${openAiApiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: openAiModel,
      messages: [
        {
          role: "system",
          content:
            "Return strict JSON only. You write concise, high-intent SEO keyword phrases.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
      response_format: { type: "json_object" },
    }),
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(
      `OpenAI keyword extraction failed for ${post.slug}: ${
        payload?.error?.message || response.statusText
      }`
    );
  }

  const content = payload?.choices?.[0]?.message?.content || "";
  const parsed = JSON.parse(content);
  const keywords = Array.isArray(parsed?.keywords) ? parsed.keywords : [];
  const normalized = [];
  const seen = new Set();

  for (const rawKeyword of keywords) {
    const keyword = normalizeKeyword(rawKeyword);
    const key = keyword.toLowerCase();
    if (!keyword || keyword.length < 2 || keyword.length > 50 || seen.has(key)) {
      continue;
    }
    seen.add(key);
    normalized.push(keyword);
  }

  return normalized.length > 0 ? normalized.slice(0, 8) : fallback;
}

const { data: posts, error } = await supabase
  .from("blog_posts")
  .select("id,locale,slug,title,excerpt,markdown,seo_keywords,status,updated_at")
  .order("updated_at", { ascending: false });

if (error) throw error;

const rows = [];
for (const post of posts || []) {
  rows.push({
    post,
    nextKeywords: useAi ? await inferKeywordsWithAi(post) : inferKeywords(post),
    existingKeywords: Array.isArray(post.seo_keywords) ? post.seo_keywords : [],
  });
}

const targets = rows.filter(
  ({ existingKeywords, nextKeywords }) =>
    nextKeywords.length > 0 && (overwrite || existingKeywords.length === 0)
);

console.log(
  JSON.stringify(
    {
      dryRun,
      overwrite,
      useAi,
      model: useAi ? openAiModel : null,
      total: rows.length,
      targets: targets.length,
      preview: rows.map(({ post, existingKeywords, nextKeywords }) => ({
        id: post.id,
        locale: post.locale,
        slug: post.slug,
        title: post.title,
        existingKeywords,
        nextKeywords,
        willUpdate: nextKeywords.length > 0 && (overwrite || existingKeywords.length === 0),
      })),
    },
    null,
    2
  )
);

if (dryRun) {
  process.exit(0);
}

for (const { post, nextKeywords } of targets) {
  const { error: updateError } = await supabase
    .from("blog_posts")
    .update({ seo_keywords: nextKeywords })
    .eq("id", post.id);

  if (updateError) {
    throw new Error(`Failed to update ${post.slug}: ${updateError.message}`);
  }
}

console.log(`Updated ${targets.length} blog_posts.seo_keywords rows.`);
