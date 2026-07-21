"use client";

import { useEffect, useMemo, useRef, useState, type RefObject, type ReactNode } from "react";
import { toast } from "sonner";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { IBM_Plex_Sans_KR } from "next/font/google";
import { Icon } from "@iconify/react";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import * as Tooltip from "@radix-ui/react-tooltip";
import LeftPanel from "@/components/maps/LeftPanel";
import MapTutorialOverlay from "@/components/maps/tutorial/MapTutorialOverlay";
import { getMapTutorialSteps } from "@/components/maps/tutorial/mapTutorialSteps";
import useTutorialIsMobile from "@/components/maps/tutorial/useTutorialIsMobile";
import ClientMindElixir, {
  type ClientMindElixirHandle,
} from "@/components/ClientMindElixir";
import { MIND_THEMES, MIND_THEME_BY_NAME } from "@/components/maps/themes";

const DEFAULT_THEME_NAME = "Default";
const PROFILE_THEME_NAME = "내설정테마";
const SHARED_DEFAULT_THEME_NAME = "Inkline";
const LOADING_THEME_NAME = "Inkline";
import MetadataDialog from "@/app/[locale]/(main)/video-to-map/MetadataDialog";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import DiscardDraftDialog from "@/components/maps/DiscardDraftDialog";
import ShareDialog from "@/components/maps/ShareDialog";
import ShortcutsDialog from "@/components/maps/ShortcutsDialog";
import TagEditDialog from "@/components/maps/TagEditDialog";
import MapSlideshowDialog from "@/components/maps/MapSlideshowDialog";
import {
  buildDfsSlides,
  type SlideItem,
  type SlideshowNode,
} from "@/components/maps/mapSlideshow";
import { createClient } from "@/utils/supabase/client";
import LanguageSelector from "@/components/LanguageSelector";
import type { Database } from "@/app/types/database.types";
import type {
  SourceFindCandidate,
  SourceFindResponse,
  SourceFindStatus,
} from "@/app/types/mapSource";
import type { MapDraft, MapJobStatus } from "@/app/[locale]/(main)/video-to-map/types";
import { getLoadingMindElixir } from "@/app/lib/mind-elixir/sampleData";
import {
  getMapTutorialCompleted,
  setMapTutorialCompleted,
} from "@/app/lib/mapTutorialState";
import { useMapOpenEvent } from "@/app/hooks/useMapOpenEvent";
import { useMindThemePreference } from "@/components/maps/MindThemePreferenceProvider";
import FullscreenHeader from "@/components/maps/FullscreenHeader";

function getDisplaySourceFindStatus(sourceText: string): SourceFindStatus {
  if (sourceText.trim().length > 0) return "found";
  return "not_found";
}

function getMapViewStateStorageKey(mapId: string) {
  return `brify:map:${mapId}:view-state-v1`;
}

type MindNode = {
  children?: MindNode[];
  expanded?: boolean;
  ts?: unknown;
};

type RegenerateMode = "restructure" | "expand" | "translate";

function hasValidTimestampInMindData(raw: unknown): boolean {
  if (!raw || typeof raw !== "object") return false;
  const maybeRoot = raw as { nodeData?: MindNode };
  const root = maybeRoot.nodeData ?? (raw as MindNode);
  const stack: MindNode[] = [root];
  while (stack.length > 0) {
    const node = stack.pop();
    if (!node || typeof node !== "object") continue;
    const value = node.ts;
    if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
      return true;
    }
    if (typeof value === "string") {
      const parsed = Number(value.trim());
      if (Number.isFinite(parsed) && parsed >= 0) {
        return true;
      }
    }
    if (Array.isArray(node.children) && node.children.length > 0) {
      for (const child of node.children) stack.push(child);
    }
  }
  return false;
}

type MapRow = Database["public"]["Tables"]["maps"]["Row"];
type ReadStatus = Database["public"]["Enums"]["map_read_status"];
type MindElixirNode = {
  id?: string;
  topic?: string;
  root?: boolean;
  expanded?: boolean;
  children?: MindElixirNode[];
  meta?: Record<string, unknown>;
};

function hasSourceRangeHint(node: MindElixirNode | null) {
  const hint = node?.meta?.sourceRangeHint;
  if (!hint || typeof hint !== "object") return false;
  const range = hint as { startText?: unknown; endText?: unknown };
  return (
    typeof range.startText === "string" &&
    range.startText.trim().length > 0 &&
    typeof range.endText === "string" &&
    range.endText.trim().length > 0
  );
}

function hasChildNodes(node: MindElixirNode | null) {
  return Array.isArray(node?.children) && node.children.length > 0;
}

const PROCESSING_PLACEHOLDER_META_KEY = "brifyProcessingPlaceholder";
const PROCESSING_PROGRESS_CAP = 97;
const PROCESSING_BASELINE_CHARS = 32852;
const PROCESSING_BASELINE_MS = 111956;
const PROCESSING_MS_PER_CHAR = PROCESSING_BASELINE_MS / PROCESSING_BASELINE_CHARS;
const PROCESSING_FALLBACK_EXPECTED_MS = PROCESSING_BASELINE_MS;
const PROCESSING_MIN_EXPECTED_MS = 20000;

function getNodeRegenerationPlaceholderTopic(locale?: string) {
  if (locale === "ko") return "구조화 중입니다...";
  if (locale === "fr") return "Structuration en cours...";
  return "Structuring...";
}

function cloneMindElixirData(data: MapRow["mind_elixir"]) {
  if (!data) return null;
  try {
    if (typeof structuredClone === "function") {
      return structuredClone(data) as MapRow["mind_elixir"];
    }
  } catch {
    // Fall back to JSON cloning below.
  }

  try {
    return JSON.parse(JSON.stringify(data)) as MapRow["mind_elixir"];
  } catch {
    return data;
  }
}

function withNodeProcessingPlaceholderNode(
  data: MapRow["mind_elixir"],
  nodeId: string | null,
  locale?: string
): MapRow["mind_elixir"] {
  const normalizedTargetId = normalizeMindNodeId(String(nodeId ?? "").trim());
  if (!normalizedTargetId) return data;

  const cloned = cloneMindElixirData(data);
  if (!cloned || typeof cloned !== "object") return data;

  const root = (cloned as { nodeData?: MindElixirNode }).nodeData ?? (cloned as MindElixirNode);
  const stack: MindElixirNode[] = [root];
  while (stack.length > 0) {
    const current = stack.shift();
    if (!current) continue;
    if (normalizeMindNodeId(String(current.id ?? "")) === normalizedTargetId) {
      const children = Array.isArray(current.children) ? current.children : [];
      const alreadyHasPlaceholder = children.some((child) =>
        Boolean(child.meta?.[PROCESSING_PLACEHOLDER_META_KEY])
      );
      if (children.length === 0 || alreadyHasPlaceholder) {
        current.children = alreadyHasPlaceholder
          ? children
          : [
              {
                id: `__brify_regenerating_${current.id ?? normalizedTargetId}`,
                topic: getNodeRegenerationPlaceholderTopic(locale),
                children: [],
                meta: {
                  [PROCESSING_PLACEHOLDER_META_KEY]: true,
                },
              },
            ];
        current.expanded = true;
      }
      return cloned;
    }
    if (Array.isArray(current.children) && current.children.length > 0) {
      stack.unshift(...current.children);
    }
  }

  return cloned;
}

function stripProcessingPlaceholderNodes(
  data: MapRow["mind_elixir"] | null
): MapRow["mind_elixir"] | null {
  const cloned = cloneMindElixirData(data);
  if (!cloned || typeof cloned !== "object") return data;

  const root = (cloned as { nodeData?: MindElixirNode }).nodeData ?? (cloned as MindElixirNode);
  const stripNode = (node: MindElixirNode) => {
    if (!Array.isArray(node.children)) return;
    node.children = node.children.filter((child) => {
      const isPlaceholder = Boolean(child.meta?.[PROCESSING_PLACEHOLDER_META_KEY]);
      if (!isPlaceholder) stripNode(child);
      return !isPlaceholder;
    });
  };

  stripNode(root);
  return cloned;
}

function getMindElixirRoot(data: MapRow["mind_elixir"] | null): MindElixirNode | null {
  if (!data || typeof data !== "object") return null;
  return ((data as { nodeData?: MindElixirNode }).nodeData ??
    (data as MindElixirNode)) as MindElixirNode;
}

function findMindNodeById(
  data: MapRow["mind_elixir"] | null,
  nodeId: string
): MindElixirNode | null {
  const root = getMindElixirRoot(data);
  if (!root) return null;
  const normalizedTargetId = normalizeMindNodeId(nodeId);

  const stack: MindElixirNode[] = [root];
  while (stack.length > 0) {
    const current = stack.shift();
    if (!current) continue;
    if (normalizeMindNodeId(String(current.id ?? "")) === normalizedTargetId) {
      return current;
    }
    if (Array.isArray(current.children) && current.children.length > 0) {
      stack.unshift(...current.children);
    }
  }

  return null;
}

function normalizeMindNodeId(nodeId: string | null) {
  const id = String(nodeId ?? "").trim();
  return id.startsWith("me") ? id.slice(2) : id;
}

function collectExpandedState(data: MapRow["mind_elixir"] | null) {
  const root = getMindElixirRoot(data);
  const state = new Map<string, boolean>();
  if (!root) return state;

  const stack: MindElixirNode[] = [root];
  while (stack.length > 0) {
    const current = stack.shift();
    if (!current) continue;
    const id = normalizeMindNodeId(String(current.id ?? ""));
    if (id) {
      state.set(id, current.expanded !== false);
    }
    if (Array.isArray(current.children) && current.children.length > 0) {
      stack.unshift(...current.children);
    }
  }

  return state;
}

function withExpandedState(
  data: MapRow["mind_elixir"],
  expandedState: Map<string, boolean>,
  forceExpandedNodeId?: string | null
): MapRow["mind_elixir"] {
  if (expandedState.size === 0 && !forceExpandedNodeId) return data;
  const cloned = cloneMindElixirData(data);
  if (!cloned || typeof cloned !== "object") return data;

  const forceId = normalizeMindNodeId(forceExpandedNodeId ?? null);
  const root = getMindElixirRoot(cloned);
  if (!root) return cloned;

  const stack: MindElixirNode[] = [root];
  while (stack.length > 0) {
    const current = stack.shift();
    if (!current) continue;
    const id = normalizeMindNodeId(String(current.id ?? ""));
    if (id && expandedState.has(id)) {
      current.expanded = expandedState.get(id);
    }
    if (id && forceId && id === forceId) {
      current.expanded = true;
    }
    if (Array.isArray(current.children) && current.children.length > 0) {
      stack.unshift(...current.children);
    }
  }

  return cloned;
}

function isDirectRootChildNode(
  data: MapRow["mind_elixir"] | null,
  nodeId: string | null
) {
  if (!nodeId) return false;
  const root = getMindElixirRoot(data);
  const rootChildren = Array.isArray(root?.children) ? root.children : [];
  const normalizedNodeId = normalizeMindNodeId(nodeId);
  return rootChildren.some((child) => {
    const normalizedChildId = normalizeMindNodeId(String(child.id ?? ""));
    return normalizedChildId === normalizedNodeId;
  });
}

function getDescendantAnchorFallback(node: MindElixirNode | null) {
  if (!node || !Array.isArray(node.children)) return [];

  const stack = [...node.children];
  while (stack.length > 0) {
    const current = stack.shift();
    if (!current) continue;

    if (!current.meta?.[PROCESSING_PLACEHOLDER_META_KEY]) {
      const anchorText = Array.isArray(current.meta?.anchorText)
        ? current.meta.anchorText.filter(
            (text): text is string =>
              typeof text === "string" && text.trim().length > 0
          )
        : [];
      if (anchorText.length > 0) return anchorText;
    }

    if (Array.isArray(current.children) && current.children.length > 0) {
      stack.unshift(...current.children);
    }
  }

  return [];
}

function getStoredMapViewState(mapId: string): MapRow["mind_elixir"] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(getMapViewStateStorageKey(mapId));
    if (!raw) return null;
    return JSON.parse(raw) as MapRow["mind_elixir"];
  } catch {
    return null;
  }
}

function persistMapViewState(mapId: string, snapshot: MapRow["mind_elixir"]) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(
      getMapViewStateStorageKey(mapId),
      JSON.stringify(snapshot)
    );
  } catch {
    // View state persistence is best effort.
  }
}

function stringifyMindData(snapshot: MapRow["mind_elixir"] | null | undefined) {
  if (!snapshot) return null;
  try {
    return JSON.stringify(snapshot);
  } catch {
    return null;
  }
}

function coerceMapStatus(status?: string | null): MapJobStatus {
  if (
    status === "done" ||
    status === "failed" ||
    status === "queued" ||
    status === "idle" ||
    status === "retrying" ||
    status === "processing_structure" ||
    status === "processing_metadata"
  ) {
    return status;
  }
  return "processing_structure";
}

function isActiveMapStatus(status?: MapJobStatus | null) {
  return (
    status === "idle" ||
    status === "queued" ||
    status === "processing_structure" ||
    status === "processing_metadata"
  );
}

function getProcessingStructurePhase(
  step: string | null,
  hasMapData: boolean
): "outline" | "expanding" | "refining" {
  const normalized = String(step ?? "").trim().toLowerCase();
  if (normalized.includes("refining")) return "refining";
  if (normalized.includes("refined final structure")) return "refining";
  if (normalized.includes("expanded node")) return "expanding";
  if (normalized.includes("created initial structure outline")) {
    return hasMapData ? "expanding" : "outline";
  }
  return hasMapData ? "expanding" : "outline";
}

function withCacheBuster(url: string) {
  try {
    const u = new URL(url);
    u.searchParams.set("t", Date.now().toString());
    return u.toString();
  } catch {
    return url;
  }
}

function mergeDraftUserState(
  prev: MapDraft | null,
  next: MapDraft
): MapDraft {
  if (!prev) return next;
  return {
    ...next,
    version: typeof next.version === "number" ? next.version : prev.version,
    readStatus: prev.readStatus ?? next.readStatus,
    starred: typeof prev.starred === "boolean" ? prev.starred : next.starred,
    progressPercent:
      typeof prev.progressPercent === "number"
        ? prev.progressPercent
        : next.progressPercent,
    lastViewedAt: prev.lastViewedAt ?? next.lastViewedAt,
  };
}

