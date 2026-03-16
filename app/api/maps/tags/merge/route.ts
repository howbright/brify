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
    const targetRaw = typeof body?.targetTag === "string" ? body.targetTag : "";
    const targetTag = normalizeTag(targetRaw);
    const sourceTags = Array.isArray(body?.sourceTags)
      ? body.sourceTags.map((tag: string) => normalizeTag(tag)).filter(Boolean)
      : [];

    if (!targetTag || sourceTags.length < 2) {
      return NextResponse.json({ error: "invalid_request" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const sourceLower = new Set(sourceTags.map((tag) => tag.toLowerCase()));
    let offset = 0;
    let updated = 0;

    while (offset < MAX_ROWS) {
      const { data, error } = await supabase
        .from("maps")
        .select("id,tags")
        .eq("user_id", userData.user.id)
        .overlaps("tags", sourceTags)
        .range(offset, offset + PAGE_SIZE - 1);

      if (error) throw error;
      const rows = data ?? [];
      if (rows.length === 0) break;

      for (const row of rows as Array<{ id: string; tags?: string[] | null }>) {
        const tags = Array.isArray(row.tags) ? row.tags : [];
        const next = tags.map((tag) =>
          sourceLower.has(tag.toLowerCase()) ? targetTag : tag
        );
        const seen = new Set<string>();
        const deduped = next.filter((tag) => {
          const key = tag.toLowerCase();
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        const changed =
          deduped.length !== tags.length ||
          tags.some((tag, idx) => tag !== deduped[idx]);
        if (!changed) continue;
        const { error: updateError } = await supabase
          .from("maps")
          .update({ tags: deduped })
          .eq("id", row.id)
          .eq("user_id", userData.user.id);
        if (updateError) throw updateError;
        updated += 1;
      }

      if (rows.length < PAGE_SIZE) break;
      offset += PAGE_SIZE;
    }

    return NextResponse.json({ updated });
  } catch (error) {
    console.error("[maps/tags/merge] failed", error);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
