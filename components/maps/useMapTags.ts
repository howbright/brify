"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { MapDraft, MapJobStatus } from "@/app/[locale]/(main)/video-to-map/types";

type SourceType = "youtube" | "website" | "file" | "manual";
type TagSort = "recent" | "name" | "count_desc" | "count_asc";
type ContentFilter = "notes" | "terms";

type DateRange = {
  from: string | null;
  to: string | null;
};

type UseMapTagsOptions = {
  locale: string | null;
  filtersOpen: boolean;
  mobileTagSheetOpen: boolean;
  dateRange: DateRange;
  statusFilters: MapJobStatus[];
  sourceFilters: SourceType[];
  contentFilters: ContentFilter[];
  updateDrafts: React.Dispatch<React.SetStateAction<MapDraft[]>>;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  noTagFilter: string;
};

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) return error.message;
  return fallback;
}

export default function useMapTags({
  locale,
  filtersOpen,
  mobileTagSheetOpen,
  dateRange,
  statusFilters,
  sourceFilters,
  contentFilters,
  updateDrafts,
  setPage,
  noTagFilter,
}: UseMapTagsOptions) {
  const [tagOrganizeMode, setTagOrganizeMode] = useState(false);
  const [tagFilters, setTagFilters] = useState<string[]>([]);
  const [tagOptions, setTagOptions] = useState<Array<{ name: string; count: number }>>([]);
  const [recentTagOptions, setRecentTagOptions] = useState<
    Array<{ name: string; count: number }>
  >([]);
  const [tagsLoading, setTagsLoading] = useState(false);
  const [tagListQuery, setTagListQuery] = useState("");
  const [tagSort, setTagSort] = useState<TagSort>("recent");
  const [tagDeleteTarget, setTagDeleteTarget] = useState<string | null>(null);
  const [tagDeleteOpen, setTagDeleteOpen] = useState(false);
  const [tagDeleteSubmitting, setTagDeleteSubmitting] = useState(false);
  const [tagEditOpen, setTagEditOpen] = useState(false);
  const [tagEditDraft, setTagEditDraft] = useState<MapDraft | null>(null);
  const [tagEditSubmitting, setTagEditSubmitting] = useState(false);
  const [tagMergeOpen, setTagMergeOpen] = useState(false);
  const [selectedTagNames, setSelectedTagNames] = useState<string[]>([]);
  const [tagRefreshKey, setTagRefreshKey] = useState(0);

  const isTagOrganizeActive = tagOrganizeMode || mobileTagSheetOpen;
  const tagQuery = tagListQuery.trim().toLowerCase();

  const mergedTagOptions = useMemo(() => {
    const byName = new Map<string, { name: string; count: number; recentIndex: number | null }>();

    recentTagOptions.forEach((tag, index) => {
      byName.set(tag.name, {
        name: tag.name,
        count: tag.count,
        recentIndex: index,
      });
    });

    tagOptions.forEach((tag) => {
      const existing = byName.get(tag.name);
      byName.set(tag.name, {
        name: tag.name,
        count: tag.count,
        recentIndex: existing?.recentIndex ?? null,
      });
    });

    const items = Array.from(byName.values()).filter((tag) =>
      tagQuery ? tag.name.toLowerCase().includes(tagQuery) : true
    );

    if (tagSort === "name") {
      const collator = new Intl.Collator(locale ?? "en", {
        numeric: true,
        sensitivity: "base",
      });
      return items.sort((a, b) => collator.compare(a.name, b.name));
    }

    if (tagSort === "count_desc") {
      return items.sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        return a.name.localeCompare(b.name, locale ?? "en");
      });
    }

    if (tagSort === "count_asc") {
      return items.sort((a, b) => {
        if (a.count !== b.count) return a.count - b.count;
        return a.name.localeCompare(b.name, locale ?? "en");
      });
    }

    return items.sort((a, b) => {
      const aIndex = a.recentIndex ?? Number.MAX_SAFE_INTEGER;
      const bIndex = b.recentIndex ?? Number.MAX_SAFE_INTEGER;
      if (aIndex !== bIndex) return aIndex - bIndex;
      return a.name.localeCompare(b.name, locale ?? "en");
    });
  }, [recentTagOptions, tagOptions, tagQuery, tagSort, locale]);

  const effectiveTagFilters = useMemo(
    () =>
      isTagOrganizeActive
        ? selectedTagNames.filter((tag) => tag !== noTagFilter)
        : tagFilters,
    [selectedTagNames, isTagOrganizeActive, tagFilters, noTagFilter]
  );

  const includesNoTagFilter =
    isTagOrganizeActive && selectedTagNames.includes(noTagFilter);

  useEffect(() => {
    if (!filtersOpen && !isTagOrganizeActive) return;
    let cancelled = false;

    (async () => {
      try {
        setTagsLoading(true);
        const params = new URLSearchParams();
        if (dateRange.from) params.set("from", dateRange.from);
        if (dateRange.to) params.set("to", dateRange.to);
        if (statusFilters.length > 0) {
          statusFilters.forEach((status) => params.append("status", status));
        }
        if (sourceFilters.length > 0) {
          sourceFilters.forEach((source) => params.append("source", source));
        }
        if (contentFilters.length > 0) {
          contentFilters.forEach((content) => params.append("content", content));
        }
        params.set("limit", "24");
        const res = await fetch(`/api/maps/tags?${params.toString()}`);
        if (!res.ok) throw new Error("태그를 불러오지 못했습니다.");
        const json = (await res.json()) as {
          tags?: Array<{ name: string; count: number }>;
          recent?: Array<{ name: string; count: number }>;
        };
        if (cancelled) return;
        setTagOptions(json.tags ?? []);
        setRecentTagOptions(json.recent ?? []);
      } catch {
        if (cancelled) return;
        setTagOptions([]);
        setRecentTagOptions([]);
      } finally {
        if (!cancelled) setTagsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    filtersOpen,
    isTagOrganizeActive,
    dateRange.from,
    dateRange.to,
    statusFilters,
    sourceFilters,
    contentFilters,
    tagRefreshKey,
  ]);

  useEffect(() => {
    if (!isTagOrganizeActive) {
      setSelectedTagNames([]);
    }
  }, [isTagOrganizeActive]);

  const toggleSelectedTag = (tag: string) => {
    setSelectedTagNames((prev) =>
      prev.includes(tag)
        ? prev.filter((name) => name !== tag)
        : [...prev, tag]
    );
    setPage(1);
  };

  const handleTagDelete = async (tagName: string) => {
    if (!tagName || tagDeleteSubmitting) return;
    try {
      setTagDeleteSubmitting(true);
      const res = await fetch("/api/maps/tags/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tag: tagName }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.error || "요청 실패");
      }

      updateDrafts((prev) =>
        prev.map((draft) => ({
          ...draft,
          tags: (draft.tags ?? []).filter((t) => t !== tagName),
        }))
      );
      setTagOptions((prev) => prev.filter((tag) => tag.name !== tagName));
      setRecentTagOptions((prev) => prev.filter((tag) => tag.name !== tagName));
      setSelectedTagNames((prev) => prev.filter((name) => name !== tagName));
      toast.success(`#${tagName} 태그를 삭제했어요.`);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "태그 삭제에 실패했습니다."));
    } finally {
      setTagDeleteSubmitting(false);
    }
  };

  const handleTagMerge = async (targetTag: string) => {
    const sources = selectedTagNames.filter(
      (tag) => Boolean(tag) && tag !== noTagFilter
    );
    if (!targetTag || sources.length < 2) return;
    try {
      const res = await fetch("/api/maps/tags/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ targetTag, sourceTags: sources }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.error || "요청 실패");
      }
      updateDrafts((prev) =>
        prev.map((draft) => {
          const tags = Array.isArray(draft.tags) ? draft.tags : [];
          const next = tags.map((tag) =>
            sources.includes(tag) ? targetTag : tag
          );
          const seen = new Set<string>();
          const deduped = next.filter((tag) => {
            const key = tag.toLowerCase();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
          return { ...draft, tags: deduped };
        })
      );
      setSelectedTagNames([targetTag]);
      setTagMergeOpen(false);
      setTagRefreshKey((prev) => prev + 1);
      toast.success("태그를 합쳤어요.");
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "태그 합치기에 실패했습니다."));
    }
  };

  const openTagEditor = (draft: MapDraft) => {
    setTagEditDraft(draft);
    setTagEditOpen(true);
  };

  const handleTagEditSave = async (tags: string[]) => {
    if (!tagEditDraft || tagEditSubmitting) return;
    const normalized = tags.map((tag) => tag.trim()).filter(Boolean);
    const unique = Array.from(new Set(normalized));
    try {
      setTagEditSubmitting(true);
      const res = await fetch("/api/maps/tags/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ mapId: tagEditDraft.id, tags: unique }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.error || "요청 실패");
      }
      const nextTags: string[] = Array.isArray(json?.tags) ? json.tags : unique;
      updateDrafts((prev) =>
        prev.map((draft) =>
          draft.id === tagEditDraft.id ? { ...draft, tags: nextTags } : draft
        )
      );
      setTagRefreshKey((prev) => prev + 1);
      setTagEditOpen(false);
      setTagEditDraft(null);
      toast.success("태그를 업데이트했어요.");
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "태그 업데이트에 실패했습니다."));
    } finally {
      setTagEditSubmitting(false);
    }
  };

  return {
    tagOrganizeMode,
    setTagOrganizeMode,
    tagFilters,
    setTagFilters,
    tagOptions,
    tagsLoading,
    tagListQuery,
    setTagListQuery,
    tagSort,
    setTagSort,
    tagDeleteTarget,
    setTagDeleteTarget,
    tagDeleteOpen,
    setTagDeleteOpen,
    tagDeleteSubmitting,
    tagEditOpen,
    setTagEditOpen,
    tagEditDraft,
    tagEditSubmitting,
    tagMergeOpen,
    setTagMergeOpen,
    selectedTagNames,
    setSelectedTagNames,
    mergedTagOptions,
    effectiveTagFilters,
    includesNoTagFilter,
    isTagOrganizeActive,
    toggleSelectedTag,
    handleTagDelete,
    handleTagMerge,
    openTagEditor,
    handleTagEditSave,
  };
}
