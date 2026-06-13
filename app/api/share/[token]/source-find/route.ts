import { NextResponse } from "next/server";
import { adminSupabase } from "@/utils/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const SOURCE_FIND_WINDOW_CHARS = 220;
const SOURCE_FIND_MAX_CANDIDATES = 50;
const DEFAULT_RETENTION_HOURS = 24;

type SourceFindCandidate = {
  start: number;
  end: number;
  score: number;
  matchedAnchor: string;
  snippet: string;
  snippetStart: number;
  snippetEnd: number;
};

type SourceFindBody = {
  anchorText?: unknown;
  anchorKeywords?: unknown;
};

function jsonError(status: number, error: string) {
  return NextResponse.json({ ok: false, error }, { status });
}

function normalizeStringArray(value: unknown, maxItems: number) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => String(item ?? "").trim())
    .filter(Boolean)
    .slice(0, maxItems);
}

function normalizeForLooseMatch(value: string) {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function findAllIndexes(haystack: string, needle: string) {
  const indices: number[] = [];
  if (!needle) return indices;
  let start = 0;
  while (start < haystack.length) {
    const idx = haystack.indexOf(needle, start);
    if (idx === -1) break;
    indices.push(idx);
    start = idx + Math.max(1, Math.floor(needle.length / 2));
  }
  return indices;
}

function buildSourceSnippet(source: string, start: number, end: number) {
  const snippetStart = Math.max(0, start - SOURCE_FIND_WINDOW_CHARS);
  const snippetEnd = Math.min(source.length, end + SOURCE_FIND_WINDOW_CHARS);
  return {
    snippet: source.slice(snippetStart, snippetEnd),
    snippetStart,
    snippetEnd,
  };
}

function collectAnchorCandidates(sourceText: string, anchors: string[]) {
  const candidates: SourceFindCandidate[] = [];
  const sourceLower = sourceText.toLowerCase();
  const sourceLoose = normalizeForLooseMatch(sourceText);

  for (const rawAnchor of anchors) {
    const anchor = String(rawAnchor ?? "").trim();
    if (!anchor) continue;

    const anchorLower = anchor.toLowerCase();
    const directMatches = findAllIndexes(sourceLower, anchorLower);

    for (const start of directMatches) {
      const end = start + anchor.length;
      const { snippet, snippetStart, snippetEnd } = buildSourceSnippet(
        sourceText,
        start,
        end
      );
      candidates.push({
        start,
        end,
        score: 1,
        matchedAnchor: anchor,
        snippet,
        snippetStart,
        snippetEnd,
      });
    }

    if (directMatches.length > 0) continue;

    const looseAnchor = normalizeForLooseMatch(anchor);
    if (!looseAnchor || looseAnchor.length < 6) continue;
    if (!sourceLoose.includes(looseAnchor)) continue;

    const anchorTokens = looseAnchor.split(" ").filter(Boolean);
    const probe = anchorTokens.slice(0, 4).join(" ");
    if (!probe) continue;

    const probeIndex = sourceLower.indexOf(
      probe.replace(/[^\p{L}\p{N}\s]/gu, " ").trim()
    );
    if (probeIndex === -1) continue;

    const end = Math.min(sourceText.length, probeIndex + Math.max(20, anchor.length));
    const { snippet, snippetStart, snippetEnd } = buildSourceSnippet(
      sourceText,
      probeIndex,
      end
    );
    candidates.push({
      start: probeIndex,
      end,
      score: 0.8,
      matchedAnchor: anchor,
      snippet,
      snippetStart,
      snippetEnd,
    });
  }

  const dedup = new Map<string, SourceFindCandidate>();
  for (const candidate of candidates) {
    const key = `${candidate.start}:${candidate.end}`;
    const prev = dedup.get(key);
    if (!prev || candidate.score > prev.score) {
      dedup.set(key, candidate);
    }
  }

  return Array.from(dedup.values())
    .sort((a, b) => b.score - a.score || a.start - b.start)
    .slice(0, SOURCE_FIND_MAX_CANDIDATES);
}

function collectFuzzyAnchorCandidates(
  sourceText: string,
  anchors: string[],
  options?: { minScore?: number; minCommonTokens?: number }
) {
  const minScore =
    typeof options?.minScore === "number" ? options.minScore : 0.8;
  const minCommonTokens =
    typeof options?.minCommonTokens === "number"
      ? options.minCommonTokens
      : 3;
  const sentenceCandidates = sourceText
    .split(/[\n.!?]+/g)
    .map((line) => line.trim())
    .filter((line) => line.length >= 20)
    .slice(0, 2000);
  const results: SourceFindCandidate[] = [];

  for (const rawAnchor of anchors) {
    const anchor = String(rawAnchor ?? "").trim();
    if (!anchor) continue;
    const normalizedAnchor = normalizeForLooseMatch(anchor);
    const anchorTokens = normalizedAnchor.split(" ").filter(Boolean);
    if (anchorTokens.length < 3) continue;

    for (const sentence of sentenceCandidates) {
      const normalizedSentence = normalizeForLooseMatch(sentence);
      if (!normalizedSentence) continue;

      const sentenceTokenSet = new Set(
        normalizedSentence.split(" ").filter(Boolean)
      );
      let common = 0;
      for (const token of anchorTokens) {
        if (sentenceTokenSet.has(token)) common += 1;
      }

      const score = common / anchorTokens.length;
      if (score < minScore) continue;
      if (common < minCommonTokens) continue;

      const start = sourceText.indexOf(sentence);
      if (start === -1) continue;
      const end = start + sentence.length;
      const { snippet, snippetStart, snippetEnd } = buildSourceSnippet(
        sourceText,
        start,
        end
      );
      results.push({
        start,
        end,
        score,
        matchedAnchor: anchor,
        snippet,
        snippetStart,
        snippetEnd,
      });
    }
  }

  const dedup = new Map<string, SourceFindCandidate>();
  for (const result of results) {
    const key = `${result.start}:${result.end}`;
    const prev = dedup.get(key);
    if (!prev || result.score > prev.score) {
      dedup.set(key, result);
    }
  }

  return Array.from(dedup.values())
    .sort((a, b) => b.score - a.score || a.start - b.start)
    .slice(0, SOURCE_FIND_MAX_CANDIDATES);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    if (!token) return jsonError(400, "token is required");

    let body: SourceFindBody;
    try {
      body = (await req.json()) as SourceFindBody;
    } catch {
      return jsonError(400, "Invalid JSON body");
    }

    const anchorText = normalizeStringArray(body.anchorText, 4);
    const anchorKeywords = normalizeStringArray(body.anchorKeywords, 8);
    if (anchorText.length === 0) {
      return jsonError(400, "anchorText is required");
    }

    const { data, error } = await adminSupabase
      .from("maps")
      .select(
        "id, extracted_text, source_retention_hours, share_enabled, share_token"
      )
      .eq("share_token", token)
      .eq("share_enabled", true)
      .single();

    if (error || !data) return jsonError(404, "NOT_FOUND");

    const sourceText =
      typeof data.extracted_text === "string" ? data.extracted_text.trim() : "";
    const retentionHours =
      typeof data.source_retention_hours === "number"
        ? data.source_retention_hours
        : DEFAULT_RETENTION_HOURS;

    if (!sourceText) {
      return NextResponse.json({
        ok: true,
        status: "not_found",
        message: "No retained source text is available for this map.",
        expiresAt: null,
        retentionHours,
        hasPaidAccess: false,
        allowedOptions: [DEFAULT_RETENTION_HOURS],
        sourceText: null,
        candidates: [],
      });
    }

    let candidates = collectAnchorCandidates(sourceText, anchorText);
    const exactMatchCount = candidates.length;
    if (candidates.length === 0) {
      candidates = collectFuzzyAnchorCandidates(sourceText, anchorText, {
        minScore: 0.88,
        minCommonTokens: 4,
      });
    }

    const matchMode =
      candidates.length > 0 ? (exactMatchCount > 0 ? "exact" : "fuzzy") : "none";

    return NextResponse.json({
      ok: true,
      status: candidates.length > 0 ? "found" : "not_found",
      message:
        candidates.length > 0
          ? undefined
          : "No direct anchor sentence match found in retained source text.",
      expiresAt: null,
      retentionHours,
      hasPaidAccess: false,
      allowedOptions: [DEFAULT_RETENTION_HOURS],
      sourceText,
      candidates,
      matchedAnchorText: anchorText[0] ?? null,
      matchMode,
      matchCount: candidates.length,
      anchorKeywords,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "INTERNAL_ERROR";
    return jsonError(500, message);
  }
}
