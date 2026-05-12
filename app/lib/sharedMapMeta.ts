import { adminSupabase } from "@/utils/supabase/admin";

export type SharedMapMeta = {
  id: string;
  title: string | null;
  youtubeTitle: string | null;
  description: string | null;
  summary: string | null;
  tags: string[];
  channelName: string | null;
  sourceType: string | null;
  sourceUrl: string | null;
  thumbnailUrl: string | null;
};

type SharedLocale = "ko" | "en" | "fr";

function normalizeLocale(locale?: string): SharedLocale {
  if (locale === "ko") return "ko";
  if (locale === "fr") return "fr";
  return "en";
}

const SHARED_OG_COPY: Record<
  SharedLocale,
  {
    untitled: string;
    fallbackDescription: string;
    keywordLabel: string;
  }
> = {
  ko: {
    untitled: "Brify 공유 구조맵",
    fallbackDescription: "공유된 구조맵을 확인해보세요.",
    keywordLabel: "핵심 키워드",
  },
  en: {
    untitled: "Brify Shared Structure Map",
    fallbackDescription: "Check out this shared structure map.",
    keywordLabel: "Key topics",
  },
  fr: {
    untitled: "Carte structurée partagée Brify",
    fallbackDescription: "Découvrez cette carte structurée partagée.",
    keywordLabel: "Sujets clés",
  },
};

export async function getSharedMapMetaByToken(
  token: string
): Promise<SharedMapMeta | null> {
  if (!token) return null;

  const { data, error } = await adminSupabase
    .from("maps")
    .select(
      "id, title, youtube_title, description, summary, tags, channel_name, source_type, source_url, thumbnail_url"
    )
    .eq("share_token", token)
    .eq("share_enabled", true)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    title: data.title,
    youtubeTitle: data.youtube_title,
    description: data.description,
    summary: data.summary,
    tags: Array.isArray(data.tags) ? data.tags.filter(Boolean) : [],
    channelName: data.channel_name,
    sourceType: data.source_type,
    sourceUrl: data.source_url,
    thumbnailUrl: data.thumbnail_url,
  };
}

export function buildSharedMapOgText(map: SharedMapMeta, locale?: string) {
  const currentLocale = normalizeLocale(locale);
  const copy = SHARED_OG_COPY[currentLocale];
  const title = map.title?.trim() || copy.untitled;
  const description =
    map.summary?.trim() ||
    map.description?.trim() ||
    (map.tags.length > 0
      ? `${copy.keywordLabel}: ${map.tags.slice(0, 3).join(", ")}`
      : copy.fallbackDescription);

  return {
    title,
    description,
  };
}
