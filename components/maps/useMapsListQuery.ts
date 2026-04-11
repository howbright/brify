"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import type { Database } from "@/app/types/database.types";
import type { MapDraft, MapJobStatus } from "@/app/[locale]/(main)/video-to-map/types";

type MapRow = Database["public"]["Tables"]["maps"]["Row"];
type SourceType = "youtube" | "website" | "file" | "manual";
type ContentFilter = "notes" | "terms";

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
  statusFilters: MapJobStatus[];
  sourceFilters: SourceType[];
  contentFilters: ContentFilter[];
  locale?: string | null;
  toDraft: (row: MapRow) => MapDraft;
};

function expandStatusFilters(statusFilters: MapJobStatus[]) {
  const expanded = new Set<MapJobStatus>();

  statusFilters.forEach((status) => {
    if (status === "processing") {
      expanded.add("idle");
      expanded.add("queued");
      expanded.add("processing");
      return;
    }
    expanded.add(status);
  });

  return Array.from(expanded);
}

function normalizeTag(tag: string) {
  return tag.trim().toLowerCase();
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

  const hasInFlightMaps = drafts.some((draft) => draft.status === "processing");

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

        if (sort === "created_desc") {
          if (!shouldFilterTagsClientSide) request = request.range(from, to);
          request = request.order("created_at", { ascending: false });
        } else if (sort === "created_asc") {
          if (!shouldFilterTagsClientSide) request = request.range(from, to);
          request = request.order("created_at", { ascending: true });
        } else if (sort === "updated_desc") {
          if (!shouldFilterTagsClientSide) request = request.range(from, to);
          request = request.order("updated_at", {
            ascending: false,
            nullsFirst: false,
          });
        } else if (sort === "title_asc" && !shouldFilterTagsClientSide) {
          // handled on client after fetch
        } else if (shouldFilterTagsClientSide) {
          // full result set for client-side OR filtering with empty-tag pseudo filter
        }

        if (q) {
          const safeQuery = q.replace(/[(),{}"'\\]/g, " ").trim();
          if (safeQuery) {
            const tagToken = safeQuery.split(/\s+/)[0];
            request = request.or(
              `short_title.ilike.%${safeQuery}%,title.ilike.%${safeQuery}%,description.ilike.%${safeQuery}%,tags.cs.{${tagToken}}`
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
          const pagedRows = sortedRows.slice(from, to + 1);
          setDrafts(pagedRows.map(toDraft));
          setTotalCount(sortedRows.length);
        } else if (shouldFilterTagsClientSide) {
          const pagedRows = filteredRows.slice(from, to + 1);
          setDrafts(pagedRows.map(toDraft));
          setTotalCount(filteredRows.length);
        } else {
          setDrafts(rows.map(toDraft));
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
