"use client";

import { useMemo, useState } from "react";
import type { MapJobStatus } from "@/app/[locale]/(main)/video-to-map/types";

type SourceType = "youtube" | "website" | "file" | "manual";

const DATE_PRESETS = [
  { id: "7d", label: "지난 7일", days: 7 },
  { id: "30d", label: "지난 30일", days: 30 },
  { id: "90d", label: "지난 90일", days: 90 },
  { id: "1y", label: "지난 1년", days: 365 },
  { id: "all", label: "전체", days: null },
] as const;

type DatePresetId = (typeof DATE_PRESETS)[number]["id"] | "custom";
type SortValue = "created_desc" | "created_asc" | "updated_desc" | "title_asc";

type UseMapsListControlsOptions = {
  statusLabels: Record<MapJobStatus, string>;
  sourceLabels: Record<SourceType, string>;
};

function startOfDayIso(value: Date) {
  const next = new Date(value);
  next.setHours(0, 0, 0, 0);
  return next.toISOString();
}

function endOfDayIso(value: Date) {
  const next = new Date(value);
  next.setHours(23, 59, 59, 999);
  return next.toISOString();
}

function parseDateInput(value: string, endOfDay = false) {
  if (!value) return null;
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  return endOfDay ? endOfDayIso(parsed) : startOfDayIso(parsed);
}

export default function useMapsListControls({
  statusLabels,
  sourceLabels,
}: UseMapsListControlsOptions) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<SortValue>("created_desc");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [datePreset, setDatePreset] = useState<DatePresetId>("30d");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [statusFilters, setStatusFilters] = useState<MapJobStatus[]>([]);
  const [sourceFilters, setSourceFilters] = useState<SourceType[]>([]);

  const dateRange = useMemo(() => {
    if (datePreset === "all") return { from: null, to: null };
    if (datePreset === "custom") {
      return {
        from: parseDateInput(customFrom, false),
        to: parseDateInput(customTo, true),
      };
    }
    const preset = DATE_PRESETS.find((p) => p.id === datePreset);
    if (!preset || !preset.days) return { from: null, to: null };
    const now = new Date();
    const fromDate = new Date(now);
    fromDate.setDate(fromDate.getDate() - (preset.days - 1));
    return {
      from: startOfDayIso(fromDate),
      to: endOfDayIso(now),
    };
  }, [datePreset, customFrom, customTo]);

  const dateLabel = useMemo(() => {
    if (datePreset === "custom") {
      if (customFrom && customTo) return `${customFrom} ~ ${customTo}`;
      if (customFrom) return `${customFrom} 이후`;
      if (customTo) return `${customTo} 이전`;
      return "기간 선택";
    }
    const preset = DATE_PRESETS.find((p) => p.id === datePreset);
    return preset?.label ?? "기간 선택";
  }, [datePreset, customFrom, customTo]);

  const hasActiveFilters =
    statusFilters.length > 0 ||
    sourceFilters.length > 0 ||
    datePreset !== "30d";

  const statusSummary =
    statusFilters.length > 0
      ? statusFilters.map((value) => statusLabels[value]).join(", ")
      : null;

  const sourceSummary =
    sourceFilters.length > 0
      ? sourceFilters.map((value) => sourceLabels[value]).join(", ")
      : null;

  const toggleArrayValue = <T,>(
    value: T,
    setter: React.Dispatch<React.SetStateAction<T[]>>
  ) => {
    setter((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
    setPage(1);
  };

  const onQueryChange = (value: string) => {
    setQuery(value);
    setPage(1);
  };

  const onClearQuery = () => {
    setQuery("");
    setPage(1);
  };

  const onSortChange = (value: SortValue) => {
    setSort(value);
    setPage(1);
  };

  const onResetFilters = () => {
    setDatePreset("30d");
    setCustomFrom("");
    setCustomTo("");
    setStatusFilters([]);
    setSourceFilters([]);
    setPage(1);
  };

  return {
    query,
    setQuery,
    page,
    setPage,
    sort,
    setSort,
    filtersOpen,
    setFiltersOpen,
    datePreset,
    setDatePreset,
    customFrom,
    setCustomFrom,
    customTo,
    setCustomTo,
    statusFilters,
    setStatusFilters,
    sourceFilters,
    setSourceFilters,
    dateRange,
    dateLabel,
    hasActiveFilters,
    statusSummary,
    sourceSummary,
    toggleArrayValue,
    onQueryChange,
    onClearQuery,
    onSortChange,
    onResetFilters,
  };
}
