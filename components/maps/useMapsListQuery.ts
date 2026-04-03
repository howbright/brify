"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import type { Database } from "@/app/types/database.types";
import type { MapDraft, MapJobStatus } from "@/app/[locale]/(main)/video-to-map/types";

type MapRow = Database["public"]["Tables"]["maps"]["Row"];
type SourceType = "youtube" | "website" | "file" | "manual";

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
  locale?: string | null;
  toDraft: (row: MapRow) => MapDraft;
};

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
  locale,
  toDraft,
}: UseMapsListQueryParams) {
  const [drafts, setDrafts] = useState<MapDraft[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const supabase = createClient();
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;
        const q = isTagOrganizeActive ? "" : query.trim();

        let request = supabase.from("maps").select(listFields, { count: "exact" });

        if (sort === "created_desc") {
          if (!includesNoTagFilter) request = request.range(from, to);
          request = request.order("created_at", { ascending: false });
        } else if (sort === "created_asc") {
          if (!includesNoTagFilter) request = request.range(from, to);
          request = request.order("created_at", { ascending: true });
        } else if (sort === "updated_desc") {
          if (!includesNoTagFilter) request = request.range(from, to);
          request = request.order("updated_at", {
            ascending: false,
            nullsFirst: false,
          });
        } else if (sort === "title_asc" && !includesNoTagFilter) {
          // handled on client after fetch
        } else if (includesNoTagFilter) {
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
        if (statusFilters.length > 0) {
          request = request.in("map_status", statusFilters);
        }
        if (sourceFilters.length > 0) {
          request = request.in("source_type", sourceFilters);
        }
        if (!includesNoTagFilter && effectiveTagFilters.length > 0) {
          request = request.overlaps("tags", effectiveTagFilters);
        }

        const { data, error, count } = await request;

        if (cancelled) return;
        if (error) throw error;

        const rows = (data ?? []) as MapRow[];

        const filteredRows = includesNoTagFilter
          ? rows.filter((row) => {
              const tags = Array.isArray(row.tags) ? row.tags : [];
              const hasNoTags = tags.length === 0;
              const matchesNamedTag =
                effectiveTagFilters.length > 0
                  ? tags.some((tag) => effectiveTagFilters.includes(tag))
                  : false;
              return hasNoTags || matchesNamedTag;
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
        } else if (includesNoTagFilter) {
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
    locale,
    toDraft,
  ]);

  return {
    drafts,
    setDrafts,
    totalCount,
    setTotalCount,
    loading,
    error,
  };
}
