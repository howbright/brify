import { createHash } from "crypto";
import type { Database } from "@/app/types/database.types";
import { adminSupabase } from "@/utils/supabase/admin";

export type MapOpenAccessMode =
  Database["public"]["Enums"]["map_open_access_mode"];

type RecordMapOpenEventInput = {
  mapId: string;
  userId?: string | null;
  accessMode: MapOpenAccessMode;
  locale?: string | null;
  sessionKey?: string | null;
  userAgent?: string | null;
  referrer?: string | null;
};

function cleanText(value: string | null | undefined, maxLength: number) {
  const cleaned = value?.trim();
  if (!cleaned) return null;
  return cleaned.slice(0, maxLength);
}

function hashUserAgent(userAgent: string | null | undefined) {
  const cleaned = userAgent?.trim();
  if (!cleaned) return null;
  return createHash("sha256").update(cleaned).digest("hex");
}

export async function recordMapOpenEvent(input: RecordMapOpenEventInput) {
  const mapId = input.mapId.trim();
  if (!mapId) {
    throw new Error("mapId is required");
  }

  const userId = input.userId ?? null;
  const sessionKey = cleanText(input.sessionKey, 120);
  const locale = cleanText(input.locale, 12);
  const referrer = cleanText(input.referrer, 500);
  const userAgentHash = hashUserAgent(input.userAgent);
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();

  const { data: recentEvents, error: recentError } = await adminSupabase
    .from("map_open_events")
    .select("id,user_id,session_key")
    .eq("map_id", mapId)
    .eq("access_mode", input.accessMode)
    .gt("opened_at", tenMinutesAgo)
    .order("opened_at", { ascending: false })
    .limit(50);

  if (recentError) {
    throw new Error(`map_open_events.recent: ${recentError.message}`);
  }

  const deduped = (recentEvents ?? []).some((event) => {
    if (userId && event.user_id === userId) return true;
    if (sessionKey && event.session_key === sessionKey) return true;
    return false;
  });

  if (deduped) {
    return { inserted: false, deduped: true };
  }

  const { error: insertError } = await adminSupabase.from("map_open_events").insert({
    map_id: mapId,
    user_id: userId,
    access_mode: input.accessMode,
    locale,
    session_key: sessionKey,
    user_agent_hash: userAgentHash,
    referrer,
  });

  if (insertError) {
    throw new Error(`map_open_events.insert: ${insertError.message}`);
  }

  return { inserted: true, deduped: false };
}