function toFileSafeName(value: string) {
  return value.replace(/[\\/:*?"<>|]+/g, "-").trim();
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

type HighlightInterval = {
  start: number;
  end: number;
  kind: "key" | "active" | "expand";
};

const sourceReadingFont = IBM_Plex_Sans_KR({
  weight: ["400", "500", "600", "700"],
  display: "swap",
  preload: false,
});

const sourceTextBoxClassName =
  "max-h-[30rem] select-text overflow-y-auto bg-transparent px-1 pb-2 text-slate-800 dark:text-slate-100";

function buildHighlightIntervals(
  text: string,
  keys: string[],
  activeStart: number,
  activeEnd: number,
  expandStart = -1,
  expandEnd = -1
) {
  const intervals: HighlightInterval[] = [];
  const lower = text.toLowerCase();
  const normalizedKeys = Array.from(
    new Set(
      keys
        .map((key) => key.trim())
        .filter((key) => key.length >= 2)
        .sort((a, b) => b.length - a.length)
    )
  );

  for (const key of normalizedKeys) {
    const needle = key.toLowerCase();
    let from = 0;
    while (from < lower.length) {
      const idx = lower.indexOf(needle, from);
      if (idx === -1) break;
      intervals.push({ start: idx, end: idx + needle.length, kind: "key" });
      from = idx + Math.max(1, Math.floor(needle.length / 2));
    }
  }

  if (activeStart >= 0 && activeEnd > activeStart) {
    intervals.push({
      start: activeStart,
      end: activeEnd,
      kind: "active",
    });
  }

  if (expandStart >= 0 && expandEnd > expandStart) {
    intervals.push({
      start: expandStart,
      end: expandEnd,
      kind: "expand",
    });
  }

  return intervals;
}

function sanitizeAnchorTextCandidates(values: string[], maxCount: number) {
  const splitIntoClauses = (value: string) =>
    value
      .split(/[·•\n]+/g)
      .flatMap((chunk) => chunk.split(/[.!?]+/g))
      .map((chunk) => chunk.trim())
      .filter(Boolean);

  const clauses = values
    .map((value) => String(value ?? "").trim())
    .flatMap(splitIntoClauses)
    .map((value) => value.replace(/\s+/g, " ").trim())
    .filter((value) => value.length >= 8)
    .filter((value) => /[\p{L}\p{N}]/u.test(value))
    .sort((a, b) => b.length - a.length);

  return Array.from(new Set(clauses)).slice(0, maxCount);
}

function renderHighlightedText(
  text: string,
  intervals: HighlightInterval[],
  markRef: RefObject<HTMLElement | null>
) {
  if (!text) return null;
  if (!intervals.length) {
    return <span className="select-text whitespace-pre-wrap break-words">{text}</span>;
  }

  const points = new Set<number>([0, text.length]);
  for (const it of intervals) {
    points.add(Math.max(0, Math.min(text.length, it.start)));
    points.add(Math.max(0, Math.min(text.length, it.end)));
  }
  const sorted = Array.from(points).sort((a, b) => a - b);

  const nodes: ReactNode[] = [];
  let activeMarkBound = false;
  for (let i = 0; i < sorted.length - 1; i += 1) {
    const segStart = sorted[i];
    const segEnd = sorted[i + 1];
    if (segEnd <= segStart) continue;
    const segText = text.slice(segStart, segEnd);

    let hasKey = false;
    let hasActive = false;
    for (const it of intervals) {
      if (it.start < segEnd && it.end > segStart) {
        if (it.kind === "active") hasActive = true;
        else if (it.kind === "key") hasKey = true;
      }
    }

    if (hasActive) {
      nodes.push(
        <mark
          key={`a-${segStart}-${segEnd}`}
          ref={
            activeMarkBound
              ? undefined
              : (el) => {
                  markRef.current = el;
                }
          }
          className="select-text whitespace-pre-wrap break-words rounded-[3px] bg-yellow-300/90 px-0.5 text-neutral-950 box-decoration-clone ring-1 ring-yellow-400/40 dark:bg-yellow-300/35 dark:text-yellow-50 dark:ring-yellow-200/20"
        >
          {segText}
        </mark>
      );
      activeMarkBound = true;
    } else if (hasKey) {
      nodes.push(
        <mark
          key={`k-${segStart}-${segEnd}`}
          className="select-text whitespace-pre-wrap break-words rounded-[3px] bg-yellow-100 px-0.5 text-neutral-950 box-decoration-clone dark:bg-yellow-200/18 dark:text-yellow-50"
        >
          {segText}
        </mark>
      );
    } else {
      const hasExpand = intervals.some(
        (it) => it.kind === "expand" && it.start < segEnd && it.end > segStart
      );
      if (hasExpand) {
        nodes.push(
          <mark
            key={`e-${segStart}-${segEnd}`}
            className="select-text whitespace-pre-wrap break-words rounded-[3px] bg-sky-100/80 px-0.5 text-slate-900 box-decoration-clone dark:bg-sky-300/16 dark:text-sky-50"
          >
            {segText}
          </mark>
        );
        continue;
      }
      nodes.push(
        <span
          key={`t-${segStart}-${segEnd}`}
          className="select-text whitespace-pre-wrap break-words"
        >
          {segText}
        </span>
      );
    }
  }

  return nodes;
}

function renderReadableSourceText(
  text: string,
  intervals: HighlightInterval[],
  markRef: RefObject<HTMLElement | null>
) {
  if (!text) return null;

  const pieces = text.split(/((?:\r?\n)+)/g);
  let offset = 0;

  return pieces.map((piece, index) => {
    const start = offset;
    offset += piece.length;
    if (!piece) return null;

    if (/^(?:\r?\n)+$/.test(piece)) {
      return (
        <span
          key={`gap-${index}-${start}`}
          aria-hidden="true"
          className={piece.replace(/\r/g, "").length > 1 ? "block h-4" : "block h-2"}
        />
      );
    }

    const localIntervals = intervals
      .map((interval) => ({
        ...interval,
        start: Math.max(interval.start, start) - start,
        end: Math.min(interval.end, offset) - start,
      }))
      .filter((interval) => interval.end > interval.start);

    return (
      <p
        key={`p-${index}-${start}`}
        className="mb-3 select-text whitespace-pre-wrap break-words last:mb-0"
      >
        {renderHighlightedText(piece, localIntervals, markRef)}
      </p>
    );
  });
}

function getApiErrorMessage(
  payload: { message?: unknown; error?: unknown } | null | undefined,
  fallback: string
) {
  if (typeof payload?.message === "string" && payload.message.trim()) {
    return payload.message;
  }
  if (typeof payload?.error === "string" && payload.error.trim()) {
    return payload.error;
  }
  return fallback;
}

const FULLSCREEN_PAGE_TERMS_TAB_ID = "fullscreen-page-terms-tab";
const FULLSCREEN_PAGE_LEFT_PANEL_BUTTON_ID = "fullscreen-page-left-panel-button";
const LEFT_PANEL_FOCUS_INSET = 560;

function toDraft(row: MapRow): MapDraft {
  const version = (row as { version?: unknown }).version;
  return {
    id: row.id,
    version: typeof version === "number" && Number.isFinite(version) ? version : undefined,
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: row.updated_at ? new Date(row.updated_at).getTime() : undefined,
    sourceUrl: row.source_url ?? undefined,
    sourceType: row.source_type ?? undefined,
    title: row.title ?? "Untitled",
    youtubeTitle:
      (row as { youtube_title?: string | null }).youtube_title ?? undefined,
    shortTitle: row.short_title ?? undefined,
    channelName: row.channel_name ?? undefined,
    thumbnailUrl: row.thumbnail_url ? withCacheBuster(row.thumbnail_url) : undefined,
    tags: Array.isArray(row.tags) ? row.tags : [],
    description: row.description ?? undefined,
    summary: row.summary ?? undefined,
    sourceCharCount:
      typeof row.source_char_count === "number" ? row.source_char_count : undefined,
    status: coerceMapStatus(row.map_status),
    creditsCharged:
      typeof row.credits_charged === "number" ? row.credits_charged : undefined,
  };
}

async function fetchLatestMapGenerationStep(
  supabase: ReturnType<typeof createClient>,
  mapId: string
) {
  const { data, error } = await supabase
    .from("map_generation_jobs")
    .select("current_step,status,updated_at")
    .eq("final_map_id", mapId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return null;
  return typeof data?.current_step === "string" ? data.current_step : null;
}

type FullscreenMapDetailScreenProps = {
  mapId: string;
  locale: string;
  sourceTab?: string | null;
  accessMode?: "user" | "admin" | "shared";
  sharedToken?: string | null;
};

type AdminInspectMapResponse = {
  id: string;
  title: string;
  youtubeTitle?: string | null;
  shortTitle: string | null;
  description: string | null;
  summary: string | null;
  tags: string[];
  mapStatus: string;
  sourceType: string;
  sourceUrl: string | null;
  outputLanguage: string | null;
  creditsCharged: number;
  createdAt: string;
  updatedAt: string;
  thumbnailUrl: string | null;
  channelName: string | null;
  mindElixir: MapRow["mind_elixir"] | null;
  mindThemeOverride: string | null;
  notes?: Array<{
    id: string;
    text: string;
    createdAt: string;
    updatedAt: string;
  }>;
  terms?: Array<{
    term: string;
    meaning: string;
    updatedAt: string | null;
  }>;
};

type SharedMapResponse = {
  id: string;
  title: string;
  short_title: string | null;
  description: string | null;
  summary: string | null;
  tags: string[];
  channel_name: string | null;
  source_url: string | null;
  source_type: string | null;
  thumbnail_url: string | null;
  credits_charged: number | null;
  mind_elixir: MapRow["mind_elixir"] | null;
  mind_theme_override: string | null;
  map_status: string;
  created_at: string;
  updated_at: string;
  shared_by?: string | null;
  notes?: Array<{
    id: string;
    text: string;
    created_at: string;
    updated_at: string;
  }>;
  terms?: Array<{
    term: string;
    meaning: string;
    updated_at?: string | null;
  }>;
};

function toDraftFromAdminInspect(row: AdminInspectMapResponse): MapDraft {
  return {
    id: row.id,
    createdAt: new Date(row.createdAt).getTime(),
    updatedAt: row.updatedAt ? new Date(row.updatedAt).getTime() : undefined,
    sourceUrl: row.sourceUrl ?? undefined,
    sourceType:
      row.sourceType === "youtube" ||
      row.sourceType === "website" ||
      row.sourceType === "file" ||
      row.sourceType === "manual"
        ? row.sourceType
        : undefined,
    title: row.title ?? "Untitled",
    youtubeTitle: row.youtubeTitle ?? undefined,
    shortTitle: row.shortTitle ?? undefined,
    channelName: row.channelName ?? undefined,
    thumbnailUrl: row.thumbnailUrl ? withCacheBuster(row.thumbnailUrl) : undefined,
    tags: Array.isArray(row.tags) ? row.tags : [],
    description: row.description ?? undefined,
    summary: row.summary ?? undefined,
    status: coerceMapStatus(row.mapStatus),
    creditsCharged:
      typeof row.creditsCharged === "number" ? row.creditsCharged : undefined,
  };
}

export default function FullscreenMapDetailScreen({
  mapId,
  locale,
  sourceTab,
  accessMode = "user",
  sharedToken = null,
}: FullscreenMapDetailScreenProps) {
  const t = useTranslations("FullscreenMapPage");
  const tReadState = useTranslations("MapsCommon.listItem.readState");
  const tFullscreenDialog = useTranslations("FullscreenDialog");
  const tTutorial = useTranslations("MapTutorial");
  const isTutorialMobile = useTutorialIsMobile();
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const { profileThemeName } = useMindThemePreference();
  const supabase = createClient();
  const backToMapsUrl =
    accessMode === "admin"
      ? `/${locale}/admin/users/maps`
      : sourceTab === "notes" || sourceTab === "terms"
      ? `/${locale}/maps?tab=${sourceTab}`
      : `/${locale}/maps`;
  const isAdminView = accessMode === "admin";
  const isSharedView = accessMode === "shared";
  const isReadOnlyView = isAdminView || isSharedView;
  const loadingMindElixir = useMemo(() => getLoadingMindElixir(locale), [locale]);

  const [draft, setDraft] = useState<MapDraft | null>(null);
  const [mapData, setMapData] = useState<MapRow["mind_elixir"] | null>(null);
  const [panelMindData, setPanelMindData] = useState<MapRow["mind_elixir"] | null>(null);
  const [hasDraft, setHasDraft] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingNow, setProcessingNow] = useState(() => Date.now());
  const [processingStep, setProcessingStep] = useState<string | null>(null);

  useMapOpenEvent({
    mapId: isSharedView ? null : mapId,
    sharedToken: isSharedView ? sharedToken : null,
    accessMode: isSharedView ? "shared" : "owner",
    locale,
    enabled: !isAdminView && !loading && !error && Boolean(mapData),
  });

  const [leftOpen, setLeftOpen] = useState(false);
  const [leftTab, setLeftTab] = useState<"info" | "notes" | "terms">("info");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Array<{ id: string; text: string }>>([]);
  const [searchIndex, setSearchIndex] = useState(0);
  const searchIndexRef = useRef(0);
  const lastStepAtRef = useRef(0);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement | null>(null);
  const editMode: "view" | "edit" = isReadOnlyView ? "view" : "edit";
  const panMode = false;
  const [themeName, setThemeName] = useState<string>(LOADING_THEME_NAME);
  const themeInitRef = useRef(false);
  const themeOptions = useMemo(
    () => [{ name: PROFILE_THEME_NAME }, { name: DEFAULT_THEME_NAME }, ...MIND_THEMES],
    []
  );
  const mindRef = useRef<ClientMindElixirHandle | null>(null);
  const centeredOnceRef = useRef(false);
  const pendingRecenterRef = useRef(false);
  const initialCollapseAppliedForMapRef = useRef<string | null>(null);
  const [showMetadataDialog, setShowMetadataDialog] = useState(false);
  const [isSavingMeta, setIsSavingMeta] = useState(false);
  const [tagEditOpen, setTagEditOpen] = useState(false);
  const [tagEditSubmitting, setTagEditSubmitting] = useState(false);
  const [allTagNames, setAllTagNames] = useState<string[]>([]);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [savedPulse, setSavedPulse] = useState(false);
  const [selectedMapNodeId, setSelectedMapNodeId] = useState<string | null>(null);
  const [selectedRootChildNodeId, setSelectedRootChildNodeId] = useState<string | null>(null);
  const [regeneratingNodeId, setRegeneratingNodeId] = useState<string | null>(null);
  const [regeneratingMode, setRegeneratingMode] = useState<RegenerateMode | null>(null);
  const [regenerateReasonOpen, setRegenerateReasonOpen] = useState(false);
  const regeneratingNodeIdRef = useRef<string | null>(null);
  const autoSaveTimerRef = useRef<number | null>(null);
  const lastSavedDraftRef = useRef<string | null>(null);
  const isSavingDraftRef = useRef(false);
  const latestLocalMindPayloadRef = useRef<string | null>(null);
  const lastAutoSaveErrorRef = useRef<number>(0);
  const lastHighlightToastRef = useRef(0);
  const savedPulseTimerRef = useRef<number | null>(null);
  const [confirmDiscardOpen, setConfirmDiscardOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareEnabled, setShareEnabled] = useState(false);
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [sharedBy, setSharedBy] = useState<string | null>(null);
  const [sharedNotes, setSharedNotes] = useState<
    Array<{ id: string; text: string; createdAt: number; createdAtLabel: string }>
  >([]);
  const [sharedTerms, setSharedTerms] = useState<
    Array<{ term: string; meaning: string; updatedAt?: number; isNew?: boolean }>
  >([]);
  const [desktopMoreOpen, setDesktopMoreOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [slideshowOpen, setSlideshowOpen] = useState(false);
  const [slideshowSlides, setSlideshowSlides] = useState<SlideItem[]>([]);
  const [mobileMapActionsOpen, setMobileMapActionsOpen] = useState(false);
  const [mobileThemeOpen, setMobileThemeOpen] = useState(false);
  const [mobileStateOpen, setMobileStateOpen] = useState(false);
  const [mobileToolbarCollapsed, setMobileToolbarCollapsed] = useState(true);
  const [isLikelyInAppBrowser, setIsLikelyInAppBrowser] = useState(false);
  const [isEmbeddedFrame, setIsEmbeddedFrame] = useState(false);
  const shouldHideFramedSharedChrome = isSharedView && isEmbeddedFrame;
  const desktopMoreRef = useRef<HTMLDivElement | null>(null);
  const regenerateActionsRef = useRef<HTMLDivElement | null>(null);
  const mobileRegenerateActionsRef = useRef<HTMLDivElement | null>(null);
  const mobileMapActionsRef = useRef<HTMLDivElement | null>(null);
  const mobileThemeRef = useRef<HTMLDivElement | null>(null);
  const mobileStateRef = useRef<HTMLDivElement | null>(null);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [tutorialStepIndex, setTutorialStepIndex] = useState(0);
  const [sourceFindOpen, setSourceFindOpen] = useState(false);
  const [sourceFindExpanded, setSourceFindExpanded] = useState(true);
  const [sourceFindFontSize, setSourceFindFontSize] = useState(14);
  const [sourceFindLoading, setSourceFindLoading] = useState(false);
  const [sourceFindStatus, setSourceFindStatus] = useState<"idle" | SourceFindStatus>(
    "idle"
  );
  const [sourceFindMessage, setSourceFindMessage] = useState<string>("");
  const [sourceFindNodeTopic, setSourceFindNodeTopic] = useState<string>("");
  const [sourceFindCandidates, setSourceFindCandidates] = useState<
    SourceFindCandidate[]
  >([]);
  const [sourceFindActiveIndex, setSourceFindActiveIndex] = useState(0);
  const [sourceFindNodeSelected, setSourceFindNodeSelected] = useState(false);
  const [sourceFindFullText, setSourceFindFullText] = useState<string>("");
  const [sourceFindViewStart, setSourceFindViewStart] = useState(0);
  const [sourceFindViewEnd, setSourceFindViewEnd] = useState(0);
  const [sourceFindExpandFlash, setSourceFindExpandFlash] = useState<{
    start: number;
    end: number;
    key: number;
  } | null>(null);
  const [sourceFindLastAnchors, setSourceFindLastAnchors] = useState<{
    anchorText: string[];
    anchorKeywords: string[];
  } | null>(null);
  const [sourceFindManualAnchor, setSourceFindManualAnchor] = useState("");
  const sourceFindTrackedNodeIdRef = useRef<string | null>(null);
  const sourceFindInFlightRef = useRef(false);
  const mapStateTouchedRef = useRef<string | null>(null);
  const initializedMapIdRef = useRef<string | null>(null);
  const sourceFindHighlightRef = useRef<HTMLElement | null>(null);
  const SOURCE_VIEW_STEP = 700;
  const SOURCE_VIEW_FOCUS_CONTEXT = 260;
  const SOURCE_FIND_MIN_FONT_SIZE = 12;
  const SOURCE_FIND_MAX_FONT_SIZE = 22;
  const currentReadStatus: ReadStatus = draft?.readStatus ?? "unread";
  const currentStarred = Boolean(draft?.starred);
  const stateActionLabel = t.has("actions.state")
    ? t("actions.state")
    : t("actions.more");
  const readStateOptions = [
    { value: "unread" as const, label: tReadState("unread"), icon: "mdi:bookmark-outline" },
    { value: "in_progress" as const, label: tReadState("inProgress"), icon: "mdi:bookmark-clock-outline" },
    { value: "read" as const, label: tReadState("read"), icon: "mdi:bookmark-check-outline" },
  ];

  const MUTATING_OPS = useMemo(
    () =>
      new Set([
        "addChild",
        "insertParent",
        "insertSibling",
        "removeNodes",
        "moveUpNode",
        "moveDownNode",
        "moveNodeIn",
        "moveNodeBefore",
        "moveNodeAfter",
        "undo",
        "redo",
        "finishEdit",
        "finishEditSummary",
        "finishEditArrowLabel",
        "reshapeNode",
        "createArrow",
        "removeArrow",
        "createSummary",
        "removeSummary",
        "copyNode",
        "copyNodes",
        "toggleHighlight",
        "updateImage",
        "updateRichText",
      ]),
    []
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    setIsEmbeddedFrame(window.self !== window.top);
  }, []);

  useEffect(() => {
    isSavingDraftRef.current = isSavingDraft;
  }, [isSavingDraft]);

  useEffect(() => {
    latestLocalMindPayloadRef.current = null;
    lastSavedDraftRef.current = null;
  }, [mapId]);

  useEffect(() => {
    if (!mapId) return;

    let cancelled = false;
    const storedViewState = getStoredMapViewState(mapId);
    const hasStoredViewState = Boolean(storedViewState);
    if (storedViewState) {
      setMapData(storedViewState);
      setPanelMindData(storedViewState);
      initialCollapseAppliedForMapRef.current = mapId;
    }

    (async () => {
      try {
        setLoading(!hasStoredViewState);
        setError(null);
        if (isSharedView) {
          if (!sharedToken) {
            throw new Error("공유 토큰이 없습니다.");
          }
          const response = await fetch(`/api/share/${sharedToken}`, {
            cache: "no-store",
          });
          const json = await response.json().catch(() => ({}));
          if (!response.ok) {
            throw new Error(json?.error || "공유 구조맵을 불러오지 못했어요.");
          }

          const data = (json?.map ?? null) as SharedMapResponse | null;
          if (!data) {
            throw new Error("공유 구조맵을 불러오지 못했어요.");
          }
          if (cancelled) return;
          setSharedBy(typeof data.shared_by === "string" ? data.shared_by : null);

          setDraft(
            toDraft({
              ...(data as unknown as MapRow),
              id: data.id,
              created_at: data.created_at,
              updated_at: data.updated_at,
              title: data.title,
              short_title: data.short_title,
              channel_name: data.channel_name,
              source_url: data.source_url,
              source_type: data.source_type,
              tags: data.tags,
              description: data.description,
              summary: data.summary,
              thumbnail_url: data.thumbnail_url,
              map_status: data.map_status,
              credits_charged: data.credits_charged,
            } as MapRow)
          );
          setHasDraft(false);
          if (!data?.mind_elixir) {
            throw new Error("mind_elixir 데이터가 없습니다.");
          }
          const restoredMind = storedViewState ?? data.mind_elixir;
          setMapData(restoredMind);
          setPanelMindData(restoredMind);
          setSharedNotes(
            Array.isArray(data.notes)
              ? data.notes.map((item) => {
                  const createdAt = new Date(item.created_at).getTime();
                  return {
                    id: String(item.id),
                    text: String(item.text ?? ""),
                    createdAt,
                    createdAtLabel: new Date(createdAt).toLocaleString(),
                  };
                })
              : []
          );
          setSharedTerms(
            Array.isArray(data.terms)
              ? data.terms.map((item) => ({
                  term: String(item.term ?? ""),
                  meaning: String(item.meaning ?? ""),
                  updatedAt: item.updated_at
                    ? new Date(item.updated_at).getTime()
                    : undefined,
                  isNew: false,
                }))
              : []
          );
          setThemeName(SHARED_DEFAULT_THEME_NAME);
          themeInitRef.current = true;
        } else if (isAdminView) {
          const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
          if (!baseUrl) {
            throw new Error("NEXT_PUBLIC_API_BASE_URL이 설정되지 않았어요.");
          }

          const supabase = createClient();
          const {
            data: { session },
          } = await supabase.auth.getSession();

          const accessToken = session?.access_token;
          if (!accessToken) {
            throw new Error("관리자 세션을 찾지 못했어요. 다시 로그인해 주세요.");
          }

          const response = await fetch(`${baseUrl}/admin/maps/${mapId}/inspect`, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });

          if (!response.ok) {
            throw new Error("관리자용 구조맵 상세를 불러오지 못했어요.");
          }

          const data = (await response.json()) as AdminInspectMapResponse;
          if (cancelled) return;

          setDraft(toDraftFromAdminInspect(data));
          setHasDraft(false);
          if (!data?.mindElixir) {
            throw new Error("mind_elixir 데이터가 없습니다.");
          }
          const restoredMind = storedViewState ?? data.mindElixir;
          setMapData(restoredMind);
          setPanelMindData(restoredMind);
          setSharedNotes(
            Array.isArray(data.notes)
              ? data.notes.map((item) => {
                  const createdAt = new Date(item.createdAt).getTime();
                  return {
                    id: String(item.id),
                    text: String(item.text ?? ""),
                    createdAt,
                    createdAtLabel: new Date(createdAt).toLocaleString(),
                  };
                })
              : []
          );
          setSharedTerms(
            Array.isArray(data.terms)
              ? data.terms.map((item) => ({
                  term: String(item.term ?? ""),
                  meaning: String(item.meaning ?? ""),
                  updatedAt: item.updatedAt
                    ? new Date(item.updatedAt).getTime()
                    : undefined,
                  isNew: false,
                }))
              : []
          );
          if (data.mindThemeOverride) {
            setThemeName(data.mindThemeOverride);
          } else {
            setThemeName(SHARED_DEFAULT_THEME_NAME);
          }
          themeInitRef.current = true;
        } else {
          const supabase = createClient();
          const { data, error } = await supabase
            .from("maps")
            .select(
              "id,created_at,updated_at,title,youtube_title,short_title,channel_name,source_url,source_type,tags,description,summary,thumbnail_url,map_status,credits_charged,source_char_count,mind_elixir,mind_elixir_draft,mind_theme_override"
            )
            .eq("id", mapId)
            .single();

          if (cancelled) return;
          if (error) throw error;

          const row = data as MapRow;
          setDraft((prev) => mergeDraftUserState(prev, toDraft(row)));
          void fetchLatestMapGenerationStep(supabase, mapId).then((step) => {
            if (!cancelled) setProcessingStep(step);
          });

          const draftMind = row?.mind_elixir_draft ?? null;
          const mind = row?.mind_elixir ?? null;
          const effectiveMind = storedViewState ?? draftMind ?? mind ?? null;

          setHasDraft(Boolean(draftMind));
          if (!effectiveMind) {
            const nextDraft = toDraft(row);
            if (!isActiveMapStatus(nextDraft.status)) {
              throw new Error("mind_elixir 데이터가 없습니다.");
            }
            setMapData(null);
            setPanelMindData(null);
          } else {
            setMapData(effectiveMind);
            setPanelMindData(effectiveMind);
          }
          setSharedNotes([]);
          setSharedTerms([]);
          setSharedBy(null);

          const override = row?.mind_theme_override ?? null;
          if (override) {
            setThemeName(override);
          } else {
            setThemeName(profileThemeName ? PROFILE_THEME_NAME : DEFAULT_THEME_NAME);
          }
          themeInitRef.current = true;
        }
      } catch (e: unknown) {
        if (cancelled) return;
        setError(getErrorMessage(e, "구조맵을 불러오지 못했습니다."));
        setDraft(null);
        setMapData(null);
        setPanelMindData(null);
        setHasDraft(false);
        setSharedNotes([]);
        setSharedTerms([]);
        setSharedBy(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAdminView, isSharedView, mapId, profileThemeName, sharedToken]);

  useEffect(() => {
    if (loading || !draft) return;
    if (initializedMapIdRef.current === draft.id) return;
    initializedMapIdRef.current = draft.id;
    setLeftOpen(false);
    if (isEmbeddedFrame) {
      setTutorialOpen(false);
      setTutorialStepIndex(0);
      return;
    }
    const tutorialCompleted = getMapTutorialCompleted(
      isTutorialMobile ? "mobile" : "desktop"
    );
    setTutorialOpen(!tutorialCompleted);
    setTutorialStepIndex(0);
  }, [loading, draft?.id, isTutorialMobile, isSharedView, isEmbeddedFrame]);

  useEffect(() => {
    if (!mapId || !draft) return;

    const isActiveStatus = isActiveMapStatus(draft.status);

    if (!isActiveStatus) return;

    let cancelled = false;

    const refreshMap = async () => {
      try {
        if (isSharedView) {
          return;
        }
        if (isAdminView) {
          const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
          if (!baseUrl) return;

          const supabase = createClient();
          const {
            data: { session },
          } = await supabase.auth.getSession();

          const accessToken = session?.access_token;
          if (!accessToken) return;

          const response = await fetch(`${baseUrl}/admin/maps/${mapId}/inspect`, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
            cache: "no-store",
          });

          if (!response.ok || cancelled) return;
          const data = (await response.json()) as AdminInspectMapResponse;
          if (cancelled) return;
          setDraft(toDraftFromAdminInspect(data));
          if (data?.mindElixir) {
            setMapData((prev) => prev ?? data.mindElixir);
          }
          setSharedNotes(
            Array.isArray(data.notes)
              ? data.notes.map((item) => {
                  const createdAt = new Date(item.createdAt).getTime();
                  return {
                    id: String(item.id),
                    text: String(item.text ?? ""),
                    createdAt,
                    createdAtLabel: new Date(createdAt).toLocaleString(),
                  };
                })
              : []
          );
          setSharedTerms(
            Array.isArray(data.terms)
              ? data.terms.map((item) => ({
                  term: String(item.term ?? ""),
                  meaning: String(item.meaning ?? ""),
                  updatedAt: item.updatedAt
                    ? new Date(item.updatedAt).getTime()
                    : undefined,
                  isNew: false,
                }))
              : []
          );
          if (data?.mindThemeOverride) {
            setThemeName(data.mindThemeOverride);
          } else if (!themeInitRef.current) {
            setThemeName(SHARED_DEFAULT_THEME_NAME);
            themeInitRef.current = true;
          }
          return;
        }

        const supabase = createClient();
        const { data, error } = await supabase
          .from("maps")
          .select(
            "id,created_at,updated_at,title,youtube_title,short_title,channel_name,source_url,source_type,tags,description,summary,thumbnail_url,map_status,credits_charged,source_char_count,mind_elixir,mind_elixir_draft,mind_theme_override"
          )
          .eq("id", mapId)
          .single();

        if (error || cancelled || !data) return;

        const row = data as MapRow;
        setDraft((prev) => mergeDraftUserState(prev, toDraft(row)));
        void fetchLatestMapGenerationStep(supabase, mapId).then((step) => {
          if (!cancelled) setProcessingStep(step);
        });
        const effectiveMind = row?.mind_elixir_draft ?? row?.mind_elixir ?? null;
        setHasDraft(Boolean(row?.mind_elixir_draft));
        if (effectiveMind) {
          const serverPayload = stringifyMindData(effectiveMind);
          const localPayload = latestLocalMindPayloadRef.current;
          const hasLocalMindChange = Boolean(
            localPayload || autoSaveTimerRef.current || isSavingDraftRef.current
          );
          if (!hasLocalMindChange || serverPayload === localPayload) {
            setPanelMindData(effectiveMind);
            if (!localPayload) {
              setMapData(effectiveMind);
            }
          }
        }
      } catch {
        // ignore polling errors and keep the current screen stable
      }
    };

    void refreshMap();
    const timer = window.setInterval(() => {
      void refreshMap();
    }, 4000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [draft?.status, isAdminView, isSharedView, mapId, draft?.id]);

  useEffect(() => {
    if (!tagEditOpen) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/maps/tags?limit=200", {
          credentials: "include",
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || cancelled) return;
        const names = Array.isArray(json?.tags)
          ? json.tags
              .map((tag: { name?: string }) => tag?.name)
              .filter((name: unknown): name is string => Boolean(name))
          : [];
        setAllTagNames(names);
      } catch {
        if (!cancelled) setAllTagNames([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tagEditOpen]);

  useEffect(() => {
    if (isSharedView) {
      return;
    }
    if (!themeInitRef.current) {
      setThemeName(profileThemeName ? PROFILE_THEME_NAME : DEFAULT_THEME_NAME);
      themeInitRef.current = true;
      return;
    }
    if (!profileThemeName && themeName === PROFILE_THEME_NAME) {
      setThemeName(DEFAULT_THEME_NAME);
    }
  }, [isSharedView, profileThemeName, themeName]);

  const title = useMemo(
    () => draft?.title ?? t("fallbackTitle"),
    [draft?.title, t]
  );
  const tutorialSteps = useMemo(
    () =>
      getMapTutorialSteps(tTutorial, {
        platform: isTutorialMobile ? "mobile" : "desktop",
        termsTabId: FULLSCREEN_PAGE_TERMS_TAB_ID,
        leftPanelButtonId: FULLSCREEN_PAGE_LEFT_PANEL_BUTTON_ID,
      }),
    [tTutorial, isTutorialMobile]
  );
  const showTimestamps = false;

  const applyInitialCollapse = () => {
    if (!mapId || !mapData || loading) return;
    if (initialCollapseAppliedForMapRef.current === mapId) return;
    try {
      if (
        typeof window !== "undefined" &&
        window.sessionStorage.getItem(getMapViewStateStorageKey(mapId))
      ) {
        initialCollapseAppliedForMapRef.current = mapId;
        return;
      }
    } catch {
      // sessionStorage can be unavailable in restricted browser contexts.
    }
    const mind = mindRef.current;
    if (!mind) return;

    mind.collapseToLevel?.(3);
    initialCollapseAppliedForMapRef.current = mapId;
    requestAnimationFrame(() => {
      syncMindDataFromMind({ persistViewState: true });
    });
  };

  const openTab = (next: "info" | "notes" | "terms") => {
    setLeftTab(next);
    setLeftOpen(true);
  };

  const closeSearch = () => {
    setSearchOpen(false);
    setSearchQuery("");
    setSearchResults([]);
    setSearchIndex(0);
    mindRef.current?.clearSearchHighlights?.();
    mindRef.current?.setSearchActive?.(null);
  };

  const handleTutorialNext = () => {
    if (tutorialStepIndex >= tutorialSteps.length - 1) {
      setMapTutorialCompleted(true, isTutorialMobile ? "mobile" : "desktop");
      setTutorialOpen(false);
      return;
    }
    setTutorialStepIndex((prev) => prev + 1);
  };

  const stepSearch = (dir: 1 | -1) => {
    if (!searchResults.length) return;
    const now = Date.now();
    if (now - lastStepAtRef.current < 120) return;
    lastStepAtRef.current = now;
    const current = searchIndexRef.current;
    const next =
      (current + dir + searchResults.length) % searchResults.length;
    searchIndexRef.current = next;
    setSearchIndex(next);
    const id = searchResults[next]?.id;
    if (id) {
      mindRef.current?.setSearchActive?.(id);
      mindRef.current?.focusNodeById?.(id);
    }
  };

  const handleSelectNodeNote = (nodeId: string) => {
    setLeftTab("notes");
    setLeftOpen(true);
    mindRef.current?.setSearchActive?.(nodeId);
    mindRef.current?.focusNodeById?.(nodeId);
    window.setTimeout(() => {
      mindRef.current?.setSearchActive?.(null);
    }, 1800);
  };

  useEffect(() => {
    if (!searchOpen) return;
    if (typeof window !== "undefined" && window.innerWidth < 640) {
      mobileSearchInputRef.current?.focus();
      return;
    }
    searchInputRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    if (
      !desktopMoreOpen &&
      !mobileMapActionsOpen &&
      !mobileThemeOpen &&
      !mobileStateOpen &&
      !regenerateReasonOpen
    ) return;
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (desktopMoreOpen && desktopMoreRef.current?.contains(target)) {
        return;
      }
      if (regenerateReasonOpen && regenerateActionsRef.current?.contains(target)) {
        return;
      }
      if (
        regenerateReasonOpen &&
        mobileRegenerateActionsRef.current?.contains(target)
      ) {
        return;
      }
      if (mobileMapActionsOpen && mobileMapActionsRef.current?.contains(target)) {
        return;
      }
      if (mobileThemeOpen && mobileThemeRef.current?.contains(target)) {
        return;
      }
      if (mobileStateOpen && mobileStateRef.current?.contains(target)) {
        return;
      }
      setMobileMapActionsOpen(false);
      setMobileThemeOpen(false);
      setMobileStateOpen(false);
      setDesktopMoreOpen(false);
      setRegenerateReasonOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [
    desktopMoreOpen,
    mobileMapActionsOpen,
    mobileThemeOpen,
    mobileStateOpen,
    regenerateReasonOpen,
  ]);

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverscroll = html.style.overscrollBehavior;
    const prevHtmlOverscrollX = html.style.overscrollBehaviorX;
    const prevBodyOverscroll = body.style.overscrollBehavior;
    const prevBodyOverscrollX = body.style.overscrollBehaviorX;

    html.style.overscrollBehavior = "none";
    html.style.overscrollBehaviorX = "none";
    body.style.overscrollBehavior = "none";
    body.style.overscrollBehaviorX = "none";

    return () => {
      html.style.overscrollBehavior = prevHtmlOverscroll;
      html.style.overscrollBehaviorX = prevHtmlOverscrollX;
      body.style.overscrollBehavior = prevBodyOverscroll;
      body.style.overscrollBehaviorX = prevBodyOverscrollX;
    };
  }, []);

  useEffect(() => {
    const handleFind = (event: KeyboardEvent) => {
      const isCmdOrCtrl = event.metaKey || event.ctrlKey;
      if (!isCmdOrCtrl || event.key.toLowerCase() !== "f") return;
      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName?.toLowerCase();
      const isEditable =
        target?.isContentEditable ||
        tagName === "input" ||
        tagName === "textarea" ||
        tagName === "select";
      if (isEditable) return;
      event.preventDefault();
      setSearchOpen(true);
    };

    window.addEventListener("keydown", handleFind);
    return () => window.removeEventListener("keydown", handleFind);
  }, []);

  useEffect(() => {
    if (!searchOpen) return;
    const q = searchQuery.trim();
    if (!q) {
      setSearchResults([]);
      setSearchIndex(0);
      searchIndexRef.current = 0;
      mindRef.current?.clearSearchHighlights?.();
      mindRef.current?.setSearchActive?.(null);
      return;
    }
    const results =
      mindRef.current?.findNodesByQuery?.(q, { includeNotes: true }) ?? [];
    setSearchResults(results);
    setSearchIndex(0);
    searchIndexRef.current = 0;
    mindRef.current?.setSearchHighlights?.(results.map((r) => r.id), q);
    if (results.length > 0) {
      const firstId = results[0].id;
      mindRef.current?.setSearchActive?.(firstId);
    } else {
      mindRef.current?.setSearchActive?.(null);
    }
  }, [searchQuery, searchOpen]);

  useEffect(() => {
    if (!mapData || loading) return;
    const shouldCenter = pendingRecenterRef.current || !centeredOnceRef.current;
    if (!shouldCenter) return;
    centeredOnceRef.current = true;
    pendingRecenterRef.current = false;
    const raf = requestAnimationFrame(() => {
      mindRef.current?.centerMap?.();
    });
    const timeout = window.setTimeout(() => {
      mindRef.current?.centerMap?.();
    }, 120);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(timeout);
    };
  }, [mapData, loading]);

  const scheduleAutoSave = () => {
    if (!mapId) return;
    if (autoSaveTimerRef.current) {
      window.clearTimeout(autoSaveTimerRef.current);
    }
    autoSaveTimerRef.current = window.setTimeout(async () => {
      autoSaveTimerRef.current = null;
      const snapshot = stripProcessingPlaceholderNodes(
        mindRef.current?.getSnapshot?.() as MapRow["mind_elixir"] | null
      );
      if (!snapshot) return;
      const payload = JSON.stringify(snapshot);
      latestLocalMindPayloadRef.current = payload;
      if (payload === lastSavedDraftRef.current) return;

      isSavingDraftRef.current = true;
      setIsSavingDraft(true);
      try {
        const res = await fetch(`/api/maps/${mapId}/draft`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mind_elixir_draft: snapshot }),
        });
        if (!res.ok) {
          const json = (await res.json().catch(() => null)) as
            | { error?: string }
            | null;
          throw new Error(json?.error || `AUTO_SAVE_FAILED_${res.status}`);
        }
        lastSavedDraftRef.current = payload;
        const currentPayload = stringifyMindData(
          stripProcessingPlaceholderNodes(
            mindRef.current?.getSnapshot?.() as MapRow["mind_elixir"] | null
          )
        );
        if (currentPayload === payload && !autoSaveTimerRef.current) {
          latestLocalMindPayloadRef.current = payload;
        }
        setHasDraft(true);
        setSavedPulse(true);
        if (savedPulseTimerRef.current) {
          window.clearTimeout(savedPulseTimerRef.current);
        }
        savedPulseTimerRef.current = window.setTimeout(() => {
          setSavedPulse(false);
        }, 1200);
      } catch (error) {
        const now = Date.now();
        if (now - lastAutoSaveErrorRef.current > 10_000) {
          lastAutoSaveErrorRef.current = now;
          const message =
            error instanceof Error && error.message.trim()
              ? error.message
              : "자동 저장에 실패했습니다.";
          toast.message(message);
        }
      } finally {
        isSavingDraftRef.current = false;
        setIsSavingDraft(false);
      }
    }, 1200);
  };

  const syncMindDataFromMind = (options?: {
    persistViewState?: boolean;
    updateReactState?: boolean;
    markLocalChange?: boolean;
  }) => {
    const snapshot = stripProcessingPlaceholderNodes(
      mindRef.current?.getSnapshot?.() as MapRow["mind_elixir"] | null
    );
    if (!snapshot) return;
    if (options?.markLocalChange) {
      latestLocalMindPayloadRef.current = stringifyMindData(snapshot);
    }
    if (options?.updateReactState) {
      setMapData(snapshot);
      setPanelMindData(snapshot);
    }
    if (options?.persistViewState && mapId) {
      persistMapViewState(mapId, snapshot);
    }
  };

  const handleOpenSlideshow = () => {
    const subtree = mindRef.current?.getSelectedSubtree?.() as SlideshowNode | null;
    if (!subtree) {
      toast.message("슬라이드쇼를 시작할 노드를 선택해 주세요.");
      return;
    }
    const slides = buildDfsSlides(subtree);
    if (slides.length === 0) {
      toast.message("슬라이드로 볼 내용이 없어요.");
      return;
    }
    setSlideshowSlides(slides);
    setSlideshowOpen(true);
  };

  const handleRegenerateSelectedNode = async (
    mode: RegenerateMode = "restructure",
    explicitNodeId?: string
  ) => {
    setRegenerateReasonOpen(false);
    if (!mapId || isReadOnlyView) return;
    if (regeneratingNodeIdRef.current) {
      toast.message(
        locale === "ko"
          ? "이미 다시 구조화하고 있어요. 잠시만 기다려 주세요."
          : locale === "fr"
          ? "Restructuration déjà en cours. Patientez un instant."
          : "Regeneration is already in progress. Please wait."
      );
      return;
    }
    const selected = mindRef.current?.getSelectedSubtree?.() as MindElixirNode | null;
    const liveSelectedId = String(selected?.id ?? "").trim();
    const liveSelectedIsRootChild = isDirectRootChildNode(
      displayMapData ?? mapData,
      liveSelectedId
    );
    const nodeId = String(
      explicitNodeId ??
        (liveSelectedIsRootChild ? liveSelectedId : selectedRootChildNodeId ?? "")
    ).trim();
    const targetNode = findMindNodeById(mapData, nodeId) ??
      (normalizeMindNodeId(String(selected?.id ?? "")) === normalizeMindNodeId(nodeId)
        ? selected
        : null);
    const isDeepViewInitialStructureNode = Boolean(
      mode === "expand" &&
        isDirectRootChildNode(mapData, nodeId) &&
        !hasChildNodes(targetNode)
    );

    if (!nodeId) {
      toast.message(
        locale === "ko"
          ? "다시 구조화할 노드를 선택해 주세요."
          : locale === "fr"
          ? "Sélectionnez un nœud à restructurer."
          : "Select a node to restructure."
      );
      return;
    }

    if (draft?.status !== "done") {
      toast.message(
        locale === "ko"
          ? "구조맵 생성이 완료된 뒤 다시 시도해 주세요."
          : locale === "fr"
          ? "Réessayez lorsque la carte est terminée."
          : "Try again after the map is complete."
      );
      return;
    }

    if (mode === "expand" && !hasSourceRangeHint(targetNode)) {
      toast.message(
        locale === "ko"
          ? "이 노드는 원문 범위 정보가 없어 상세 보강을 할 수 없어요."
          : locale === "fr"
          ? "Ce nœud n’a pas assez d’informations de source pour enrichir les détails."
          : "This node does not have enough source range information to expand details."
      );
      return;
    }

    if (hasDraft && !isDeepViewInitialStructureNode) {
      toast.message(
        locale === "ko"
          ? "먼저 현재 편집본을 반영하거나 폐기한 뒤 다시 시도해 주세요."
          : locale === "fr"
          ? "Publiez ou annulez d’abord le brouillon actuel, puis réessayez."
          : "Publish or discard the current draft first, then try again."
      );
      return;
    }

    const hasUnsavedLocalChange = Boolean(
      autoSaveTimerRef.current ||
        isSavingDraftRef.current ||
        (latestLocalMindPayloadRef.current &&
          latestLocalMindPayloadRef.current !== lastSavedDraftRef.current)
    );
    if (
      !isDeepViewInitialStructureNode &&
      (hasUnsavedLocalChange || isSavingMeta || tagEditSubmitting)
    ) {
      toast.message(
        locale === "ko"
          ? "저장이 끝난 뒤 다시 시도해 주세요."
          : locale === "fr"
          ? "Réessayez lorsque l’enregistrement est terminé."
          : "Try again after saving finishes."
      );
      return;
    }

    const viewSnapshot = stripProcessingPlaceholderNodes(
      mindRef.current?.getSnapshot?.() as MapRow["mind_elixir"] | null
    );
    const expandedState = collectExpandedState(viewSnapshot ?? mapData);

    try {
      if (isDeepViewInitialStructureNode && autoSaveTimerRef.current) {
        window.clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
      }
      if (isDeepViewInitialStructureNode && viewSnapshot) {
        setMapData(viewSnapshot);
        setPanelMindData(viewSnapshot);
        persistMapViewState(mapId, viewSnapshot);
      }
      regeneratingNodeIdRef.current = nodeId;
      setRegeneratingNodeId(nodeId);
      setRegeneratingMode(mode);
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) throw sessionError;
      const accessToken = session?.access_token;
      if (!accessToken) {
        throw new Error(
          locale === "ko"
            ? "로그인이 필요합니다."
            : locale === "fr"
            ? "Connexion requise."
            : "Login required."
        );
      }

      const base = process.env.NEXT_PUBLIC_API_BASE_URL;
      if (!base) {
        throw new Error("NEXT_PUBLIC_API_BASE_URL is not configured.");
      }

      const response = await fetch(
        `${base}/maps/${encodeURIComponent(mapId)}/nodes/${encodeURIComponent(
          nodeId
        )}/regenerate`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ mode }),
        }
      );
      const json = (await response.json().catch(() => null)) as
        | {
            message?: unknown;
            error?: unknown;
            mindElixir?: MapRow["mind_elixir"];
            version?: unknown;
            updatedAt?: unknown;
          }
        | null;

      if (!response.ok) {
        if (response.status === 409) {
          throw new Error(
            locale === "ko"
              ? "구조맵이 이미 변경되었어요. 새로고침 후 다시 시도해 주세요."
              : locale === "fr"
              ? "La carte a changé. Actualisez puis réessayez."
              : "This map has changed. Refresh and try again."
          );
        }
        throw new Error(
          getApiErrorMessage(
            json,
            locale === "ko"
              ? "노드 다시 구조화에 실패했습니다."
              : locale === "fr"
              ? "La restructuration du nœud a échoué."
              : "Failed to regenerate this node."
          )
        );
      }

      const nextMindElixir = json?.mindElixir ?? null;
      if (!nextMindElixir) {
        throw new Error(
          locale === "ko"
            ? "재구조화 결과를 받지 못했습니다."
            : locale === "fr"
            ? "Résultat de restructuration manquant."
            : "Missing regenerated map data."
        );
      }

      const nextViewMindElixir = withExpandedState(
        nextMindElixir,
        expandedState,
        mode === "expand" ? nodeId : null
      );
      const payload = stringifyMindData(nextViewMindElixir);
      const responseVersion = json?.version;
      const responseUpdatedAt = json?.updatedAt;
      setMapData(nextViewMindElixir);
      setPanelMindData(nextViewMindElixir);
      if (payload) {
        lastSavedDraftRef.current = payload;
        latestLocalMindPayloadRef.current = payload;
      }
      persistMapViewState(mapId, nextViewMindElixir);
      setDraft((prev) =>
        prev
          ? {
              ...prev,
              version:
                typeof responseVersion === "number" &&
                Number.isFinite(responseVersion)
                  ? responseVersion
                  : prev.version,
              updatedAt:
                typeof responseUpdatedAt === "string"
                  ? new Date(responseUpdatedAt).getTime()
                  : prev.updatedAt,
            }
          : prev
      );
      toast.success(
        locale === "ko"
          ? mode === "expand"
            ? "선택한 노드의 세부 내용을 보강했어요."
            : mode === "translate"
            ? "선택한 노드의 언어를 정리했어요."
            : "선택한 노드의 구조를 다듬었어요."
          : locale === "fr"
          ? mode === "expand"
            ? "Les détails du nœud sélectionné ont été enrichis."
            : mode === "translate"
            ? "La langue du nœud sélectionné a été harmonisée."
            : "La structure du nœud sélectionné a été affinée."
          : mode === "expand"
          ? "Selected node details expanded."
          : mode === "translate"
          ? "Selected node language cleaned up."
          : "Selected node structure refined."
      );
    } catch (error) {
      toast.error(
        getErrorMessage(
          error,
          locale === "ko"
            ? mode === "expand"
              ? "상세 보강에 실패했습니다."
              : mode === "translate"
              ? "언어 정리에 실패했습니다."
              : "구조 다듬기에 실패했습니다."
            : locale === "fr"
            ? mode === "expand"
              ? "L’enrichissement des détails a échoué."
              : mode === "translate"
              ? "L’harmonisation de la langue a échoué."
              : "L’affinage de la structure a échoué."
            : mode === "expand"
            ? "Failed to expand details."
            : mode === "translate"
            ? "Failed to clean up language."
            : "Failed to refine structure."
        )
      );
    } finally {
      regeneratingNodeIdRef.current = null;
      setRegeneratingNodeId(null);
      setRegeneratingMode(null);
    }
  };

  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        window.clearTimeout(autoSaveTimerRef.current);
      }
      if (savedPulseTimerRef.current) {
        window.clearTimeout(savedPulseTimerRef.current);
      }
    };
  }, []);

  const handleDelete = async () => {
    if (!mapId) return;
    setIsDeleting(true);

    try {
      const supabase = createClient();
      const { data: sessionData, error: sessionErr } =
        await supabase.auth.getSession();

      if (sessionErr) {
        throw new Error("세션을 가져오지 못했습니다: " + sessionErr.message);
      }

      const accessToken = sessionData.session?.access_token;
      if (!accessToken) {
        throw new Error("로그인이 필요합니다.");
      }

      const base = process.env.NEXT_PUBLIC_API_BASE_URL;
      if (!base) {
        throw new Error("환경변수 NEXT_PUBLIC_API_BASE_URL이 없습니다.");
      }

      const res = await fetch(`${base}/maps/${mapId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const json: { message?: unknown; error?: unknown } = await res
        .json()
        .catch(() => ({}));
      if (!res.ok) {
        const msg =
          typeof json?.message === "string"
            ? json.message
            : typeof json?.error === "string"
            ? json.error
            : "요청 실패";
        throw new Error(msg);
      }

      toast.success("삭제 완료");
      window.setTimeout(() => {
        router.push(backToMapsUrl);
      }, 700);
    } catch (e: unknown) {
      const msg = getErrorMessage(e, "삭제에 실패했습니다.");
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveMetadata = async (meta: {
    sourceType: "youtube" | "manual";
    sourceUrl?: string;
    title: string;
    youtubeTitle?: string;
    channelName?: string;
    thumbnailUrl?: string;
    tags: string[];
    description?: string;
  }) => {
    if (!mapId) return;
    setIsSavingMeta(true);

    try {
      const supabase = createClient();
      const { data: sessionData, error: sessionErr } =
        await supabase.auth.getSession();

      if (sessionErr) {
        throw new Error("세션을 가져오지 못했습니다: " + sessionErr.message);
      }

      const accessToken = sessionData.session?.access_token;
      if (!accessToken) {
        throw new Error("로그인이 필요합니다.");
      }

      const base = process.env.NEXT_PUBLIC_API_BASE_URL;
      if (!base) {
        throw new Error("환경변수 NEXT_PUBLIC_API_BASE_URL이 없습니다.");
      }

      const res = await fetch(`${base}/maps/${mapId}/metadata`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          title: meta.title,
          youtube_title: meta.youtubeTitle,
          description: meta.description,
          tags: meta.tags ?? [],
          thumbnail_url: meta.thumbnailUrl,
          channel_name: meta.channelName,
          source_type: meta.sourceType,
          source_url: meta.sourceUrl,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = json?.message || json?.error || "요청 실패";
        throw new Error(typeof msg === "string" ? msg : msg?.[0] || "요청 실패");
      }

      const { data, error } = await supabase
        .from("maps")
        .select(
          "id,created_at,updated_at,title,youtube_title,short_title,channel_name,source_url,source_type,tags,description,thumbnail_url,map_status,credits_charged"
        )
        .eq("id", mapId)
        .single();

      if (error) throw error;
      if (data) {
        setDraft((prev) => mergeDraftUserState(prev, toDraft(data as MapRow)));
      }

      setShowMetadataDialog(false);
    } catch (e: unknown) {
      const msg = getErrorMessage(e, "메타데이터 저장에 실패했습니다.");
      console.error(msg);
      window.alert(msg);
    } finally {
      setIsSavingMeta(false);
    }
  };

  const handleTagEditSave = async (tags: string[]) => {
    if (!draft?.id || tagEditSubmitting) return;
    const normalized = tags.map((tag) => tag.trim()).filter(Boolean);
    const unique = Array.from(new Set(normalized));
    try {
      setTagEditSubmitting(true);
      const res = await fetch("/api/maps/tags/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ mapId: draft.id, tags: unique }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.error || "요청 실패");
      }
      const nextTags: string[] = Array.isArray(json?.tags) ? json.tags : unique;
      setDraft((prev) => (prev ? { ...prev, tags: nextTags } : prev));
      setTagEditOpen(false);
      toast.success("태그를 업데이트했어요.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "태그 업데이트에 실패했습니다.";
      toast.error(message);
    } finally {
      setTagEditSubmitting(false);
    }
  };

  const setSourceViewAroundCandidate = (
    text: string,
    candidate: SourceFindCandidate,
    contextChars = SOURCE_VIEW_FOCUS_CONTEXT
  ) => {
    const start = Math.max(0, candidate.start - contextChars);
    const end = Math.min(text.length, candidate.end + contextChars);
    setSourceFindViewStart(start);
    setSourceFindViewEnd(end);
  };

  const requestSourceFind = async (anchors: {
    anchorText: string[];
    anchorKeywords: string[];
  }) => {
    const payload: { anchorText?: string[]; anchorKeywords?: string[] } = {};
    if (Array.isArray(anchors.anchorText) && anchors.anchorText.length > 0) {
      payload.anchorText = anchors.anchorText;
    }
    if (Array.isArray(anchors.anchorKeywords) && anchors.anchorKeywords.length > 0) {
      payload.anchorKeywords = anchors.anchorKeywords;
    }

    if (isSharedView) {
      if (!sharedToken) {
        throw new Error(t("toasts.sourceFindFailed"));
      }
      const res = await fetch(`/api/share/${encodeURIComponent(sharedToken)}/source-find`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const json: SourceFindResponse = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(getApiErrorMessage(json, t("toasts.sourceFindFailed")));
      }
      return json;
    }

    if (!mapId) {
      throw new Error(t("toasts.sourceFindFailed"));
    }

    const { data: sessionData, error: sessionErr } =
      await supabase.auth.getSession();
    if (sessionErr) {
      throw new Error(sessionErr.message || t("toasts.sourceFindFailed"));
    }
    const accessToken = sessionData.session?.access_token;
    if (!accessToken) {
      throw new Error(t("toasts.loginRequired"));
    }

    const base = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!base) {
      throw new Error("NEXT_PUBLIC_API_BASE_URL is not set.");
    }

    const sourceFindUrl = isAdminView
      ? `${base}/admin/maps/${mapId}/source-find`
      : `${base}/maps/${mapId}/source-find`;
    const res = await fetch(sourceFindUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });
    const json: SourceFindResponse = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(getApiErrorMessage(json, t("toasts.sourceFindFailed")));
    }
    return json;
  };

  const applySourceFindResponse = (json: SourceFindResponse) => {
    const candidates = Array.isArray(json?.candidates)
      ? (json.candidates as SourceFindCandidate[])
      : [];
    const sourceText = typeof json?.sourceText === "string" ? json.sourceText : "";
    const status = getDisplaySourceFindStatus(sourceText);

    setSourceFindStatus(status);
    setSourceFindCandidates(candidates);
    setSourceFindFullText(sourceText);
    if (sourceText) {
      if (candidates.length > 0) {
        setSourceFindActiveIndex(0);
        setSourceViewAroundCandidate(sourceText, candidates[0]);
      } else {
        setSourceFindViewStart(0);
        setSourceFindViewEnd(sourceText.length);
      }
    } else {
      setSourceFindViewStart(0);
      setSourceFindViewEnd(0);
    }
    setSourceFindMessage("");
  };

  const runSourceFindForNode = async (
    selected: {
      nodeId: string;
      topic: string;
      anchorText: string[];
      anchorKeywords: string[];
    },
    options?: { suppressNoAnchorToast?: boolean; keepPanelOpen?: boolean }
  ) => {
    if (!mapId && !sharedToken) return;
    const ownAnchorText = sanitizeAnchorTextCandidates(selected.anchorText, 2);
    const fallbackAnchorText =
      ownAnchorText.length > 0
        ? []
        : sanitizeAnchorTextCandidates(
            getDescendantAnchorFallback(findMindNodeById(displayMapData ?? mapData, selected.nodeId)),
            2
          );
    const anchorText = ownAnchorText.length > 0 ? ownAnchorText : fallbackAnchorText;
    const anchorKeywords: string[] = [];
    if (anchorText.length === 0) {
      if (!options?.suppressNoAnchorToast) {
        toast.message(t("toasts.noAnchorInSelectedNode"));
      }
      return;
    }
    if (!options?.keepPanelOpen) {
      setSourceFindOpen(true);
    }
    setSourceFindLoading(true);
    setSourceFindStatus("idle");
    setSourceFindMessage("");
    setSourceFindNodeTopic(selected.topic);
    setSourceFindCandidates([]);
    setSourceFindActiveIndex(0);
    setSourceFindLastAnchors({ anchorText, anchorKeywords });
    setSourceFindManualAnchor(anchorText[0] ?? "");
    sourceFindTrackedNodeIdRef.current = selected.nodeId;
    sourceFindInFlightRef.current = true;

    try {
      const json = await requestSourceFind({ anchorText, anchorKeywords });
      applySourceFindResponse(json);
    } catch (error) {
      const message = getErrorMessage(error, t("toasts.sourceFindFailed"));
      setSourceFindStatus("not_found");
      setSourceFindMessage(message);
      toast.error(message);
    } finally {
      setSourceFindLoading(false);
      sourceFindInFlightRef.current = false;
    }
  };

  const handleFindSourceFromSelectedNode = async () => {
    if (!mapId && !sharedToken) return;
    const selected = mindRef.current?.getSelectedNodeSourceAnchors?.();
    if (!selected) {
      toast.message(t("toasts.selectNodeForSourceFind"));
      return;
    }
    await runSourceFindForNode(selected);
  };

  const rerunSourceFindFromAnchors = async (anchors: {
    anchorText: string[];
    anchorKeywords: string[];
  }) => {
    if (!mapId && !sharedToken) return;
    const json = await requestSourceFind(anchors);
    applySourceFindResponse(json);
  };

  const handleMoveSourceCandidate = (dir: -1 | 1) => {
    if (!sourceFindCandidates.length || !sourceFindFullText) return;
    const len = sourceFindCandidates.length;
    const next =
      dir === 1
        ? (sourceFindActiveIndex + 1) % len
        : (sourceFindActiveIndex - 1 + len) % len;
    setSourceFindActiveIndex(next);
    setSourceViewAroundCandidate(sourceFindFullText, sourceFindCandidates[next]);
  };

  const handleRetrySourceFindWithManualAnchor = async () => {
    const manual = sourceFindManualAnchor.trim();
    if (!manual) {
      toast.message(t("sourceFind.reloadInputRequired"));
      return;
    }
    setSourceFindLoading(true);
    setSourceFindStatus("idle");
    setSourceFindMessage("");
    setSourceFindLastAnchors({ anchorText: [manual], anchorKeywords: [] });
    try {
      await rerunSourceFindFromAnchors({ anchorText: [manual], anchorKeywords: [] });
    } catch (error) {
      const message = getErrorMessage(error, t("toasts.sourceFindFailed"));
      setSourceFindStatus("not_found");
      setSourceFindMessage(message);
      toast.error(message);
    } finally {
      setSourceFindLoading(false);
    }
  };

  useEffect(() => {
    if (!sourceFindOpen) return;
    if (sourceFindStatus !== "found") return;
    const el = sourceFindHighlightRef.current;
    if (!el) return;
    el.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [sourceFindOpen, sourceFindStatus, sourceFindActiveIndex]);

  useEffect(() => {
    if (!sourceFindExpandFlash) return;
    const timer = window.setTimeout(() => {
      setSourceFindExpandFlash((prev) =>
        prev && prev.key === sourceFindExpandFlash.key ? null : prev
      );
    }, 3000);
    return () => window.clearTimeout(timer);
  }, [sourceFindExpandFlash]);

  useEffect(() => {
    if (!sourceFindOpen || (!mapId && !sharedToken)) return;
    const interval = window.setInterval(() => {
      if (sourceFindInFlightRef.current) return;
      const selected = mindRef.current?.getSelectedNodeSourceAnchors?.();
      if (!selected) return;
      if (selected.nodeId === sourceFindTrackedNodeIdRef.current) return;
      void runSourceFindForNode(selected, {
        suppressNoAnchorToast: true,
        keepPanelOpen: true,
      });
    }, 350);
    return () => window.clearInterval(interval);
  }, [sourceFindOpen, mapId, sharedToken]);

  useEffect(() => {
    if (!mapId || isReadOnlyView || !draft) return;
    if (mapStateTouchedRef.current === mapId) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/maps/${encodeURIComponent(mapId)}/state`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            readStatus: "in_progress",
            touchViewedAt: true,
          }),
        });
        if (!cancelled && res.ok) {
          mapStateTouchedRef.current = mapId;
        }
      } catch {
        // ignore
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [mapId, isReadOnlyView, draft]);

  const handleUpdateMapState = async (updates: {
    readStatus?: ReadStatus;
    starred?: boolean;
    touchViewedAt?: boolean;
  }) => {
    if (!mapId || isReadOnlyView) return;
    try {
      const res = await fetch(`/api/maps/${encodeURIComponent(mapId)}/state`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...updates,
          touchViewedAt: updates.touchViewedAt ?? true,
        }),
      });
      if (!res.ok) {
        toast.error(t("toasts.stateUpdateFailed"));
        return;
      }
      const json = await res.json().catch(() => ({}));
      const state = json?.state;
      if (!state) return;
      setDraft((prev) =>
        prev
          ? {
              ...prev,
              readStatus: state.readStatus ?? prev.readStatus,
              starred: typeof state.starred === "boolean" ? state.starred : prev.starred,
              progressPercent:
                typeof state.progressPercent === "number"
                  ? state.progressPercent
                  : prev.progressPercent,
              lastViewedAt: state.lastViewedAt
                ? new Date(state.lastViewedAt).getTime()
                : prev.lastViewedAt,
            }
          : prev
      );
      toast.success(t("toasts.stateUpdated"));
    } catch {
      toast.error(t("toasts.stateUpdateFailed"));
    }
  };

  const handlePublish = () => {
    (async () => {
      if (!mapId) return;
      try {
        const res = await fetch(`/api/maps/${mapId}/publish`, {
          method: "POST",
        });
        if (!res.ok) throw new Error(t("publishToast.failed"));
        setHasDraft(false);
        lastSavedDraftRef.current = null;
        latestLocalMindPayloadRef.current = null;
        // 발행된 원본을 다시 동기화
        try {
          const supabase = createClient();
          const { data, error } = await supabase
            .from("maps")
            .select("mind_elixir")
            .eq("id", mapId)
            .single();
          if (!error && data?.mind_elixir) {
            setMapData(data.mind_elixir);
            setPanelMindData(data.mind_elixir);
            requestAnimationFrame(() => {
              mindRef.current?.centerMap?.();
            });
            window.setTimeout(() => {
              mindRef.current?.centerMap?.();
            }, 120);
          }
        } catch {
          // ignore
        }
        toast.message(t("publishToast.success"));
      } catch {
        toast.message(t("publishToast.failed"));
      }
    })();
  };

  const handleDiscardDraft = () => {
    (async () => {
      if (!mapId) return;
      try {
        const res = await fetch(`/api/maps/${mapId}/draft`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error(t("discardToast.failed"));
        setHasDraft(false);
        lastSavedDraftRef.current = null;
        latestLocalMindPayloadRef.current = null;
        // 원본 맵으로 즉시 되돌리기
        try {
          const supabase = createClient();
          const { data, error } = await supabase
            .from("maps")
            .select("mind_elixir")
            .eq("id", mapId)
            .single();
          if (!error && data?.mind_elixir) {
            pendingRecenterRef.current = true;
            setMapData(data.mind_elixir);
            setPanelMindData(data.mind_elixir);
          }
        } catch {
          // ignore
        }
        toast.message(t("discardToast.success"));
      } catch {
        toast.message(t("discardToast.failed"));
      }
    })();
  };

  const handleSelectTheme = async (name: string) => {
    setThemeName(name);
    if (isSharedView) return;
    if (!mapId) return;

    const override =
      name === PROFILE_THEME_NAME
        ? null
        : name === DEFAULT_THEME_NAME
        ? DEFAULT_THEME_NAME
        : name;

    await fetch(`/api/maps/${mapId}/theme`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mind_theme_override: override }),
    }).catch(() => {});
  };

  const handleExportPng = async () => {
    const blob = await mindRef.current?.exportPng?.();
    if (!blob) {
      toast.message(t("export.failed"));
      return;
    }
    const safeTitle = toFileSafeName(title || "map") || "map";
    const date = new Date();
    const stamp = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0"),
    ].join("");
    const fileName = `${safeTitle}-${stamp}.png`;
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handlePrintMap = async () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.message(t("moreMenu.print"));
      return;
    }

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>${title}</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <style>
            html, body {
              margin: 0;
              padding: 0;
              background: #ffffff;
            }
            body {
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              padding: 24px;
              box-sizing: border-box;
            }
            .loading {
              font: 14px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
              color: #475569;
            }
            img {
              max-width: 100%;
              max-height: calc(100vh - 48px);
              object-fit: contain;
              display: block;
              margin: 0 auto;
            }
            @media print {
              body {
                padding: 0;
                min-height: auto;
              }
              img {
                width: 100%;
                max-height: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="loading">${t("moreMenu.print")}</div>
        </body>
      </html>
    `);
    printWindow.document.close();

    try {
      const blob = await mindRef.current?.exportPng?.();
      if (!blob) {
        printWindow.close();
        toast.message(t("export.failed"));
        return;
      }

      const url = URL.createObjectURL(blob);
      printWindow.document.body.innerHTML = "";
      const img = printWindow.document.createElement("img");
      img.src = url;
      img.alt = title;
      img.onload = () => {
        printWindow.focus();
        printWindow.print();
        window.setTimeout(() => URL.revokeObjectURL(url), 1500);
      };
      printWindow.document.body.appendChild(img);
    } catch {
      printWindow.close();
      toast.message(t("export.failed"));
    }
  };

  const fetchShareStatus = async () => {
    if (!mapId) return;
    try {
      setShareLoading(true);
      const res = await fetch(`/api/maps/${mapId}/share`);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.error || t("share.statusLoadFailed"));
      }
      setShareEnabled(Boolean(json?.share_enabled));
      setShareToken(json?.share_token ?? null);
    } catch (e: unknown) {
      toast.message(getErrorMessage(e, t("share.statusLoadFailed")));
    } finally {
      setShareLoading(false);
    }
  };

  const handleEnableShare = async () => {
    if (!mapId) return;
    try {
      setShareLoading(true);
      const res = await fetch(`/api/maps/${mapId}/share`, { method: "POST" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.error || t("share.enableFailed"));
      }
      setShareEnabled(Boolean(json?.share_enabled));
      setShareToken(json?.share_token ?? null);
      toast.message(t("share.enabled"));
    } catch (e: unknown) {
      toast.message(getErrorMessage(e, t("share.enableFailed")));
    } finally {
      setShareLoading(false);
    }
  };

  const handleDisableShare = async () => {
    if (!mapId) return;
    try {
      setShareLoading(true);
      const res = await fetch(`/api/maps/${mapId}/share`, { method: "DELETE" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.error || t("share.disableFailed"));
      }
      setShareEnabled(false);
      setShareToken(null);
      toast.message(t("share.disabled"));
    } catch (e: unknown) {
      toast.message(getErrorMessage(e, t("share.disableFailed")));
    } finally {
      setShareLoading(false);
    }
  };

  const handleCopyShare = async () => {
    const url = shareUrl;
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      toast.message(t("share.copied"));
    } catch {
      toast.message(t("share.copyFailed"));
    }
  };

  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") return null;
    if (isSharedView) {
      return window.location.href;
    }
    if (!shareToken) return null;
    const origin = window.location.origin;
    return `${origin}/${locale}/share/${encodeURIComponent(shareToken)}`;
  }, [isSharedView, shareToken, locale]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ua = window.navigator.userAgent || window.navigator.vendor || "";
    const isInApp =
      /(KAKAOTALK|FBAN|FBAV|Instagram|Line|NAVER|DaumApps|WebView|wv)/i.test(ua) ||
      (/Android/i.test(ua) && /Version\/[\d.]+/i.test(ua) && !/Chrome/i.test(ua));
    setIsLikelyInAppBrowser(isInApp);
  }, []);

  const statusLabel = isSavingDraft
    ? t("draftStatus.autoSaving")
    : savedPulse
    ? t("draftStatus.saved")
    : hasDraft
    ? t("draftStatus.hasDraft")
    : undefined;
  const mobileCenterLabel = tFullscreenDialog("actions.centerMap");
  const mobileZoomInLabel = tFullscreenDialog("actions.zoomIn");
  const mobileZoomOutLabel = tFullscreenDialog("actions.zoomOut");
  const mobileCollapseLevelLabel = t("mobile.collapseOneLevel");
  const mobileExpandLevelLabel = t("mobile.expandOneLevel");
  const mobileToolbarOpenLabel = t("mobile.openTools");
  const mobileToolbarCloseLabel = t("mobile.closeTools");
  const mobileMapActionsLabel = t("mobile.layouts");
  const statusTone = isSavingDraft ? "warning" : savedPulse ? "success" : "neutral";
  const controlIconButtonClass =
    "inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 text-white shadow-[0_10px_24px_-16px_rgba(15,23,42,0.36)] transition hover:bg-sky-600 dark:bg-[#1f3b72] dark:text-white dark:shadow-[0_16px_32px_-22px_rgba(2,6,23,0.82)] dark:hover:bg-[#2a56a5]";
  const controlPanelClass =
    "rounded-2xl border border-slate-200/80 bg-white/95 p-1.5 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.24)] backdrop-blur-md dark:border-white/10 dark:bg-[#0f172a]/95 dark:shadow-[0_22px_52px_-28px_rgba(2,6,23,0.92)]";
  const controlMenuItemClass =
    "w-full rounded-xl px-3 py-2 text-left text-[12px] font-semibold text-slate-700 transition hover:bg-slate-100/90 hover:text-slate-900 dark:text-white/80 dark:hover:bg-white/10 dark:hover:text-white";
  const controlMenuItemContentClass = "flex items-center gap-2.5";
  const secondaryControlPillClass =
    "inline-flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white/90 px-3.5 text-[11px] font-semibold text-slate-700 shadow-[0_10px_26px_-18px_rgba(15,23,42,0.16)] backdrop-blur-sm transition hover:bg-white hover:text-slate-900 dark:border-white/10 dark:bg-[#0f172a]/84 dark:text-white/76 dark:shadow-[0_18px_40px_-28px_rgba(2,6,23,0.78)] dark:hover:bg-[#162033] dark:hover:text-white";
  const primaryControlPillClass =
    "inline-flex items-center gap-1.5 rounded-xl bg-[linear-gradient(135deg,#2563eb_0%,#1d4ed8_100%)] px-3.5 text-[11px] font-semibold text-white shadow-[0_14px_30px_-18px_rgba(37,99,235,0.5)] transition hover:shadow-[0_18px_34px_-18px_rgba(37,99,235,0.62)] dark:bg-[linear-gradient(135deg,#3b82f6_0%,#2563eb_100%)]";
  const sourceFindControlPillClass =
    "inline-flex h-7 items-center gap-1.5 rounded-xl border border-amber-300/80 bg-[linear-gradient(135deg,#fff7cc_0%,#ffd47a_38%,#f59e0b_100%)] px-2.5 text-[10px] font-extrabold text-slate-950 shadow-[0_16px_34px_-18px_rgba(245,158,11,0.65)] transition hover:-translate-y-[1px] hover:shadow-[0_20px_38px_-16px_rgba(245,158,11,0.78)] dark:border-amber-200/35 dark:bg-[linear-gradient(135deg,#7c2d12_0%,#b45309_44%,#f59e0b_100%)] dark:text-white dark:shadow-[0_18px_36px_-18px_rgba(251,191,36,0.38)]";
  const sourceFindControlPillInactiveClass =
    "inline-flex h-7 items-center gap-1.5 rounded-xl border border-slate-200/90 bg-slate-100/90 px-2.5 text-[10px] font-semibold text-slate-400 shadow-[0_8px_20px_-18px_rgba(15,23,42,0.12)] transition dark:border-white/10 dark:bg-white/[0.06] dark:text-white/35 dark:shadow-none";
  const searchShellClass =
    "relative z-[40] flex h-8 w-[228px] items-center gap-2 rounded-lg border border-slate-400 bg-white px-2.5 text-[11px] text-slate-700 shadow-[0_8px_20px_-18px_rgba(15,23,42,0.14)] dark:border-white/28 dark:bg-[#0b1220] dark:text-white dark:shadow-[0_16px_36px_-30px_rgba(2,6,23,0.7)]";
  const mobileSearchShellClass =
    "relative z-[40] flex h-8 w-[min(60vw,240px)] items-center gap-1.5 rounded-lg border border-slate-400 bg-white px-2 text-[11px] text-slate-700 dark:border-white/28 dark:bg-[#0b1220] dark:text-white";
  const plainHeaderIconButtonClass =
    "inline-flex h-8 w-8 items-center justify-center text-slate-500 transition hover:text-slate-900 dark:text-white/65 dark:hover:text-white";
  const mobileBottomControlButtonClass =
    "inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 text-white shadow-[0_10px_24px_-16px_rgba(15,23,42,0.36)] transition hover:bg-sky-600 dark:bg-[#1f3b72] dark:text-white dark:shadow-[0_16px_32px_-22px_rgba(2,6,23,0.82)] dark:hover:bg-[#2a56a5]";
  const mobileBottomTooltipClass =
    "pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-[10px] font-semibold text-white opacity-0 shadow-lg transition group-hover:opacity-100 group-focus-within:opacity-100 dark:bg-[#020817]";
  const mobileVerticalTooltipClass =
    "pointer-events-none absolute right-full top-1/2 mr-2 -translate-y-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-[10px] font-semibold text-white opacity-0 shadow-lg transition group-hover:opacity-100 group-focus-within:opacity-100 dark:bg-[#020817]";
  const findSourceActionLabel = t("actions.findSource");
  const findSourceDisabledHint = t("actions.findSourceDisabledHint");
  const findSourceButtonTooltip = sourceFindNodeSelected
    ? findSourceActionLabel
    : findSourceDisabledHint;
  const regenerateMenuActionLabel =
    locale === "ko"
      ? "선택 노드 재구조화"
      : locale === "fr"
      ? "Restructurer le nœud"
      : "Regenerate selected node";
  const structureActionLabel =
    locale === "ko"
      ? "깊게 보기"
      : locale === "fr"
      ? "Approfondir"
      : "Go deeper";
  const regenerateLoadingActionLabel =
    locale === "ko"
      ? regeneratingMode === "expand"
        ? "상세 보강 중"
        : regeneratingMode === "translate"
        ? "언어 정리 중"
        : "구조 다듬는 중"
      : locale === "fr"
      ? regeneratingMode === "expand"
        ? "Enrichissement..."
        : regeneratingMode === "translate"
        ? "Harmonisation..."
        : "Affinage..."
      : regeneratingMode === "expand"
      ? "Expanding..."
      : regeneratingMode === "translate"
      ? "Cleaning language..."
      : "Refining...";
  const regenerateReasonOptions: Array<{
    mode: RegenerateMode;
    icon: string;
    title: string;
    description: string;
  }> = [
    {
      mode: "expand",
      icon: "mdi:text-box-plus-outline",
      title:
        locale === "ko"
          ? "상세정보가 불충분해요"
          : locale === "fr"
          ? "Les détails sont insuffisants"
          : "Details are insufficient",
      description:
        locale === "ko"
          ? "원문과 현재 구조를 함께 읽고 빠진 세부 내용을 보강합니다."
          : locale === "fr"
          ? "Relit la source avec la structure actuelle pour enrichir les détails."
          : "Uses the source and current structure to add missing details.",
    },
    {
      mode: "restructure",
      icon: "mdi:auto-fix",
      title:
        locale === "ko"
          ? "leaf 노드가 너무 많이 나열되어 있어요"
          : locale === "fr"
          ? "Trop de feuilles sont alignées"
          : "Too many leaf nodes are listed",
      description:
        locale === "ko"
          ? "현재 구조만 보고 leaf를 삭제하지 않은 채 의미 있는 중간 parent로 묶습니다."
          : locale === "fr"
          ? "Réorganise la structure actuelle en groupes de sens sans supprimer les feuilles."
          : "Reorganizes the current tree into meaningful parent groups without deleting leaves.",
    },
    {
      mode: "translate",
      icon: "mdi:translate",
      title:
        locale === "ko"
          ? "언어가 나의 선택언어와 달라요"
          : locale === "fr"
          ? "La langue ne correspond pas"
          : "Language does not match my setting",
      description:
        locale === "ko"
          ? "구조는 그대로 두고 topic만 선택 언어로 자연스럽게 정리합니다."
          : locale === "fr"
          ? "Garde la structure et reformule seulement les topics dans la langue choisie."
          : "Keeps the structure and rewrites only topics in the selected language.",
    },
  ];
  const mobileUndoLabel = t("actions.undo");
  const sharedMissingTitle = t("sharedMissing.title");
  const sharedMissingDescription = t("sharedMissing.description");
  const sharedMissingAction = t("sharedMissing.action");
  const sharedByLabel =
    isSharedView && sharedBy
      ? t("sharedBy", { name: sharedBy })
      : isSharedView
        ? t("sharedByFallback")
        : "";
  const isMapProcessing = Boolean(draft && isActiveMapStatus(draft.status));
  const isMapGenerating = Boolean(isMapProcessing && !mapData);
  const displayMapData = useMemo(() => {
    if (!mapData) return null;
    let nextMapData = mapData as NonNullable<MapRow["mind_elixir"]>;
    if (regeneratingMode === "expand" && regeneratingNodeId) {
      nextMapData = withNodeProcessingPlaceholderNode(
        nextMapData,
        regeneratingNodeId,
        locale
      ) as NonNullable<MapRow["mind_elixir"]>;
    }
    return nextMapData;
  }, [locale, mapData, regeneratingMode, regeneratingNodeId]);
  const selectedMapNodeIsRootChild = useMemo(
    () => isDirectRootChildNode(displayMapData ?? mapData, selectedMapNodeId),
    [displayMapData, mapData, selectedMapNodeId]
  );
  const regenerateTargetNodeId = selectedMapNodeIsRootChild
    ? selectedMapNodeId
    : selectedRootChildNodeId;
  const regenerateTargetNode = useMemo(
    () =>
      regenerateTargetNodeId
        ? findMindNodeById(mapData, regenerateTargetNodeId)
        : null,
    [mapData, regenerateTargetNodeId]
  );
  const regenerateTargetNeedsStructure = Boolean(
    selectedMapNodeIsRootChild &&
      regenerateTargetNodeId &&
      !hasChildNodes(regenerateTargetNode)
  );
  const regenerateActionLabel = regenerateTargetNeedsStructure
    ? structureActionLabel
    : regenerateMenuActionLabel;
  const canShowRegenerateActions = Boolean(!isReadOnlyView && regenerateTargetNodeId);
  const canUseRegenerateActions = Boolean(canShowRegenerateActions && draft?.status === "done");
  const structureActionNodeIds = useMemo(() => {
    if (isReadOnlyView || draft?.status !== "done") return [];
    const root = getMindElixirRoot(mapData);
    const children = Array.isArray(root?.children) ? root.children : [];
    return children
      .filter((child) => child.id && !hasChildNodes(child))
      .map((child) => String(child.id));
  }, [draft?.status, isReadOnlyView, mapData]);
  const isRegenerateBusy = Boolean(regeneratingNodeId);
  const regenerateUnavailableLabel =
    locale === "ko"
      ? "구조맵 생성이 완료된 뒤 사용할 수 있어요"
      : locale === "fr"
      ? "Disponible une fois la carte terminée"
      : "Available after the structure map is complete";

  useEffect(() => {
    if (!canUseRegenerateActions || isRegenerateBusy) {
      setRegenerateReasonOpen(false);
    }
  }, [canUseRegenerateActions, isRegenerateBusy]);

  const generatingTitle =
    locale === "ko"
      ? "큰 주제를 정리하는 중입니다"
      : locale === "fr"
      ? "Organisation des grands sujets"
      : "Organizing the main topics";
  const generatingDescription =
    locale === "ko"
      ? "긴 문서를 먼저 큰 구조로 나누고 있어요. 완성되면 필요한 큰 주제에서 세부 구조를 요청할 수 있습니다."
      : locale === "fr"
      ? "Nous divisons d’abord le long document en grands axes. Vous pourrez ensuite approfondir les sujets nécessaires."
      : "We’re first turning the long document into a high-level structure. When it’s ready, you can go deeper into the topics you need.";
  const expandingTitle =
    locale === "ko"
      ? "구조맵을 채워가고 있어요"
      : locale === "fr"
      ? "Remplissage de la carte"
      : "Filling the structure map";
  const expandingDescription =
    locale === "ko"
      ? "큰 가지마다 세부 노드를 붙이며 구조를 완성하는 중입니다."
      : locale === "fr"
      ? "Ajout des nœuds détaillés à chaque grande branche."
      : "Adding detailed nodes under each major branch.";
  const refiningTitle =
    locale === "ko"
      ? "구조를 다듬고 있어요"
      : locale === "fr"
      ? "Affinage de la structure"
      : "Refining the structure";
  const refiningDescription =
    locale === "ko"
      ? "긴 leaf 목록을 의미별로 묶어 읽기 좋게 정리하는 중입니다."
      : locale === "fr"
      ? "Regroupement des longues listes de détails par sens."
      : "Grouping long detail lists into clearer parent nodes.";
  const metadataProcessingTitle =
    locale === "ko"
      ? "상세 정보를 정리하고 있어요"
      : locale === "fr"
      ? "Préparation des détails"
      : "Preparing details";
  const metadataProcessingDescription =
    locale === "ko"
      ? "제목, 설명, 태그 같은 마무리 정보를 정리하는 중입니다."
      : locale === "fr"
      ? "Préparation du titre, de la description et des étiquettes."
      : "Preparing title, description, and tags.";
  const visibleProcessingTitle =
    draft?.status === "processing_metadata"
      ? metadataProcessingTitle
      : getProcessingStructurePhase(processingStep, Boolean(mapData)) === "refining"
      ? refiningTitle
      : getProcessingStructurePhase(processingStep, Boolean(mapData)) === "expanding"
      ? expandingTitle
      : generatingTitle;
  const visibleProcessingDescription =
    draft?.status === "processing_metadata"
      ? metadataProcessingDescription
      : getProcessingStructurePhase(processingStep, Boolean(mapData)) === "refining"
      ? refiningDescription
      : getProcessingStructurePhase(processingStep, Boolean(mapData)) === "expanding"
      ? expandingDescription
      : generatingDescription;
  const processingExpectedMs =
    draft?.sourceCharCount && draft.sourceCharCount > 0
      ? Math.max(
          PROCESSING_MIN_EXPECTED_MS,
          Math.round(draft.sourceCharCount * PROCESSING_MS_PER_CHAR)
        )
      : PROCESSING_FALLBACK_EXPECTED_MS;
  const processingElapsedMs = draft
    ? Math.max(0, processingNow - draft.createdAt)
    : 0;
  const processingProgressPercent = isMapProcessing
    ? Math.min(
        PROCESSING_PROGRESS_CAP,
        Math.max(
          1,
          Math.floor((processingElapsedMs / processingExpectedMs) * PROCESSING_PROGRESS_CAP)
        )
      )
    : 0;

  useEffect(() => {
    if (!isMapProcessing) return;
    setProcessingNow(Date.now());
    const timer = window.setInterval(() => setProcessingNow(Date.now()), 800);
    return () => window.clearInterval(timer);
  }, [isMapProcessing]);

  if (isSharedView && !loading && !draft && error) {
    return (
      <div className="fixed inset-0 z-[120] bg-[linear-gradient(180deg,#f6f8fc_0%,#eef3fb_100%)] dark:bg-[linear-gradient(180deg,#09111d_0%,#0b1220_100%)]">
        <div className="flex h-full items-center justify-center px-6">
          <div className="w-full max-w-[460px] rounded-[28px] border border-slate-300/80 bg-white/92 p-8 text-center shadow-[0_30px_80px_-40px_rgba(15,23,42,0.35)] backdrop-blur dark:border-white/10 dark:bg-[#0f172a]/92 dark:shadow-[0_40px_100px_-44px_rgba(2,6,23,0.92)]">
            <div className="mx-auto mb-5 inline-flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-500 dark:bg-rose-500/12 dark:text-rose-200">
              <Icon icon="mdi:link-off" className="h-7 w-7" />
            </div>
            <h1 className="text-[24px] font-bold tracking-tight text-slate-900 dark:text-white">
              {sharedMissingTitle}
            </h1>
            <p className="mt-3 text-[15px] leading-7 text-slate-600 dark:text-white/70">
              {error || sharedMissingDescription}
            </p>
            <button
              type="button"
              onClick={() => router.push(`/${locale}`)}
              className="mt-6 inline-flex h-11 items-center justify-center rounded-2xl bg-blue-600 px-5 text-[14px] font-semibold text-white shadow-[0_18px_34px_-20px_rgba(37,99,235,0.55)] transition hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400"
            >
              {sharedMissingAction}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[120] bg-white dark:bg-[#0b1220] [--header-h:82px] sm:[--header-h:68px]"
      style={{ overscrollBehavior: "none" }}
    >
      <FullscreenHeader
        title={title}
        onClose={() => router.push(isSharedView ? `/${locale}` : backToMapsUrl)}
        closeLabel={t("actions.closeMap")}
        hideCloseButton={shouldHideFramedSharedChrome}
        titleBadge={
          isSharedView ? (
            <span className="hidden min-w-0 items-center gap-1.5 sm:inline-flex">
              <span className="h-5 shrink-0 items-center rounded-full border border-blue-300/35 bg-blue-500/15 px-2 text-[10px] font-semibold tracking-normal text-blue-50/95 dark:border-blue-300/35 dark:bg-blue-500/15 dark:text-blue-50/95 sm:inline-flex">
                {t("readOnlyBadge")}
              </span>
              <span className="max-w-[260px] truncate text-[10px] font-medium tracking-normal text-blue-50/80 dark:text-blue-50/75">
                {sharedByLabel}
              </span>
            </span>
          ) : undefined
        }
        mobileTitleBadge={
          isSharedView ? (
            <span className="inline-flex max-w-[78vw] items-center gap-1.5">
              <span className="shrink-0 rounded-full border border-blue-300/35 bg-blue-500/15 px-1.5 py-[1px] text-[9px] font-semibold leading-none tracking-normal text-blue-50/95 dark:border-blue-300/35 dark:bg-blue-500/15 dark:text-blue-50/95">
                {t("readOnlyBadge")}
              </span>
              <span className="truncate text-[9px] font-medium leading-none tracking-normal text-blue-50/80 dark:text-blue-50/75">
                {sharedByLabel}
              </span>
            </span>
          ) : undefined
        }
        left={
          !leftOpen ? (
            <button
              id={FULLSCREEN_PAGE_LEFT_PANEL_BUTTON_ID}
              type="button"
              onClick={() => openTab(leftTab)}
              className="
                inline-flex h-8 w-10 items-center justify-center
                rounded-l-none rounded-r-full
                bg-blue-600 text-white
                shadow-sm transition hover:bg-blue-700
                dark:bg-blue-500/70 dark:text-white dark:hover:bg-blue-500
              "
              aria-label={t("tabs.info")}
              title={t("tabs.info")}
            >
              <span className="sr-only">{t("tabs.info")}</span>
              <Icon icon="mdi:chevron-right" className="h-5 w-5" />
            </button>
          ) : (
            <div className="h-8 w-10" aria-hidden="true" />
          )
        }
        right={
          <>
            <div className="flex items-center gap-1 sm:hidden">
              <div className={mobileSearchShellClass}>
                <Icon icon="mdi:magnify" className="h-3.5 w-3.5 shrink-0 text-slate-600 dark:text-white/75" />
                <input
                  ref={mobileSearchInputRef}
                  value={searchQuery}
                  onFocus={() => setSearchOpen(true)}
                  onChange={(e) => {
                    if (!searchOpen) setSearchOpen(true);
                    setSearchQuery(e.target.value);
                  }}
                  onKeyDown={(e) => {
                    if (e.repeat) {
                      e.preventDefault();
                      return;
                    }
                    e.stopPropagation();
                    if (e.key === "Escape") {
                      e.preventDefault();
                      closeSearch();
                      return;
                    }
                    if (e.key === "Enter") {
                      e.preventDefault();
                      stepSearch(e.shiftKey ? -1 : 1);
                      return;
                    }
                    if (e.key === "ArrowDown") {
                      e.preventDefault();
                      stepSearch(1);
                      return;
                    }
                    if (e.key === "ArrowUp") {
                      e.preventDefault();
                      stepSearch(-1);
                      return;
                    }
                  }}
                  placeholder={t("actions.searchPlaceholder")}
                  className="min-w-0 flex-1 bg-transparent text-[11px] text-slate-800 outline-none placeholder:text-slate-500 dark:text-white dark:placeholder:text-white/45"
                />
                <span className="shrink-0 text-[10px] font-semibold text-slate-500 dark:text-white/60">
                  {searchResults.length ? `${searchIndex + 1}/${searchResults.length}` : "0"}
                </span>
                {searchQuery ? (
                  <button
                    type="button"
                    onClick={closeSearch}
                    className="inline-flex h-5 w-5 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-white/60 dark:hover:bg-white/10 dark:hover:text-white"
                    aria-label={t("actions.clearSearch")}
                    title={t("actions.clearSearch")}
                  >
                    <Icon icon="mdi:close" className="h-3.5 w-3.5" />
                  </button>
                ) : null}
                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => stepSearch(-1)}
                    className="inline-flex h-5 w-5 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-white/65 dark:hover:bg-white/10 dark:hover:text-white"
                    aria-label={t("actions.previousSearchResult")}
                    title={t("actions.previousSearchResult")}
                  >
                    <Icon icon="mdi:chevron-up" className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => stepSearch(1)}
                    className="inline-flex h-5 w-5 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-white/65 dark:hover:bg-white/10 dark:hover:text-white"
                    aria-label={t("actions.nextSearchResult")}
                    title={t("actions.nextSearchResult")}
                  >
                    <Icon icon="mdi:chevron-down" className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!sourceFindNodeSelected) return;
                  void handleFindSourceFromSelectedNode();
                }}
                aria-disabled={!sourceFindNodeSelected}
                className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border transition ${
                  sourceFindNodeSelected
                    ? "border-amber-300/80 bg-[linear-gradient(135deg,#fff7cc_0%,#ffd47a_36%,#f59e0b_100%)] text-slate-950 shadow-[0_14px_26px_-16px_rgba(245,158,11,0.72)] hover:-translate-y-[1px] hover:shadow-[0_18px_32px_-16px_rgba(245,158,11,0.82)] dark:border-amber-200/35 dark:bg-[linear-gradient(135deg,#7c2d12_0%,#b45309_44%,#f59e0b_100%)] dark:text-white dark:shadow-[0_16px_28px_-16px_rgba(251,191,36,0.42)]"
                    : "cursor-default border-slate-200 bg-slate-100 text-slate-400 shadow-none dark:border-white/10 dark:bg-white/[0.06] dark:text-white/35"
                }`}
                aria-label={findSourceButtonTooltip}
                title={findSourceButtonTooltip}
              >
                <Icon icon="mdi:file-search-outline" className="h-4 w-4" />
              </button>
              {currentStarred ? (
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-amber-300/55 bg-[#1f2937] text-amber-300 shadow-[0_10px_18px_-10px_rgba(217,119,6,0.55)] dark:border-amber-300/45 dark:bg-[#0f172a] dark:text-amber-300 dark:shadow-[0_10px_20px_-12px_rgba(251,191,36,0.35)]">
                  <Icon icon="mdi:star" className="h-4 w-4" />
                </span>
              ) : null}
            </div>

            <div className="hidden sm:flex items-center gap-1.5">
              {isSharedView ? <LanguageSelector compact /> : null}
              {!isReadOnlyView && statusLabel ? (
                <span
                  className={`
                    inline-flex h-7 items-center px-1.5 text-[10px] font-semibold
                    ${
                      statusTone === "success"
                        ? "text-emerald-700 dark:text-emerald-200"
                        : statusTone === "warning"
                        ? "text-amber-700 dark:text-amber-200"
                        : "text-slate-500 dark:text-white/65"
                    }
                  `}
                >
                  {statusLabel}
                </span>
              ) : null}
              {!isReadOnlyView ? (
                <>
                  <div className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1 shadow-[0_8px_20px_-16px_rgba(15,23,42,0.25)] dark:border-white/10 dark:bg-[#121a29]">
                    {readStateOptions.map(({ value, label, icon }) => {
                      const active = currentReadStatus === value;
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => void handleUpdateMapState({ readStatus: value })}
                          className={`inline-flex h-7 items-center gap-1 rounded-lg px-2.5 text-[10px] font-semibold transition ${
                            active
                              ? "bg-blue-600 text-white shadow-[0_10px_18px_-10px_rgba(37,99,235,0.8)]"
                              : "text-slate-600 hover:bg-white hover:text-slate-900 dark:text-white/70 dark:hover:bg-white/10 dark:hover:text-white"
                          }`}
                          aria-label={label}
                          title={label}
                        >
                          <Icon icon={icon} className="h-3.5 w-3.5" />
                          <span>{label}</span>
                        </button>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleUpdateMapState({ starred: !currentStarred })}
                    className={`inline-flex h-7 w-7 items-center justify-center rounded-xl border transition ${
                      currentStarred
                        ? "border-amber-300 bg-amber-50 text-amber-700 shadow-[0_10px_24px_-16px_rgba(217,119,6,0.55)] dark:border-amber-300/35 dark:bg-amber-500/14 dark:text-amber-100"
                        : "border-slate-200 bg-white text-slate-500 hover:text-amber-600 dark:border-white/10 dark:bg-[#0f172a]/84 dark:text-white/70 dark:hover:bg-[#162033] dark:hover:text-white"
                    }`}
                    aria-label={
                      currentStarred
                        ? t("moreMenu.unmarkImportant")
                        : t("moreMenu.markImportant")
                    }
                    title={
                      currentStarred
                        ? t("moreMenu.unmarkImportant")
                        : t("moreMenu.markImportant")
                    }
                  >
                    <Icon
                      icon={currentStarred ? "mdi:star" : "mdi:star-outline"}
                      className="h-3.5 w-3.5"
                    />
                  </button>
                </>
              ) : null}
              {!isReadOnlyView && hasDraft ? (
                <>
                  <button
                    type="button"
                    onClick={() => setConfirmDiscardOpen(true)}
                    className={`${secondaryControlPillClass} h-7 px-3 text-[10px]`}
                  >
                    {t("actions.discardDraft")}
                  </button>
                  <button
                    type="button"
                    onClick={handlePublish}
                    className={`${primaryControlPillClass} h-7 px-3 text-[10px]`}
                  >
                    {t("actions.publish")}
                  </button>
                </>
              ) : null}
              <div className={searchShellClass}>
                <Icon icon="mdi:magnify" className="h-4 w-4 shrink-0 text-slate-600 dark:text-white/75" />
                <input
                  ref={searchInputRef}
                  value={searchQuery}
                  onFocus={() => setSearchOpen(true)}
                  onChange={(e) => {
                    if (!searchOpen) setSearchOpen(true);
                    setSearchQuery(e.target.value);
                  }}
                  onKeyDown={(e) => {
                    if (e.repeat) {
                      e.preventDefault();
                      return;
                    }
                    e.stopPropagation();
                    if (e.key === "Escape") {
                      e.preventDefault();
                      closeSearch();
                      return;
                    }
                    if (e.key === "Enter") {
                      e.preventDefault();
                      stepSearch(e.shiftKey ? -1 : 1);
                      return;
                    }
                    if (e.key === "ArrowDown") {
                      e.preventDefault();
                      stepSearch(1);
                      return;
                    }
                    if (e.key === "ArrowUp") {
                      e.preventDefault();
                      stepSearch(-1);
                      return;
                    }
                  }}
                  placeholder={t("actions.searchPlaceholder")}
                  className="min-w-0 flex-1 bg-transparent text-[11px] text-slate-800 outline-none placeholder:text-slate-500 dark:text-white dark:placeholder:text-white/45"
                />
                <span className="shrink-0 text-[10px] font-semibold text-slate-500 dark:text-white/60">
                  {searchResults.length ? `${searchIndex + 1}/${searchResults.length}` : "0"}
                </span>
                {searchQuery ? (
                  <button
                    type="button"
                    onClick={closeSearch}
                    className="inline-flex h-5 w-5 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-white/60 dark:hover:bg-white/10 dark:hover:text-white"
                    aria-label={t("actions.clearSearch")}
                    title={t("actions.clearSearch")}
                  >
                    <Icon icon="mdi:close" className="h-3.5 w-3.5" />
                  </button>
                ) : null}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => stepSearch(-1)}
                    className="inline-flex h-6 w-6 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-white/65 dark:hover:bg-white/10 dark:hover:text-white"
                    aria-label={t("actions.previousSearchResult")}
                    title={t("actions.previousSearchResult")}
                  >
                    <Icon icon="mdi:chevron-up" className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => stepSearch(1)}
                    className="inline-flex h-6 w-6 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-white/65 dark:hover:bg-white/10 dark:hover:text-white"
                    aria-label={t("actions.nextSearchResult")}
                    title={t("actions.nextSearchResult")}
                  >
                    <Icon icon="mdi:chevron-down" className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <button
                    type="button"
                    onClick={() => {
                      if (!sourceFindNodeSelected) return;
                      void handleFindSourceFromSelectedNode();
                    }}
                    aria-disabled={!sourceFindNodeSelected}
                    className={
                      sourceFindNodeSelected
                        ? sourceFindControlPillClass
                        : sourceFindControlPillInactiveClass
                    }
                    aria-label={findSourceButtonTooltip}
                    title={findSourceButtonTooltip}
                  >
                    <span
                      className={`inline-flex h-[18px] w-[18px] items-center justify-center rounded-full ${
                        sourceFindNodeSelected
                          ? "bg-black/10 text-slate-900 dark:bg-white/14 dark:text-white"
                          : "bg-slate-200 text-slate-400 dark:bg-white/10 dark:text-white/35"
                      }`}
                    >
                      <Icon icon="mdi:file-search-outline" className="h-3.5 w-3.5" />
                    </span>
                    <span>{findSourceActionLabel}</span>
                  </button>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content
                    side="bottom"
                    sideOffset={8}
                    className="z-[260] rounded-xl bg-slate-950 px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-[0_14px_32px_-18px_rgba(15,23,42,0.65)] dark:bg-white dark:text-slate-950"
                  >
                    {findSourceButtonTooltip}
                  <Tooltip.Arrow className="fill-slate-950 dark:fill-white" />
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
              {canShowRegenerateActions && !regenerateTargetNeedsStructure ? (
                <div className="relative inline-flex" ref={regenerateActionsRef}>
                  <button
                    type="button"
                    onClick={() => {
                      if (!canUseRegenerateActions || isRegenerateBusy) return;
                      if (regenerateTargetNeedsStructure) {
                        void handleRegenerateSelectedNode("expand");
                        return;
                      }
                      setRegenerateReasonOpen((open) => !open);
                    }}
                    disabled={!canUseRegenerateActions || isRegenerateBusy}
                    className={`inline-flex h-7 items-center gap-1.5 rounded-xl px-2.5 text-[10px] font-extrabold transition disabled:cursor-not-allowed disabled:opacity-55 ${
                      regenerateTargetNeedsStructure
                        ? "border border-emerald-300/80 bg-emerald-600 text-white shadow-[0_16px_34px_-18px_rgba(5,150,105,0.65)] hover:-translate-y-[1px] hover:bg-emerald-500 disabled:hover:translate-y-0 disabled:hover:bg-emerald-600 dark:border-emerald-200/35 dark:bg-emerald-500 dark:shadow-[0_18px_36px_-18px_rgba(52,211,153,0.42)]"
                        : "border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50 hover:text-slate-950 disabled:hover:bg-white dark:border-white/10 dark:bg-white/[0.05] dark:text-white/62 dark:hover:bg-white/10 dark:hover:text-white"
                    }`}
                    aria-label={
                      regeneratingNodeId
                        ? regenerateLoadingActionLabel
                        : !canUseRegenerateActions
                        ? regenerateUnavailableLabel
                        : regenerateActionLabel
                    }
                    title={
                      regeneratingNodeId
                        ? regenerateLoadingActionLabel
                        : !canUseRegenerateActions
                        ? regenerateUnavailableLabel
                        : regenerateActionLabel
                    }
                  >
                    <Icon
                      icon={
                        regeneratingNodeId
                          ? "mdi:loading"
                          : regenerateTargetNeedsStructure
                          ? "mdi:source-branch-plus"
                          : "mdi:tune-variant"
                      }
                      className={`h-3.5 w-3.5 ${
                        regeneratingNodeId
                          ? "animate-spin"
                          : ""
                      }`}
                    />
                    <span>
                      {regeneratingNodeId
                        ? regenerateLoadingActionLabel
                        : regenerateActionLabel}
                    </span>
                    {!regeneratingNodeId && !regenerateTargetNeedsStructure ? (
                      <Icon icon="mdi:chevron-down" className="h-3.5 w-3.5" />
                    ) : null}
                  </button>
                  {regenerateReasonOpen && canUseRegenerateActions && !regenerateTargetNeedsStructure ? (
                    <div className="absolute right-0 top-full z-[280] mt-2 w-[320px] rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_26px_70px_-34px_rgba(15,23,42,0.45)] dark:border-white/10 dark:bg-[#111827] dark:shadow-[0_30px_80px_-36px_rgba(2,6,23,0.9)]">
                      <div className="px-2 pb-2 pt-1 text-[11px] font-bold text-slate-500 dark:text-white/55">
                        {locale === "ko"
                          ? "재구조화가 필요한 이유를 골라주세요"
                          : locale === "fr"
                          ? "Choisissez la raison"
                          : "Choose a reason"}
                      </div>
                      <div className="space-y-1">
                        {regenerateReasonOptions.map((option) => (
                          <button
                            key={option.mode}
                            type="button"
                            onClick={() => void handleRegenerateSelectedNode(option.mode)}
                            className="flex w-full items-start gap-2.5 rounded-xl px-2.5 py-2.5 text-left transition hover:bg-slate-100 dark:hover:bg-white/10"
                          >
                            <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 dark:bg-indigo-400/14 dark:text-indigo-200">
                              <Icon icon={option.icon} className="h-4 w-4" />
                            </span>
                            <span className="min-w-0">
                              <span className="block text-[12px] font-extrabold text-slate-900 dark:text-white">
                                {option.title}
                              </span>
                              <span className="mt-0.5 block text-[11px] leading-4 text-slate-500 dark:text-white/58">
                                {option.description}
                              </span>
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
              <div className="relative" ref={desktopMoreRef}>
                <button
                  type="button"
                  onClick={() => setDesktopMoreOpen((v) => !v)}
                  className={plainHeaderIconButtonClass}
                  aria-label={t("actions.more")}
                  title={t("actions.more")}
                >
                  <Icon icon="mdi:dots-horizontal" className="h-4 w-4" />
                </button>
                {desktopMoreOpen && (
                  <div
                    className={`absolute right-0 mt-2 z-[340] w-[230px] max-h-[min(68vh,560px)] overflow-y-auto overscroll-contain ${controlPanelClass}`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setDesktopMoreOpen(false);
                        mindRef.current?.setLayout?.("left");
                      }}
                      className={controlMenuItemClass}
                    >
                      <span className={controlMenuItemContentClass}>
                        <Icon icon="mdi:arrow-left-bold-outline" className="h-4 w-4 shrink-0 text-slate-400 dark:text-white/50" />
                        <span>{t("moreMenu.layoutLeft")}</span>
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDesktopMoreOpen(false);
                        mindRef.current?.setLayout?.("right");
                      }}
                      className={controlMenuItemClass}
                    >
                      <span className={controlMenuItemContentClass}>
                        <Icon icon="mdi:arrow-right-bold-outline" className="h-4 w-4 shrink-0 text-slate-400 dark:text-white/50" />
                        <span>{t("moreMenu.layoutRight")}</span>
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDesktopMoreOpen(false);
                        mindRef.current?.setLayout?.("side");
                      }}
                      className={controlMenuItemClass}
                    >
                      <span className={controlMenuItemContentClass}>
                        <Icon icon="mdi:arrow-left-right-bold-outline" className="h-4 w-4 shrink-0 text-slate-400 dark:text-white/50" />
                        <span>{t("moreMenu.layoutBoth")}</span>
                      </span>
                    </button>
                    <div className="my-1 h-px bg-neutral-200 dark:bg-white/10" />
                    <div className="px-3 py-2">
                      <div className="text-[11px] font-semibold text-slate-500 dark:text-white/60">
                        {t("moreMenu.theme")}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {themeOptions.map((theme) => {
                          const themeLabel =
                            theme.name === PROFILE_THEME_NAME
                              ? t("moreMenu.profileTheme")
                              : theme.name === DEFAULT_THEME_NAME
                              ? t("moreMenu.defaultTheme")
                              : theme.name;
                          return (
                            <button
                              key={theme.name}
                              type="button"
                              onClick={() => {
                                handleSelectTheme(theme.name);
                                setDesktopMoreOpen(false);
                              }}
                              className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${
                                theme.name === themeName
                                  ? "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-300/40 dark:bg-blue-500/10 dark:text-blue-50/90"
                                  : "border-slate-200 bg-white text-slate-600 dark:border-white/10 dark:bg-white/[0.06] dark:text-white/70"
                              }`}
                            >
                              {themeLabel}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div className="my-1 h-px bg-neutral-200 dark:bg-white/10" />
                    <button
                      type="button"
                      onClick={() => {
                        setDesktopMoreOpen(false);
                        handleExportPng();
                      }}
                      className={controlMenuItemClass}
                    >
                      <span className={controlMenuItemContentClass}>
                        <Icon icon="mdi:download" className="h-4 w-4 shrink-0 text-slate-400 dark:text-white/50" />
                        <span>{t("moreMenu.savePng")}</span>
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDesktopMoreOpen(false);
                        void handlePrintMap();
                      }}
                      className={controlMenuItemClass}
                    >
                      <span className={controlMenuItemContentClass}>
                        <Icon icon="mdi:printer-outline" className="h-4 w-4 shrink-0 text-slate-400 dark:text-white/50" />
                        <span>{t("moreMenu.print")}</span>
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDesktopMoreOpen(false);
                        setShortcutsOpen(true);
                      }}
                      className={controlMenuItemClass}
                    >
                      <span className={controlMenuItemContentClass}>
                        <Icon icon="mdi:keyboard-outline" className="h-4 w-4 shrink-0 text-slate-400 dark:text-white/50" />
                        <span>{t("moreMenu.shortcuts")}</span>
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDesktopMoreOpen(false);
                        handleOpenSlideshow();
                      }}
                      className={controlMenuItemClass}
                    >
                      <span className={controlMenuItemContentClass}>
                        <Icon icon="mdi:presentation-play" className="h-4 w-4 shrink-0 text-slate-400 dark:text-white/50" />
                        <span>{t("slideshow.open")}</span>
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDesktopMoreOpen(false);
                        setTutorialStepIndex(0);
                        setTutorialOpen(true);
                      }}
                      className={controlMenuItemClass}
                    >
                      <span className={controlMenuItemContentClass}>
                        <Icon icon="mdi:school-outline" className="h-4 w-4 shrink-0 text-slate-400 dark:text-white/50" />
                        <span>{t("actions.tutorial")}</span>
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDesktopMoreOpen(false);
                        void handleFindSourceFromSelectedNode();
                      }}
                      className={controlMenuItemClass}
                    >
                      <span className={controlMenuItemContentClass}>
                        <Icon icon="mdi:file-search-outline" className="h-4 w-4 shrink-0 text-slate-400 dark:text-white/50" />
                        <span>{t("actions.findSource")}</span>
                      </span>
                    </button>
                    {!isReadOnlyView ? (
                      <button
                        type="button"
                        onClick={() => {
                          setDesktopMoreOpen(false);
                          setShareOpen(true);
                          void fetchShareStatus();
                        }}
                        className={controlMenuItemClass}
                      >
                        <span className={controlMenuItemContentClass}>
                          <Icon icon="mdi:share-variant-outline" className="h-4 w-4 shrink-0 text-slate-400 dark:text-white/50" />
                          <span>{t("moreMenu.share")}</span>
                        </span>
                      </button>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          </>
        }
      />

      <div className="relative w-full" style={{ height: "calc(100% - var(--header-h))" }}>
        {currentReadStatus === "in_progress" ? (
          <div className="pointer-events-none absolute inset-x-0 top-0 z-[26] h-0.5 bg-amber-400/95 shadow-[0_1px_10px_rgba(245,158,11,0.45)] dark:bg-amber-300/90 dark:shadow-[0_1px_10px_rgba(251,191,36,0.35)]" />
        ) : null}
        {currentReadStatus === "in_progress" ? (
          <div className="pointer-events-none absolute left-3 top-3 z-[26] sm:left-4 sm:top-4">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-amber-300/70 bg-amber-500 text-white shadow-[0_10px_20px_-12px_rgba(245,158,11,0.65)] dark:border-amber-300/35 dark:bg-amber-400 dark:text-slate-900 dark:shadow-[0_10px_20px_-12px_rgba(251,191,36,0.45)]">
              <Icon icon="mdi:clock-time-four-outline" className="h-4 w-4" />
            </span>
          </div>
        ) : null}
        {currentReadStatus === "read" ? (
          <div className="pointer-events-none absolute inset-x-0 top-0 z-[26] h-0.5 bg-emerald-500/95 shadow-[0_1px_10px_rgba(16,185,129,0.4)] dark:bg-emerald-400/90 dark:shadow-[0_1px_10px_rgba(52,211,153,0.32)]" />
        ) : null}
        {currentStarred ? (
          <div className="pointer-events-none absolute right-4 top-4 z-[26] hidden sm:block">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-amber-300/55 bg-[#1f2937] text-amber-300 shadow-[0_10px_18px_-10px_rgba(217,119,6,0.55)] dark:border-amber-300/45 dark:bg-[#0f172a] dark:text-amber-300 dark:shadow-[0_10px_20px_-12px_rgba(251,191,36,0.35)]">
              <Icon icon="mdi:star" className="h-4 w-4" />
            </span>
          </div>
        ) : null}
        {isSharedView && isLikelyInAppBrowser ? (
          <div className="pointer-events-auto absolute left-3 right-16 top-3 z-[24] sm:hidden">
            <div className="rounded-2xl border border-amber-200/90 bg-amber-50/96 px-3 py-2.5 text-[11px] text-amber-900 shadow-[0_10px_24px_-18px_rgba(15,23,42,0.7)] backdrop-blur-sm dark:border-amber-300/20 dark:bg-[#1f1606]/92 dark:text-amber-100/92">
              <div className="flex items-start gap-2">
                <Icon icon="mdi:alert-circle-outline" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="leading-4">{t("share.inAppHint")}</p>
                  <button
                    type="button"
                    onClick={() => {
                      void handleCopyShare();
                    }}
                    className="mt-2 inline-flex items-center gap-1 rounded-full border border-amber-300/80 bg-white/80 px-2.5 py-1 text-[10px] font-semibold text-amber-900 dark:border-amber-200/20 dark:bg-white/10 dark:text-amber-50"
                  >
                    <Icon icon="mdi:content-copy" className="h-3 w-3 shrink-0" />
                    {t("share.copyLink")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
        <div className="pointer-events-auto absolute right-3 top-3 z-[25] flex flex-col gap-2 sm:hidden">
          <div className="group relative">
            <button
              type="button"
              onClick={() => {
                setMobileToolbarCollapsed((v) => !v);
                setMobileMapActionsOpen(false);
                setMobileThemeOpen(false);
                setMobileStateOpen(false);
              }}
              className={controlIconButtonClass}
              aria-label={mobileToolbarCollapsed ? mobileToolbarOpenLabel : mobileToolbarCloseLabel}
              title={mobileToolbarCollapsed ? mobileToolbarOpenLabel : mobileToolbarCloseLabel}
            >
              <Icon
                icon={mobileToolbarCollapsed ? "mdi:chevron-left" : "mdi:chevron-right"}
                className="h-4 w-4"
              />
            </button>
            <span className={mobileVerticalTooltipClass}>
              {mobileToolbarCollapsed ? mobileToolbarOpenLabel : mobileToolbarCloseLabel}
            </span>
          </div>
          {!isReadOnlyView ? (
            <div className="group relative" ref={mobileStateRef}>
              <button
                type="button"
                onClick={() => setMobileStateOpen((prev) => !prev)}
                className={controlIconButtonClass}
                aria-label={stateActionLabel}
                title={stateActionLabel}
              >
                <Icon icon="mdi:bookmark-multiple-outline" className="h-4 w-4" />
              </button>
              <span className={mobileVerticalTooltipClass}>{stateActionLabel}</span>
              {mobileStateOpen ? (
                <div
                  className={`absolute right-full top-0 mr-2 z-[340] w-[210px] ${controlPanelClass}`}
                >
                  <div className="px-2 pb-1 pt-1 text-[11px] font-semibold text-slate-500 dark:text-white/60">
                    {stateActionLabel}
                  </div>
                  <div className="space-y-1">
                    {readStateOptions.map(({ value, label, icon }) => {
                      const active = currentReadStatus === value;
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => {
                            void handleUpdateMapState({ readStatus: value });
                            setMobileStateOpen(false);
                          }}
                          className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-[12px] font-semibold transition ${
                            active
                              ? "bg-blue-50 text-blue-700 dark:bg-blue-500/12 dark:text-blue-100"
                              : "text-slate-700 hover:bg-slate-100 dark:text-white/80 dark:hover:bg-white/10"
                          }`}
                        >
                          <span className="inline-flex items-center gap-2">
                            <Icon icon={icon} className="h-4 w-4" />
                            {label}
                          </span>
                          {active ? <Icon icon="mdi:check" className="h-4 w-4" /> : null}
                        </button>
                      );
                    })}
                    <div className="my-1 h-px bg-neutral-200 dark:bg-white/10" />
                    <button
                      type="button"
                      onClick={() => void handleUpdateMapState({ starred: !currentStarred })}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-[12px] font-semibold transition ${
                        currentStarred
                          ? "bg-amber-50 text-amber-700 dark:bg-amber-500/14 dark:text-amber-100"
                          : "text-slate-700 hover:bg-slate-100 dark:text-white/80 dark:hover:bg-white/10"
                      }`}
                    >
                      <span className="inline-flex items-center gap-2">
                        <Icon icon={currentStarred ? "mdi:star" : "mdi:star-outline"} className="h-4 w-4" />
                        {tReadState("starred")}
                      </span>
                      {currentStarred ? <Icon icon="mdi:check" className="h-4 w-4" /> : null}
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
          {canShowRegenerateActions ? (
            <div className="group relative" ref={mobileRegenerateActionsRef}>
              <button
                type="button"
                onClick={() => {
                  if (!canUseRegenerateActions || isRegenerateBusy) return;
                  if (regenerateTargetNeedsStructure) {
                    void handleRegenerateSelectedNode("expand");
                    return;
                  }
                  setRegenerateReasonOpen((open) => !open);
                }}
                disabled={!canUseRegenerateActions || isRegenerateBusy}
                className={`${
                  regenerateTargetNeedsStructure
                    ? "inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-white shadow-[0_14px_28px_-16px_rgba(5,150,105,0.55)] transition hover:bg-emerald-500 dark:bg-emerald-500"
                    : controlIconButtonClass
                } disabled:cursor-not-allowed disabled:opacity-55`}
                aria-label={
                  regeneratingNodeId
                    ? regenerateLoadingActionLabel
                    : !canUseRegenerateActions
                    ? regenerateUnavailableLabel
                    : regenerateActionLabel
                }
                title={
                  regeneratingNodeId
                    ? regenerateLoadingActionLabel
                    : !canUseRegenerateActions
                    ? regenerateUnavailableLabel
                    : regenerateActionLabel
                }
              >
                <Icon
                  icon={
                    regeneratingNodeId
                      ? "mdi:loading"
                      : regenerateTargetNeedsStructure
                      ? "mdi:source-branch-plus"
                      : "mdi:tune-variant"
                  }
                  className={`h-4 w-4 ${regeneratingNodeId ? "animate-spin" : ""}`}
                />
              </button>
              <span className={mobileVerticalTooltipClass}>
                {regeneratingNodeId
                  ? regenerateLoadingActionLabel
                  : regenerateActionLabel}
              </span>
              {regenerateReasonOpen && canUseRegenerateActions && !regenerateTargetNeedsStructure ? (
                <div className="absolute right-full top-0 z-[280] mr-2 w-[284px] rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_26px_70px_-34px_rgba(15,23,42,0.45)] dark:border-white/10 dark:bg-[#111827] dark:shadow-[0_30px_80px_-36px_rgba(2,6,23,0.9)]">
                  <div className="px-2 pb-2 pt-1 text-[11px] font-bold text-slate-500 dark:text-white/55">
                    {locale === "ko"
                      ? "재구조화 이유"
                      : locale === "fr"
                      ? "Raison"
                      : "Reason"}
                  </div>
                  <div className="space-y-1">
                    {regenerateReasonOptions.map((option) => (
                      <button
                        key={option.mode}
                        type="button"
                        onClick={() => void handleRegenerateSelectedNode(option.mode)}
                        className="flex w-full items-start gap-2 rounded-xl px-2 py-2 text-left transition hover:bg-slate-100 dark:hover:bg-white/10"
                      >
                        <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 dark:bg-indigo-400/14 dark:text-indigo-200">
                          <Icon icon={option.icon} className="h-4 w-4" />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-[12px] font-extrabold text-slate-900 dark:text-white">
                            {option.title}
                          </span>
                          <span className="mt-0.5 block text-[10px] leading-4 text-slate-500 dark:text-white/58">
                            {option.description}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
          {!mobileToolbarCollapsed ? (
            <>
              <div className="relative" ref={mobileMapActionsRef}>
                <div className="group relative">
                  <button
                    type="button"
                    onClick={() => setMobileMapActionsOpen((v) => !v)}
                    className={controlIconButtonClass}
                    aria-label={mobileMapActionsLabel}
                    title={mobileMapActionsLabel}
                  >
                    <Icon icon="mdi:vector-polyline" className="h-4 w-4" />
                  </button>
                  <span className={mobileVerticalTooltipClass}>{mobileMapActionsLabel}</span>
                </div>

            {mobileMapActionsOpen && (
              <div
                className={`absolute right-full mr-2 top-0 z-[340] max-h-[min(68vh,520px)] w-[180px] overflow-y-auto overscroll-contain ${controlPanelClass}`}
              >
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMapActionsOpen(false);
                      mindRef.current?.setLayout?.("left");
                    }}
                    className={controlMenuItemClass}
                  >
                    {t("moreMenu.layoutLeft")}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMapActionsOpen(false);
                      mindRef.current?.setLayout?.("right");
                    }}
                    className={controlMenuItemClass}
                  >
                    {t("moreMenu.layoutRight")}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMapActionsOpen(false);
                      mindRef.current?.setLayout?.("side");
                    }}
                    className={controlMenuItemClass}
                  >
                    {t("moreMenu.layoutBoth")}
                </button>
                <div className="my-1 h-px bg-neutral-200 dark:bg-white/10" />
                <button
                  type="button"
                  onClick={() => {
                    setMobileMapActionsOpen(false);
                    setTutorialStepIndex(0);
                    setTutorialOpen(true);
                  }}
                  className={controlMenuItemClass}
                >
                  {t("actions.tutorial")}
                </button>
              </div>
            )}
              </div>

              {!isReadOnlyView ? (
                <div className="group relative">
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMapActionsOpen(false);
                      setMobileThemeOpen(false);
                      setMobileStateOpen(false);
                      mindRef.current?.undo();
                    }}
                    className={controlIconButtonClass}
                    aria-label={mobileUndoLabel}
                    title={mobileUndoLabel}
                  >
                    <Icon icon="mdi:undo" className="h-4 w-4" />
                  </button>
                  <span className={mobileVerticalTooltipClass}>{mobileUndoLabel}</span>
                </div>
              ) : null}

              <div className="relative" ref={mobileThemeRef}>
                <div className="group relative">
                  <button
                    type="button"
                    onClick={() => {
                      setMobileThemeOpen((v) => !v);
                      setMobileStateOpen(false);
                    }}
                    className={controlIconButtonClass}
                    aria-label={t("moreMenu.theme")}
                    title={t("moreMenu.theme")}
                  >
                    <Icon icon="mdi:palette-outline" className="h-4 w-4" />
                  </button>
                  <span className={mobileVerticalTooltipClass}>{t("moreMenu.theme")}</span>
                </div>
                {mobileThemeOpen && (
                  <div className={`absolute right-full mr-2 top-0 w-[180px] p-2 ${controlPanelClass}`}>
                    <div className="text-[11px] font-semibold text-slate-500 dark:text-white/60">
                      {t("moreMenu.theme")}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {themeOptions.map((theme) => (
                        <button
                          key={theme.name}
                          type="button"
                          onClick={() => {
                            handleSelectTheme(theme.name);
                            setMobileThemeOpen(false);
                          }}
                          className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${
                            theme.name === themeName
                              ? "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-300/40 dark:bg-blue-500/10 dark:text-blue-50/90"
                              : "border-slate-200 bg-white text-slate-600 dark:border-white/10 dark:bg-white/[0.06] dark:text-white/70"
                          }`}
                        >
                          {theme.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="group relative">
                <button
                  type="button"
                  onClick={handleExportPng}
                  className={controlIconButtonClass}
                  aria-label={t("moreMenu.savePng")}
                  title={t("moreMenu.savePng")}
                >
                  <Icon icon="mdi:download" className="h-4 w-4" />
                </button>
                <span className={mobileVerticalTooltipClass}>{t("moreMenu.savePng")}</span>
              </div>

              <div className="group relative">
                <button
                  type="button"
                  onClick={() => void handlePrintMap()}
                  className={controlIconButtonClass}
                  aria-label={t("moreMenu.print")}
                  title={t("moreMenu.print")}
                >
                  <Icon icon="mdi:printer-outline" className="h-4 w-4" />
                </button>
                <span className={mobileVerticalTooltipClass}>{t("moreMenu.print")}</span>
              </div>

              {!isReadOnlyView ? (
                <div className="group relative">
                  <button
                    type="button"
                    onClick={() => {
                      setShareOpen(true);
                      void fetchShareStatus();
                    }}
                    className={controlIconButtonClass}
                    aria-label={t("moreMenu.share")}
                    title={t("moreMenu.share")}
                  >
                    <Icon icon="mdi:share-variant" className="h-4 w-4" />
                  </button>
                  <span className={mobileVerticalTooltipClass}>{t("moreMenu.share")}</span>
                </div>
              ) : null}

            </>
          ) : null}
        </div>
        <div className="absolute inset-0 bg-[#f6f7fb] dark:bg-[#070c16]" />
        <div
          className="pointer-events-none absolute inset-0 opacity-60 [background-image:linear-gradient(to_right,rgba(15,23,42,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.06)_1px,transparent_1px)] [background-size:28px_28px] dark:opacity-30 dark:[background-image:linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)]"
        />
        <div className="pointer-events-none absolute inset-0 [mask-image:radial-gradient(closest-side,black,transparent)] bg-[radial-gradient(900px_520px_at_50%_30%,rgba(59,130,246,0.10),transparent_62%)] dark:bg-[radial-gradient(900px_520px_at_50%_30%,rgba(56,189,248,0.10),transparent_62%)]" />

        <div className="absolute inset-0" style={{ overscrollBehavior: "none" }}>
          <div className="h-full w-full rounded-2xl border border-neutral-200/70 bg-white/65 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
            <ClientMindElixir
              ref={mindRef}
              mapId={mapId}
              mode={resolvedTheme === "dark" ? "dark" : "light"}
              editMode={editMode}
              onReady={applyInitialCollapse}
              onOpenSlideshow={handleOpenSlideshow}
              onRegenerateSelectedNode={() => {
                if (regenerateTargetNeedsStructure) {
                  void handleRegenerateSelectedNode("expand");
                  return;
                }
                setRegenerateReasonOpen(true);
              }}
              canRegenerateSelectedNode={canShowRegenerateActions}
              regenerateSelectedNodeLabel={regenerateActionLabel}
              regenerateSelectedNodeLoadingLabel={regenerateLoadingActionLabel}
              regenerateSelectedNodeProminent={regenerateTargetNeedsStructure}
              structureActionNodeIds={structureActionNodeIds}
              structureActionLabel={structureActionLabel}
              regeneratingNodeId={regeneratingNodeId}
              onChange={
                isReadOnlyView
                  ? undefined
                  : (op) => {
                      if (!op?.name) return;
                      if (op.name === "toggleHighlight") {
                        syncMindDataFromMind({
                          persistViewState: true,
                          markLocalChange: true,
                        });
                        scheduleAutoSave();
                        return;
                      }
                      if (op.name === "updateNote") {
                        syncMindDataFromMind({
                          persistViewState: true,
                          markLocalChange: true,
                        });
                        const now = Date.now();
                        if (now - lastHighlightToastRef.current > 2000) {
                          lastHighlightToastRef.current = now;
                          toast.message(t("toasts.savingNote"));
                        }
                        scheduleAutoSave();
                        return;
                      }
                      if (op.name === "updateImage") {
                        syncMindDataFromMind({
                          persistViewState: true,
                          markLocalChange: true,
                        });
                        scheduleAutoSave();
                        return;
                      }
                      if (op.name === "updateRichText") {
                        syncMindDataFromMind({
                          persistViewState: true,
                          markLocalChange: true,
                        });
                        scheduleAutoSave();
                        return;
                      }
                      if (op.name === "expandNode") {
                        syncMindDataFromMind({ persistViewState: true });
                        return;
                      }
                      if (!MUTATING_OPS.has(op.name)) return;
                      syncMindDataFromMind({
                        persistViewState: true,
                        markLocalChange: true,
                      });
                      scheduleAutoSave();
                    }
              }
              onViewModeEditAttempt={
                isSharedView
                  ? () =>
                      toast.message(t("toasts.sharedReadOnly"))
                  : undefined
              }
              theme={
                themeName === DEFAULT_THEME_NAME
                  ? null
                  : themeName === PROFILE_THEME_NAME
                  ? undefined
                  : MIND_THEME_BY_NAME[themeName]
              }
              data={displayMapData ?? undefined}
              loading={loading || isMapGenerating}
              placeholderData={loadingMindElixir}
              showMiniMap={!isTutorialMobile}
              showTimestamps={showTimestamps}
              focusInsetLeft={leftOpen ? LEFT_PANEL_FOCUS_INSET : 0}
              openMenuOnClick={false}
              disableDirectContextMenu
              showSelectionContextMenuButton={!isAdminView}
              showAnnotationAction={!isReadOnlyView}
              showHighlightAction={!isAdminView}
              preferPanModeOnTouch={isSharedView}
              onSelectedNodeChange={(nodeId, details) => {
                setSourceFindNodeSelected(Boolean(nodeId));
                setSelectedMapNodeId(nodeId);
                if (!nodeId) {
                  setSelectedRootChildNodeId(null);
                  return;
                }
                setSelectedRootChildNodeId(details?.isRootChild ? nodeId : null);
              }}
              onReadOnlyHighlight={
                isSharedView
                  ? () =>
                      toast.message(t("toasts.highlightReadOnly"))
                  : undefined
              }
            />
          </div>
        </div>

        {error && (
          <div className="absolute left-4 top-3 z-[15]">
            <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] text-rose-700 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-200">
              <Icon icon="mdi:alert-circle-outline" className="h-3.5 w-3.5" />
              {t("status.fetchError")}
            </span>
          </div>
        )}

        {isMapProcessing && mapData ? (
          <div className="pointer-events-none absolute left-1/2 top-4 z-[18] w-[min(320px,calc(100%-2rem))] -translate-x-1/2">
            <div className="rounded-2xl border border-slate-200/80 bg-white/88 px-4 py-3 shadow-[0_18px_50px_-34px_rgba(15,23,42,0.55)] backdrop-blur-xl dark:border-white/12 dark:bg-[#0f172a]/88">
              <div className="mb-1 flex items-center justify-between gap-3 text-[11px] font-semibold text-slate-600 dark:text-white/65">
                <span className="inline-flex min-w-0 items-center gap-1.5">
                  <Icon icon="mdi:graph-outline" className="h-3.5 w-3.5 shrink-0 text-cyan-600 dark:text-cyan-200" />
                  <span className="truncate">{visibleProcessingTitle}</span>
                </span>
                <span className="shrink-0 tabular-nums text-cyan-600 dark:text-cyan-200">
                  {processingProgressPercent}%
                </span>
              </div>
              <p className="mb-2 truncate text-[10px] font-medium text-slate-500 dark:text-white/50">
                {visibleProcessingDescription}
              </p>
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                <div
                  className="h-full rounded-full bg-cyan-500 transition-[width] duration-700 ease-out dark:bg-cyan-300"
                  style={{ width: `${processingProgressPercent}%` }}
                />
              </div>
            </div>
          </div>
        ) : null}

        {isMapGenerating ? (
          <div className="pointer-events-none absolute inset-0 z-[18] flex items-center justify-center px-5">
            <div className="max-w-[420px] rounded-[28px] border border-slate-200/80 bg-white/88 px-6 py-5 text-center shadow-[0_28px_80px_-42px_rgba(15,23,42,0.55)] backdrop-blur-xl dark:border-white/12 dark:bg-[#0f172a]/88 dark:shadow-[0_34px_90px_-44px_rgba(0,0,0,0.86)]">
              <div className="mx-auto mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-600 dark:bg-cyan-400/12 dark:text-cyan-200">
                <Icon icon="mdi:graph-outline" className="h-5 w-5" />
              </div>
              <div className="text-[17px] font-black tracking-normal text-slate-950 dark:text-white">
                {generatingTitle}
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-white/58">
                {generatingDescription}
              </p>
              <div className="mt-4">
                <div className="mb-1.5 flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-white/55">
                  <span>
                    {locale === "ko"
                      ? "진행률"
                      : locale === "fr"
                      ? "Progression"
                      : "Progress"}
                  </span>
                  <span className="tabular-nums text-cyan-600 dark:text-cyan-200">
                    {processingProgressPercent}%
                  </span>
                </div>
                <div className="mx-auto h-2 w-48 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                  <div
                    className="h-full rounded-full bg-cyan-500 transition-[width] duration-700 ease-out dark:bg-cyan-300"
                    style={{ width: `${processingProgressPercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {draft && (
          <LeftPanel
            open={leftOpen}
            onClose={() => setLeftOpen(false)}
            onEdit={isReadOnlyView ? undefined : () => setShowMetadataDialog(true)}
            onEditTags={isReadOnlyView ? undefined : () => setTagEditOpen(true)}
            onDelete={isReadOnlyView ? undefined : () => setConfirmDeleteOpen(true)}
            deleteLabel={isReadOnlyView ? undefined : t("actions.delete")}
            map={draft}
            mapId={isSharedView ? undefined : isReadOnlyView ? undefined : mapId}
            readOnly={isReadOnlyView}
            sharedNotes={isReadOnlyView ? sharedNotes : undefined}
            sharedTerms={isReadOnlyView ? sharedTerms : undefined}
            mindData={panelMindData}
            onSelectNodeNote={handleSelectNodeNote}
            tab={leftTab}
            onTabChange={setLeftTab}
            termsTabId={FULLSCREEN_PAGE_TERMS_TAB_ID}
            readOnlyBadgeLabel={
              isAdminView
                ? t("readOnlyMode.admin")
                : isSharedView
                ? t("readOnlyMode.shared")
                : undefined
            }
          />
        )}

        {!shouldHideFramedSharedChrome ? (
          <div className="pointer-events-none absolute bottom-4 left-4 z-[22]">
          <div className="hidden pointer-events-auto sm:block">
            <Link
              href={`/${locale}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-sky-200/90 bg-sky-50/95 px-6 py-3.5 text-[18px] font-extrabold tracking-[-0.02em] text-slate-800 shadow-[0_18px_40px_-18px_rgba(15,23,42,0.5)] backdrop-blur-sm transition hover:border-sky-300 hover:bg-sky-100/95 dark:border-white/14 dark:bg-[#0f172a]/90 dark:text-white/88 dark:hover:border-white/22 dark:hover:bg-[#111c31]"
            >
              <Image
                src="/images/newlogo.png"
                alt="Brify logo"
                width={56}
                height={44}
                sizes="56px"
                className="h-11 w-[56px] shrink-0 object-contain"
              />
              <span>{t("brand")}</span>
            </Link>
          </div>
          <div className="pointer-events-auto flex items-center gap-2 sm:hidden">
            <Link
              href={`/${locale}`}
              className="inline-flex items-center gap-1 rounded-full border border-sky-200/90 bg-sky-50/95 px-3.5 py-2 text-[13px] font-extrabold tracking-[-0.02em] text-slate-800 shadow-[0_18px_40px_-18px_rgba(15,23,42,0.5)] backdrop-blur-sm transition hover:border-sky-300 hover:bg-sky-100/95 dark:border-white/14 dark:bg-[#0f172a]/90 dark:text-white/88 dark:hover:border-white/22 dark:hover:bg-[#111c31]"
            >
              <Image
                src="/images/newlogo.png"
                alt="Brify logo"
                width={36}
                height={28}
                sizes="36px"
                className="h-7 w-[36px] shrink-0 object-contain"
              />
              <span>{t("brand")}</span>
            </Link>

            <div className="flex items-center gap-1.5 rounded-full bg-transparent px-2 py-1.5">
              <div className="group relative">
                <button
                  type="button"
                  onClick={() => mindRef.current?.centerMap?.()}
                  className={mobileBottomControlButtonClass}
                  aria-label={mobileCenterLabel}
                  title={mobileCenterLabel}
                >
                  <Icon icon="mdi:crosshairs-gps" className="h-4 w-4" />
                </button>
                <span className={mobileBottomTooltipClass}>{mobileCenterLabel}</span>
              </div>
              <div className="group relative">
                <button
                  type="button"
                  onClick={() => mindRef.current?.zoomIn?.()}
                  className={mobileBottomControlButtonClass}
                  aria-label={mobileZoomInLabel}
                  title={mobileZoomInLabel}
                >
                  <Icon icon="mdi:plus" className="h-4 w-4" />
                </button>
                <span className={mobileBottomTooltipClass}>{mobileZoomInLabel}</span>
              </div>
              <div className="group relative">
                <button
                  type="button"
                  onClick={() => mindRef.current?.zoomOut?.()}
                  className={mobileBottomControlButtonClass}
                  aria-label={mobileZoomOutLabel}
                  title={mobileZoomOutLabel}
                >
                  <Icon icon="mdi:minus" className="h-4 w-4" />
                </button>
                <span className={mobileBottomTooltipClass}>{mobileZoomOutLabel}</span>
              </div>
              <div className="group relative">
                <button
                  type="button"
                  onClick={() => mindRef.current?.collapseOneLevel?.()}
                  className={mobileBottomControlButtonClass}
                  aria-label={mobileCollapseLevelLabel}
                  title={mobileCollapseLevelLabel}
                >
                  <Icon icon="mdi:unfold-less-horizontal" className="h-4 w-4" />
                </button>
                <span className={mobileBottomTooltipClass}>{mobileCollapseLevelLabel}</span>
              </div>
              <div className="group relative">
                <button
                  type="button"
                  onClick={() => mindRef.current?.expandOneLevel?.()}
                  className={mobileBottomControlButtonClass}
                  aria-label={mobileExpandLevelLabel}
                  title={mobileExpandLevelLabel}
                >
                  <Icon icon="mdi:unfold-more-horizontal" className="h-4 w-4" />
                </button>
                <span className={mobileBottomTooltipClass}>{mobileExpandLevelLabel}</span>
              </div>
            </div>
          </div>
          </div>
        ) : null}

        {tutorialOpen && !isEmbeddedFrame ? (
          <MapTutorialOverlay
            stepIndex={tutorialStepIndex}
            steps={tutorialSteps}
            onNext={handleTutorialNext}
            onSkip={() => setTutorialOpen(false)}
          />
        ) : null}

        <ShortcutsDialog
          open={shortcutsOpen}
          onClose={() => setShortcutsOpen(false)}
        />

        {draft ? (
          <TagEditDialog
            open={tagEditOpen}
            onOpenChange={setTagEditOpen}
            draftTitle={draft.title ?? t("selectedMap")}
            initialTags={draft.tags ?? []}
            allTags={allTagNames}
            saving={tagEditSubmitting}
            onSave={handleTagEditSave}
          />
        ) : null}

        {showMetadataDialog && draft ? (
          <MetadataDialog
            mapId={draft.id}
            initial={{
              sourceType: draft.sourceType,
              sourceUrl: draft.sourceUrl ?? "",
              title: draft.title ?? "",
              youtubeTitle: draft.youtubeTitle ?? draft.title ?? "",
              channelName: draft.channelName ?? "",
              tags: draft.tags ?? [],
              description: draft.description ?? "",
              thumbnailUrl: draft.thumbnailUrl ?? "",
            }}
            onClose={() => setShowMetadataDialog(false)}
            onSave={handleSaveMetadata}
            isProcessing={isSavingMeta}
            showYoutubeTitleSync={false}
          />
        ) : null}
      </div>

      {!isReadOnlyView ? (
      <ConfirmDialog
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        onConfirm={() => {
          setConfirmDeleteOpen(false);
          handleDelete();
        }}
        title={t("deleteConfirm.title")}
        description={t("deleteConfirm.description")}
        actionLabel={
          isDeleting ? t("deleteConfirm.actionDeleting") : t("deleteConfirm.action")
        }
        cancelLabel={t("cancel")}
      />
      ) : null}

      {!isReadOnlyView ? (
      <DiscardDraftDialog
        open={confirmDiscardOpen}
        onClose={() => setConfirmDiscardOpen(false)}
        onConfirm={() => {
          setConfirmDiscardOpen(false);
          handleDiscardDraft();
        }}
      />
      ) : null}

      {!isReadOnlyView ? (
      <ShareDialog
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        loading={shareLoading}
        shareEnabled={shareEnabled}
        shareUrl={shareUrl}
        onEnable={handleEnableShare}
        onDisable={handleDisableShare}
        onCopy={handleCopyShare}
      />
      ) : null}

      {sourceFindOpen ? (
        <div
          className={`pointer-events-none fixed inset-x-2 bottom-2 z-[220] sm:inset-x-auto sm:bottom-auto sm:right-5 sm:top-[calc(var(--header-h)+16px)] ${
            sourceFindExpanded
              ? "sm:w-[720px] sm:max-w-[min(96vw,720px)]"
              : "sm:w-[500px] sm:max-w-[min(92vw,500px)]"
          }`}
        >
          <div
            data-source-find-panel="true"
            className={`pointer-events-auto flex ${
              sourceFindExpanded ? "h-[92vh]" : "h-[78vh]"
            } max-h-[760px] min-h-[420px] flex-col overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-[0_26px_80px_-42px_rgba(15,23,42,0.55)] dark:border-white/10 dark:bg-[#0b1220] dark:shadow-[0_30px_90px_-48px_rgba(0,0,0,0.9)] sm:h-auto sm:max-h-[calc(100vh-var(--header-h)-32px)] sm:min-h-0`}
            aria-label={t("sourceFind.title")}
          >
            <div className="flex h-9 shrink-0 items-center justify-between border-b border-slate-200 px-4 dark:border-white/10">
              <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                {t("sourceFind.viewTitle")}
              </div>
              <button
                type="button"
                onClick={() => setSourceFindOpen(false)}
                className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-800 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
                aria-label={t("cancel")}
                title={t("cancel")}
              >
                <Icon icon="lucide:x" className="h-4 w-4" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto bg-white px-5 py-4 dark:bg-[#060b13]">
              <div className="flex flex-col gap-4">
              {sourceFindLoading ? (
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  {t("sourceFind.loading")}
                </p>
              ) : sourceFindStatus === "found" ? (
                <>
                  {sourceFindFullText ? (
                    <div className="space-y-3">
                      {(() => {
                        const windowStart = Math.max(0, Math.min(sourceFindViewStart, sourceFindFullText.length));
                        const windowEnd = Math.max(windowStart, Math.min(sourceFindViewEnd, sourceFindFullText.length));
                        const active = sourceFindCandidates[sourceFindActiveIndex] ?? null;
                        const activeStart = active ? Math.max(0, active.start) : -1;
                        const activeEnd = active ? Math.max(activeStart, active.end) : -1;
                        const sliceStart = windowStart;
                        const sliceEnd = windowEnd;
                        const highlightStart = active && activeStart < sliceEnd && activeEnd > sliceStart
                          ? Math.max(activeStart, sliceStart)
                          : -1;
                        const highlightEnd = highlightStart >= 0
                          ? Math.min(activeEnd, sliceEnd)
                          : -1;
                        const fullSliceText = sourceFindFullText.slice(sliceStart, sliceEnd);
                        const activeLocalStart = highlightStart >= 0 ? highlightStart - sliceStart : -1;
                        const activeLocalEnd = highlightEnd >= 0 ? highlightEnd - sliceStart : -1;
                        const keyTerms = [
                          ...(sourceFindLastAnchors?.anchorText ?? []),
                          ...(sourceFindLastAnchors?.anchorKeywords ?? []),
                        ];
                        const intervals = buildHighlightIntervals(
                          fullSliceText,
                          keyTerms,
                          activeLocalStart,
                          activeLocalEnd,
                          sourceFindExpandFlash
                            ? Math.max(
                                0,
                                Math.min(
                                  fullSliceText.length,
                                  sourceFindExpandFlash.start - sliceStart
                                )
                              )
                            : -1,
                          sourceFindExpandFlash
                            ? Math.max(
                                0,
                                Math.min(
                                  fullSliceText.length,
                                  sourceFindExpandFlash.end - sliceStart
                                )
                              )
                            : -1
                        );
                        return (
                          <div
                            className={sourceTextBoxClassName}
                            style={{
                              ...sourceReadingFont.style,
                              fontSize: `${sourceFindFontSize}px`,
                              lineHeight: 1.5,
                            }}
                          >
                            {renderReadableSourceText(
                              fullSliceText,
                              intervals,
                              sourceFindHighlightRef
                            )}
                          </div>
                        );
                      })()}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs text-slate-500 dark:text-slate-300">
                        <button
                          type="button"
                          onClick={() => {
                            setSourceFindViewStart((prev) => {
                              const next = Math.max(0, prev - SOURCE_VIEW_STEP);
                              if (next < prev) {
                                setSourceFindExpandFlash({
                                  start: next,
                                  end: prev,
                                  key: Date.now(),
                                });
                              }
                              return next;
                            });
                          }}
                          className="rounded-md px-2 py-1 font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
                        >
                          {t("sourceFind.showMoreAbove")}
                        </button>
                        <span className="mx-1 h-4 w-px bg-slate-200 dark:bg-white/10" />
                        <button
                          type="button"
                          onClick={() => handleMoveSourceCandidate(-1)}
                          disabled={sourceFindCandidates.length <= 1}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 disabled:opacity-35 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
                          aria-label={t("actions.previousSearchResult")}
                          title={t("actions.previousSearchResult")}
                        >
                          <Icon icon="mdi:chevron-up" className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveSourceCandidate(1)}
                          disabled={sourceFindCandidates.length <= 1}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 disabled:opacity-35 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
                          aria-label={t("actions.nextSearchResult")}
                          title={t("actions.nextSearchResult")}
                        >
                          <Icon icon="mdi:chevron-down" className="h-4 w-4" />
                        </button>
                        <span className="mx-1 h-4 w-px bg-slate-200 dark:bg-white/10" />
                        <button
                          type="button"
                          onClick={() =>
                            setSourceFindFontSize((prev) =>
                              Math.max(SOURCE_FIND_MIN_FONT_SIZE, prev - 1)
                            )
                          }
                          className="rounded-md px-2 py-1 font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
                        >
                          A-
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setSourceFindFontSize((prev) =>
                              Math.min(SOURCE_FIND_MAX_FONT_SIZE, prev + 1)
                            )
                          }
                          className="rounded-md px-2 py-1 font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
                        >
                          A+
                        </button>
                        <button
                          type="button"
                          onClick={() => setSourceFindExpanded((prev) => !prev)}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
                          aria-label={
                            sourceFindExpanded
                              ? t("sourceFind.viewCompact")
                              : t("sourceFind.viewExpanded")
                          }
                          title={
                            sourceFindExpanded
                              ? t("sourceFind.viewCompact")
                              : t("sourceFind.viewExpanded")
                          }
                        >
                          <Icon
                            icon={
                              sourceFindExpanded
                                ? "lucide:minimize-2"
                                : "lucide:maximize-2"
                            }
                            className="h-3.5 w-3.5"
                          />
                        </button>
                        <span className="mx-1 h-4 w-px bg-slate-200 dark:bg-white/10" />
                        <button
                          type="button"
                          onClick={() =>
                            setSourceFindViewEnd((prev) => {
                              const next = Math.min(
                                sourceFindFullText.length,
                                prev + SOURCE_VIEW_STEP
                              );
                              if (next > prev) {
                                setSourceFindExpandFlash({
                                  start: prev,
                                  end: next,
                                  key: Date.now(),
                                });
                              }
                              return next;
                            })
                          }
                          className="rounded-md px-2 py-1 font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
                        >
                          {t("sourceFind.showMoreBelow")}
                        </button>
                      </div>
                      <div className="text-xs leading-5 text-slate-400 dark:text-slate-400">
                        {t("sourceFind.selectedNode", {
                          topic: sourceFindNodeTopic || "-",
                        })}
                        {sourceFindCandidates.length > 0
                          ? ` · ${sourceFindActiveIndex + 1}/${
                              sourceFindCandidates.length
                            }`
                          : ` · ${t("sourceFind.counterEmpty")}`}
                      </div>
                    </div>
                  ) : null}
                  {(sourceFindLastAnchors?.anchorText?.length ||
                    sourceFindLastAnchors?.anchorKeywords?.length) ? (
                    <details className="pt-1 text-xs text-slate-600 dark:text-slate-300">
                      <summary className="cursor-pointer select-none font-semibold text-slate-500 dark:text-slate-300">
                        {t("sourceFind.criteriaTitle")}
                      </summary>
                      <div className="mt-2 flex flex-col gap-1 leading-5">
                        {sourceFindLastAnchors?.anchorText?.length ? (
                          <p>
                            {t("sourceFind.anchorTextLabel")}:{" "}
                            {sourceFindLastAnchors.anchorText.join(" · ")}
                          </p>
                        ) : null}
                        {sourceFindLastAnchors?.anchorKeywords?.length ? (
                          <p>
                            {t("sourceFind.anchorKeywordsLabel")}:{" "}
                            {sourceFindLastAnchors.anchorKeywords.join(", ")}
                          </p>
                        ) : null}
                      </div>
                    </details>
                  ) : null}
                </>
              ) : (
                <div className="space-y-2">
                  <p className="border-b border-slate-200 pb-3 text-sm font-medium text-slate-700 dark:border-white/10 dark:text-slate-200">
                    {sourceFindMessage || t("sourceFind.notFound")}
                  </p>
                  <p className="text-sm leading-6 text-slate-500 dark:text-slate-300">
                    {t("sourceFind.editAnchorGuide")}
                  </p>
                  <div className="flex flex-col gap-2">
                    <textarea
                      value={sourceFindManualAnchor}
                      onChange={(e) => setSourceFindManualAnchor(e.target.value)}
                      rows={2}
                      placeholder={t("sourceFind.editAnchorPlaceholder")}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-100 dark:focus:border-white/25 dark:focus:ring-white/[0.06]"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => void handleRetrySourceFindWithManualAnchor()}
                        disabled={sourceFindLoading}
                        className="inline-flex items-center rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                      >
                        {t("sourceFind.editAnchorAction")}
                      </button>
                      {sourceFindFullText ? (
                        <button
                          type="button"
                          onClick={() => {
                            setSourceFindViewStart(0);
                            setSourceFindViewEnd(sourceFindFullText.length);
                          }}
                          className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300 dark:hover:bg-white/[0.08] dark:hover:text-white"
                        >
                          {t("sourceFind.showFullSource")}
                        </button>
                      ) : null}
                    </div>
                  </div>
                  {sourceFindFullText ? (
                    <div
                      className={sourceTextBoxClassName}
                      style={{
                        ...sourceReadingFont.style,
                        fontSize: `${sourceFindFontSize}px`,
                        lineHeight: 1.5,
                      }}
                    >
                      {renderReadableSourceText(
                        sourceFindFullText.slice(
                          Math.max(0, sourceFindViewStart),
                          Math.min(sourceFindFullText.length, sourceFindViewEnd || sourceFindFullText.length)
                        ),
                        [],
                        sourceFindHighlightRef
                      )}
                    </div>
                  ) : null}
                </div>
              )}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <MapSlideshowDialog
        open={slideshowOpen}
        slides={slideshowSlides}
        onClose={() => setSlideshowOpen(false)}
      />

    </div>
  );
}
