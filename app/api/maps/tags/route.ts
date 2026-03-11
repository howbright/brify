import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

const PAGE_SIZE = 1000;
const MAX_ROWS = 20000;

type TagCount = { name: string; count: number };

function normalizeTag(tag: string) {
  return tag.trim();
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const limit = Math.max(
      1,
      Math.min(100, Number(searchParams.get("limit") ?? "24") || 24)
    );
    const statuses = searchParams.getAll("status");
    const sources = searchParams.getAll("source");

    const supabase = await createClient();

    const counts = new Map<string, { name: string; count: number }>();
    let offset = 0;
    let totalFetched = 0;

    while (offset < MAX_ROWS) {
      let query = supabase
        .from("maps")
        .select("tags,created_at")
        .order("created_at", { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1);

      if (from) {
        query = query.gte("created_at", from);
      }
      if (to) {
        query = query.lte("created_at", to);
      }
      if (statuses.length > 0) {
        query = query.in("map_status", statuses);
      }
      if (sources.length > 0) {
        query = query.in("source_type", sources);
      }

      const { data, error } = await query;
      if (error) throw error;

      const rows = data ?? [];
      totalFetched += rows.length;

      for (const row of rows as Array<{ tags?: string[] | null }>) {
        if (!Array.isArray(row.tags)) continue;
        for (const rawTag of row.tags) {
          if (typeof rawTag !== "string") continue;
          const tag = normalizeTag(rawTag);
          if (!tag) continue;
          const key = tag.toLowerCase();
          const existing = counts.get(key);
          if (existing) {
            existing.count += 1;
          } else {
            counts.set(key, { name: tag, count: 1 });
          }
        }
      }

      if (rows.length < PAGE_SIZE) break;
      offset += PAGE_SIZE;
    }

    const tags: TagCount[] = Array.from(counts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);

    return NextResponse.json({
      tags,
      truncated: totalFetched >= MAX_ROWS,
    });
  } catch (error) {
    console.error("[maps/tags] failed", error);
    return NextResponse.json(
      { tags: [], error: "failed" },
      { status: 500 }
    );
  }
}
