"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import type { Database } from "@/app/types/database.types";
import type { MapDraft, MapJobStatus } from "@/app/[locale]/(main)/video-to-map/types";
import type { MapStatusFilter, ReadStateFilter } from "./useMapsListControls";

type MapRow = Database["public"]["Tables"]["maps"]["Row"];
type MapNoteRow = Database["public"]["Tables"]["map_notes"]["Row"];
type MapTermRow = Database["public"]["Tables"]["map_terms"]["Row"];
type MindNode = {
  id?: string;
  note?: string | null;
  highlight?: { variant?: string } | null;
  children?: MindNode[];
};
type SourceType = "youtube" | "website" | "file" | "manual";
type ContentFilter = "notes" | "terms";
type ReadStatus = "unread" | "in_progress" | "read";

type UseMapsListQueryParams = {
  listFields: string;
  page: number;
  pageSize: number;
  query: string;
  isTagOrganizeActive: boolean;
  sort: "created_desc" | "created_asc" | "updated_desc" | "title_asc";
  includesNoTagFilter: boolean;
  effectiveTagFilters: string[];
  dateRange: { from: string | null; to: string | null };
  statusFilters: MapStatusFilter[];
  sourceFilters: SourceType[];
  contentFilters: ContentFilter[];
  readStateFilters: ReadStateFilter[];
  locale?: string | null;
  toDraft: (row: MapRow) => MapDraft;
};

function expandStatusFilters(statusFilters: MapStatusFilter[]) {
  const expanded = new Set<MapJobStatus>();

  statusFilters.forEach((status) => {
    if (status === "processing" || status === "processing_structure" || status === "processing_metadata") {
      expanded.add("idle");
      expanded.add("queued");
      expanded.add("processing_structure");
      expanded.add("processing_metadata");
      return;
    }
    expanded.add(status);
  });

  return Array.from(expanded);
}

function normalizeTag(tag: string) {
  return tag.trim().toLowerCase();
}

async function withActualCounts(
  supabase: ReturnType<typeof createClient>,
  rows: MapRow[]
) {
  const mapIds = Array.from(
    new Set(rows.map((row) => row.id).filter((id): id is string => Boolean(id)))
  );

  if (mapIds.length === 0) return rows;

  const [
    { data: noteRows, error: notesError },
    { data: termRows, error: termsError },
    { data: mapMindRows, error: mapMindError },
  ] =
    await Promise.all([
      supabase.from("map_notes").select("map_id").in("map_id", mapIds),
      supabase.from("map_terms").select("map_id").in("map_id", mapIds),
      supabase.from("maps").select("id,mind_elixir").in("id", mapIds),
    ]);

  if (notesError || termsError || mapMindError) {
    return rows;
  }

  const noteCounts = new Map<string, number>();
  const termCounts = new Map<string, number>();

  ((noteRows ?? []) as Pick<MapNoteRow, "map_id">[]).forEach((row) => {
    noteCounts.set(row.map_id, (noteCounts.get(row.map_id) ?? 0) + 1);
  });

  ((termRows ?? []) as Pick<MapTermRow, "map_id">[]).forEach((row) => {
    termCounts.set(row.map_id, (termCounts.get(row.map_id) ?? 0) + 1);
  });

  const derivedNoteCounts = new Map<string, number>();

  const countDerivedNotes = (raw: unknown) => {
    const root =
      raw &&
      typeof raw === "object" &&
      "nodeData" in (raw as Record<string, unknown>)
        ? ((raw as { nodeData?: MindNode | null }).nodeData ?? null)
        : (raw as MindNode | null);

    if (!root || typeof root !== "object") return 0;

    let count = 0;
    const visit = (node: MindNode | null | undefined) => {
      if (!node || typeof node !== "object") return;
      const note = typeof node.note === "string" ? node.note.trim() : "";
      if (note) count += 1;
      if (node.highlight?.variant) count += 1;
      node.children?.forEach((child) => visit(child));
    };

    visit(root);
    return count;
  };

  ((mapMindRows ?? []) as Pick<MapRow, "id" | "mind_elixir">[]).forEach((row) => {
    derivedNoteCounts.set(row.id, countDerivedNotes(row.mind_elixir));
  });

  return rows.map((row) => ({
    ...row,
    notes_count: (noteCounts.get(row.id) ?? 0) + (derivedNoteCounts.get(row.id) ?? 0),
    terms_count: termCounts.get(row.id) ?? 0,
  })) as MapRow[];
}

