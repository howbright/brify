import { adminSupabase } from "@/utils/supabase/admin";

export type SharedMapMeta = {
  id: string;
  title: string | null;
  shortTitle: string | null;
  description: string | null;
  summary: string | null;
  tags: string[];
  channelName: string | null;
  sourceType: string | null;
  thumbnailUrl: string | null;
};

export async function getSharedMapMetaByToken(
  token: string
): Promise<SharedMapMeta | null> {
  if (!token) return null;

  const { data, error } = await adminSupabase
    .from("maps")
    .select(
      "id, title, short_title, description, summary, tags, channel_name, source_type, thumbnail_url"
    )
    .eq("share_token", token)
    .eq("share_enabled", true)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    title: data.title,
    shortTitle: data.short_title,
    description: data.description,
    summary: data.summary,
    tags: Array.isArray(data.tags) ? data.tags.filter(Boolean) : [],
    channelName: data.channel_name,
    sourceType: data.source_type,
    thumbnailUrl: data.thumbnail_url,
  };
}

export function buildSharedMapOgText(map: SharedMapMeta) {
  const title =
    map.shortTitle?.trim() || map.title?.trim() || "Brify Structure Map";
  const description =
    map.summary?.trim() ||
    map.description?.trim() ||
    (map.tags.length > 0
      ? `핵심 키워드: ${map.tags.slice(0, 3).join(", ")}`
      : "공유된 구조맵을 확인해보세요.");

  return {
    title,
    description,
  };
}
