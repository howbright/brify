import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

const PAGE_SIZE = 1000;
const MAX_ROWS = 20000;

type TagCount = { name: string; count: number };
type ReadState = "unread" | "in_progress" | "read";

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
    const readStates = searchParams
      .getAll("readState")
      .filter((value): value is ReadState =>
        value === "unread" || value === "in_progress" || value === "read"
      );

    const supabase = await createClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      return NextResponse.json({ tags: [], error: "unauthorized" }, { status: 401 });
    }

    const counts = new Map<string, { name: string; count: number }>();
    const recent: string[] = [];
    const recentSet = new Set<string>();
    let offset = 0;
    let totalFetched = 0;

    while (offset < MAX_ROWS) {
      let query = supabase
        .from("maps")
        .select("id,tags,created_at")
        .eq("user_id", userData.user.id)
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

      const rows = (data ?? []) as Array<{
        id: string;
        tags?: string[] | null;
      }>;
      totalFetched += rows.length;
      let filteredRows = rows;

      if (readStates.length > 0 && rows.length > 0) {
        const mapIds = rows.map((row) => row.id).filter(Boolean);
        if (mapIds.length > 0) {
          const { data: stateRows, error: stateError } = await supabase
            .from("map_user_states")
            .select("map_id,read_status")
            .eq("user_id", userData.user.id)
            .in("map_id", mapIds);
          if (stateError) throw stateError;

          const stateByMapId = new Map<string, ReadState>();
          for (const row of stateRows ?? []) {
            stateByMapId.set(row.map_id, row.read_status as ReadState);
          }

          const selectedReadStates = new Set<ReadState>(readStates);
          filteredRows = rows.filter((row) => {
            const readState = stateByMapId.get(row.id) ?? "unread";
            return selectedReadStates.has(readState);
          });
        } else {
          filteredRows = [];
        }
      }

      for (const row of filteredRows) {
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
          if (!recentSet.has(key)) {
            recentSet.add(key);
            if (recent.length < limit) {
              recent.push(tag);
            }
          }
        }
      }

      if (rows.length < PAGE_SIZE) break;
      offset += PAGE_SIZE;
    }

    const tags: TagCount[] = Array.from(counts.values()).sort(
      (a, b) => b.count - a.count
    );
    const recentTags: TagCount[] = recent
      .map((name) => counts.get(name.toLowerCase()))
      .filter((v): v is TagCount => Boolean(v));

    return NextResponse.json({
      tags,
      recent: recentTags,
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
