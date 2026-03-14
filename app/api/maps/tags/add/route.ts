import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

function normalizeTag(tag: string) {
  return tag.trim();
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const rawTag = typeof body?.tag === "string" ? body.tag : "";
    const mapId = typeof body?.mapId === "string" ? body.mapId : "";
    const tagName = normalizeTag(rawTag);

    if (!tagName || !mapId) {
      return NextResponse.json({ error: "invalid_request" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const { data: row, error } = await supabase
      .from("maps")
      .select("id,tags")
      .eq("id", mapId)
      .eq("user_id", userData.user.id)
      .single();

    if (error || !row) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const tags = Array.isArray(row.tags) ? row.tags : [];
    const lowerTag = tagName.toLowerCase();
    const hasTag = tags.some(
      (value) => typeof value === "string" && value.toLowerCase() === lowerTag
    );

    if (hasTag) {
      return NextResponse.json({ updated: false, tags });
    }

    const nextTags = [...tags, tagName];
    const { error: updateError } = await supabase
      .from("maps")
      .update({ tags: nextTags })
      .eq("id", mapId)
      .eq("user_id", userData.user.id);

    if (updateError) throw updateError;

    return NextResponse.json({ updated: true, tags: nextTags });
  } catch (error) {
    console.error("[maps/tags/add] failed", error);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
