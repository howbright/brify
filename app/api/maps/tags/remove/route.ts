import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

const PAGE_SIZE = 500;
const MAX_ROWS = 20000;

function normalizeTag(tag: string) {
  return tag.trim();
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const rawTag = typeof body?.tag === "string" ? body.tag : "";
    const tagName = normalizeTag(rawTag);
    if (!tagName) {
      return NextResponse.json({ error: "invalid_tag" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const tagLower = tagName.toLowerCase();
    let offset = 0;
    let updated = 0;

    while (offset < MAX_ROWS) {
      const { data, error } = await supabase
        .from("maps")
        .select("id,tags")
        .eq("user_id", userData.user.id)
        .contains("tags", [tagName])
        .range(offset, offset + PAGE_SIZE - 1);

      if (error) throw error;
      const rows = data ?? [];
      if (rows.length === 0) break;

      for (const row of rows as Array<{ id: string; tags?: string[] | null }>) {
        const tags = Array.isArray(row.tags) ? row.tags : [];
        const nextTags = tags.filter(
          (value) => value?.toLowerCase() !== tagLower
        );
        if (nextTags.length === tags.length) continue;
        const { error: updateError } = await supabase
          .from("maps")
          .update({ tags: nextTags })
          .eq("id", row.id)
          .eq("user_id", userData.user.id);
        if (updateError) throw updateError;
        updated += 1;
      }

      if (rows.length < PAGE_SIZE) break;
      offset += PAGE_SIZE;
    }

    return NextResponse.json({ tag: tagName, updated });
  } catch (error) {
    console.error("[maps/tags/remove] failed", error);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