async function withUserStates(rows: MapRow[]) {
  const mapIds = Array.from(
    new Set(rows.map((row) => row.id).filter((id): id is string => Boolean(id)))
  );
  if (!mapIds.length) return rows;

  const res = await fetch("/api/maps/states", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ mapIds }),
  });
  if (!res.ok) return rows;

  const json = await res.json().catch(() => ({}));
  const states = (json?.states ?? {}) as Record<
    string,
    {
      readStatus?: ReadStatus;
      starred?: boolean;
      progressPercent?: number;
      lastViewedAt?: string | null;
    }
  >;

  return rows.map((row) => {
    const state = states[row.id];
    return {
      ...row,
      read_status: state?.readStatus ?? "unread",
      starred: state?.starred ?? false,
      progress_percent: typeof state?.progressPercent === "number" ? state.progressPercent : 0,
      last_viewed_at: state?.lastViewedAt ?? null,
    } as MapRow;
  });
}

export default function useMapsListQuery({
  listFields,
  page,
  pageSize,
  query,
  isTagOrganizeActive,
  sort,
  includesNoTagFilter,
  effectiveTagFilters,
  dateRange,
  statusFilters,
  sourceFilters,
  contentFilters,
  readStateFilters,
  locale,
  toDraft,
}: UseMapsListQueryParams) {
  const [drafts, setDrafts] = useState<MapDraft[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);

  const refresh = useCallback(() => {
    setRefreshNonce((value) => value + 1);
  }, []);

  const hasInFlightMaps = drafts.some((draft) => draft.status === "processing_structure" || draft.status === "processing_metadata");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const supabase = createClient();
        const effectiveStatusFilters = expandStatusFilters(statusFilters);
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;
        const q = isTagOrganizeActive ? "" : query.trim();

        let request = supabase.from("maps").select(listFields, { count: "exact" });

        const shouldFilterTagsClientSide =
          effectiveTagFilters.length > 0 || includesNoTagFilter;
        const shouldFilterReadStateClientSide = readStateFilters.length > 0;
        const shouldPageOnServer =
          !shouldFilterTagsClientSide &&
          !shouldFilterReadStateClientSide &&
          sort !== "title_asc";

        if (sort === "created_desc") {
          if (shouldPageOnServer) request = request.range(from, to);
          request = request.order("created_at", { ascending: false });
        } else if (sort === "created_asc") {
          if (shouldPageOnServer) request = request.range(from, to);
          request = request.order("created_at", { ascending: true });
        } else if (sort === "updated_desc") {
          if (shouldPageOnServer) request = request.range(from, to);
          request = request.order("updated_at", {
            ascending: false,
            nullsFirst: false,
          });
        } else if (sort === "title_asc" && !shouldFilterTagsClientSide && !shouldFilterReadStateClientSide) {
          // handled on client after fetch
        } else if (shouldFilterTagsClientSide || shouldFilterReadStateClientSide) {
          // full result set for client-side OR filtering with empty-tag pseudo filter
        }

        if (q) {
          const safeQuery = q.replace(/[(),{}"'\\]/g, " ").trim();
          if (safeQuery) {
            const tagToken = safeQuery.split(/\s+/)[0];
            request = request.or(
              `title.ilike.%${safeQuery}%,description.ilike.%${safeQuery}%,tags.cs.{${tagToken}}`
            );
          }
        }
        if (dateRange.from) {
          request = request.gte("created_at", dateRange.from);
        }
        if (dateRange.to) {
          request = request.lte("created_at", dateRange.to);
        }
        if (effectiveStatusFilters.length > 0) {
          request = request.in("map_status", effectiveStatusFilters);
        }
        if (sourceFilters.length > 0) {
          request = request.in("source_type", sourceFilters);
        }
        if (contentFilters.length === 1) {
          if (contentFilters[0] === "notes") {
            request = request.gt("notes_count", 0);
          } else if (contentFilters[0] === "terms") {
            request = request.gt("terms_count", 0);
          }
        } else if (contentFilters.length > 1) {
          request = request.or("notes_count.gt.0,terms_count.gt.0");
        }
        const { data, error, count } = await request;

        if (cancelled) return;
        if (error) throw error;

        const rows = (data ?? []) as unknown as MapRow[];

        const normalizedFilters = new Set(
          effectiveTagFilters.map((tag) => normalizeTag(tag)).filter(Boolean)
        );

        const filteredRows = shouldFilterTagsClientSide
          ? rows.filter((row) => {
              const tags = Array.isArray(row.tags) ? row.tags : [];
              const normalizedTags = tags
                .map((tag) => (typeof tag === "string" ? normalizeTag(tag) : ""))
                .filter(Boolean);
              const hasNoTags = normalizedTags.length === 0;
              const matchesNamedTag =
                normalizedFilters.size > 0
                  ? normalizedTags.some((tag) => normalizedFilters.has(tag))
                  : false;
              if (includesNoTagFilter) {
                return hasNoTags || matchesNamedTag;
              }
              return matchesNamedTag;
            })
          : rows;

        if (sort === "title_asc") {
          const collator = new Intl.Collator(locale ?? "en", {
            numeric: true,
            sensitivity: "base",
          });
          const sortedRows = [...filteredRows].sort((a, b) => {
            const compared = collator.compare(a.title ?? "", b.title ?? "");
            if (compared !== 0) return compared;
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          });
          if (shouldFilterReadStateClientSide) {
            const rowsWithStates = await withUserStates(sortedRows);
            if (cancelled) return;
            const allowedReadStates = new Set<ReadStateFilter>(readStateFilters);
            const filteredByReadState = rowsWithStates.filter((row) =>
              allowedReadStates.has(
                ((row as MapRow & { read_status?: ReadStateFilter }).read_status ?? "unread") as ReadStateFilter
              )
            );
            const pagedRows = filteredByReadState.slice(from, to + 1);
            const rowsWithCounts = await withActualCounts(supabase, pagedRows);
            if (cancelled) return;
            setDrafts(rowsWithCounts.map(toDraft));
            setTotalCount(filteredByReadState.length);
            return;
          }
          const pagedRows = sortedRows.slice(from, to + 1);
          const rowsWithCounts = await withActualCounts(supabase, pagedRows);
          const rowsWithStates = await withUserStates(rowsWithCounts);
          if (cancelled) return;
          setDrafts(rowsWithStates.map(toDraft));
          setTotalCount(sortedRows.length);
        } else if (shouldFilterTagsClientSide) {
          const pagedRows = filteredRows.slice(from, to + 1);
          if (shouldFilterReadStateClientSide) {
            const rowsWithStates = await withUserStates(filteredRows);
            if (cancelled) return;
            const allowedReadStates = new Set<ReadStateFilter>(readStateFilters);
            const filteredByReadState = rowsWithStates.filter((row) =>
              allowedReadStates.has(
                ((row as MapRow & { read_status?: ReadStateFilter }).read_status ?? "unread") as ReadStateFilter
              )
            );
            const pagedByReadState = filteredByReadState.slice(from, to + 1);
            const rowsWithCounts = await withActualCounts(supabase, pagedByReadState);
            if (cancelled) return;
            setDrafts(rowsWithCounts.map(toDraft));
            setTotalCount(filteredByReadState.length);
            return;
          }
          const rowsWithCounts = await withActualCounts(supabase, pagedRows);
          const rowsWithStates = await withUserStates(rowsWithCounts);
          if (cancelled) return;
          setDrafts(rowsWithStates.map(toDraft));
          setTotalCount(filteredRows.length);
        } else if (shouldFilterReadStateClientSide) {
          const rowsWithStates = await withUserStates(rows);
          if (cancelled) return;
          const allowedReadStates = new Set<ReadStateFilter>(readStateFilters);
          const filteredByReadState = rowsWithStates.filter((row) =>
            allowedReadStates.has(
              ((row as MapRow & { read_status?: ReadStateFilter }).read_status ?? "unread") as ReadStateFilter
            )
          );
          const pagedRows = filteredByReadState.slice(from, to + 1);
          const rowsWithCounts = await withActualCounts(supabase, pagedRows);
          if (cancelled) return;
          setDrafts(rowsWithCounts.map(toDraft));
          setTotalCount(filteredByReadState.length);
        } else {
          const rowsWithCounts = await withActualCounts(supabase, rows);
          const rowsWithStates = await withUserStates(rowsWithCounts);
          if (cancelled) return;
          setDrafts(rowsWithStates.map(toDraft));
          setTotalCount(count ?? 0);
        }
      } catch (e: unknown) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "목록을 불러오지 못했습니다.");
        setDrafts([]);
        setTotalCount(0);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    listFields,
    page,
    pageSize,
    query,
    isTagOrganizeActive,
    sort,
    includesNoTagFilter,
    effectiveTagFilters,
    dateRange.from,
    dateRange.to,
    statusFilters,
    sourceFilters,
    contentFilters,
    readStateFilters,
    locale,
    toDraft,
    refreshNonce,
  ]);

  useEffect(() => {
    if (!hasInFlightMaps) return;

    const intervalId = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      if (typeof document.hasFocus === "function" && !document.hasFocus()) return;
      refresh();
    }, 12000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [hasInFlightMaps, refresh]);

  return {
    drafts,
    setDrafts,
    totalCount,
    setTotalCount,
    loading,
    error,
    hasInFlightMaps,
    refresh,
  };
}
