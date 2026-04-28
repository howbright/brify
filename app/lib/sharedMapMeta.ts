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

export function buildSharedMapOgText(map: SharedMapMeta) {
  const title = map.title?.trim() || "Brify Mind Map";
  const description =
    map.summary?.trim() ||
    map.description?.trim() ||
    (map.tags.length > 0
      ? `핵심 키워드: ${map.tags.slice(0, 3).join(", ")}`
      : "공유된 마인드맵을 확인해보세요.");

  return {
    title,
    description,
  };
}
