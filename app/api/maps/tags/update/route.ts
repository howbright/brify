import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

function normalizeTags(tags: string[]) {
  const seen = new Set<string>();
  return tags
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0)
    .filter((tag) => {
      const key = tag.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const mapId = typeof body?.mapId === "string" ? body.mapId : "";
    const rawTags = Array.isArray(body?.tags) ? body.tags : [];
    const tags = normalizeTags(rawTags);

    if (!mapId) {
      return NextResponse.json({ error: "invalid_request" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const { error: updateError } = await supabase
      .from("maps")
      .update({ tags })
      .eq("id", mapId)
      .eq("user_id", userData.user.id);

    if (updateError) throw updateError;

    return NextResponse.json({ tags });
  } catch (error) {
    console.error("[maps/tags/update] failed", error);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
