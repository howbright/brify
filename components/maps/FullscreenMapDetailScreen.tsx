"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
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
import MapMetadataEditDialog from "@/components/maps/MapMetadataEditDialog";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import DiscardDraftDialog from "@/components/maps/DiscardDraftDialog";
import ShareDialog from "@/components/maps/ShareDialog";
import ShortcutsDialog from "@/components/maps/ShortcutsDialog";
import TagEditDialog from "@/components/maps/TagEditDialog";
import { createClient } from "@/utils/supabase/client";
import type { Database } from "@/app/types/database.types";
import type { MapDraft, MapJobStatus } from "@/app/[locale]/(main)/video-to-map/types";
import { loadingMindElixir } from "@/app/lib/mind-elixir/sampleData";
import {
  getMapTutorialCompleted,
  setMapTutorialCompleted,
} from "@/app/lib/mapTutorialState";
import { useMindThemePreference } from "@/components/maps/MindThemePreferenceProvider";
import FullscreenHeader from "@/components/maps/FullscreenHeader";

type MindNode = {
  children?: MindNode[];
  expanded?: boolean;
  ts?: unknown;
};

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

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function collapseToLevel(node: MindNode, level: number, depth = 0) {
  node.expanded = depth < level;
  node.children?.forEach((child) => collapseToLevel(child, level, depth + 1));
}

function collapseAllDescendants(node: MindNode, depth = 0) {
  node.expanded = depth === 0;
  node.children?.forEach((child) => collapseAllDescendants(child, depth + 1));
}

function getInitialCollapsedMapData<T>(raw: T): T {
  if (!raw || typeof raw !== "object") return raw;
  const cloned = cloneJson(raw) as T & { nodeData?: MindNode };
  const root = cloned?.nodeData;
  if (!root) return cloned;
  collapseToLevel(root, 2);
  return cloned;
}

function getInitialFullyCollapsedMapData<T>(raw: T): T {
  if (!raw || typeof raw !== "object") return raw;
  const cloned = cloneJson(raw) as T & { nodeData?: MindNode };
  const root = cloned?.nodeData;
  if (!root) return cloned;
  collapseAllDescendants(root);
  return cloned;
}

type MapRow = Database["public"]["Tables"]["maps"]["Row"];

function coerceMapStatus(status?: string | null): MapJobStatus {
  if (status === "done" || status === "failed" || status === "processing") {
    return status;
  }
  return "processing";
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

function detectSourceType(sourceUrl?: string) {
  if (!sourceUrl) return "manual" as const;
  const lowered = sourceUrl.toLowerCase();
  if (lowered.includes("youtube.com") || lowered.includes("youtu.be")) {
    return "youtube" as const;
  }
  return "website" as const;
}

function toFileSafeName(value: string) {
  return value.replace(/[\\/:*?"<>|]+/g, "-").trim();
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

const FULLSCREEN_PAGE_TERMS_TAB_ID = "fullscreen-page-terms-tab";
const FULLSCREEN_PAGE_LEFT_PANEL_BUTTON_ID = "fullscreen-page-left-panel-button";
const LEFT_PANEL_FOCUS_INSET = 560;

function toDraft(row: MapRow): MapDraft {
  return {
    id: row.id,
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: row.updated_at ? new Date(row.updated_at).getTime() : undefined,
    sourceUrl: row.source_url ?? undefined,
    sourceType: row.source_type ?? undefined,
    title: row.title ?? "Untitled",
    shortTitle: row.short_title ?? undefined,
    channelName: row.channel_name ?? undefined,
    thumbnailUrl: row.thumbnail_url ? withCacheBuster(row.thumbnail_url) : undefined,
    tags: Array.isArray(row.tags) ? row.tags : [],
    description: row.description ?? undefined,
    summary: row.summary ?? undefined,
    status: coerceMapStatus(row.map_status),
    creditsCharged:
      typeof row.credits_charged === "number" ? row.credits_charged : undefined,
  };
}

type FullscreenMapDetailScreenProps = {
  mapId: string;
  locale: string;
  sourceTab?: string | null;
  accessMode?: "user" | "admin";
};

type AdminInspectMapResponse = {
  id: string;
  title: string;
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
}: FullscreenMapDetailScreenProps) {
  const t = useTranslations("FullscreenMapPage");
  const tTutorial = useTranslations("MapTutorial");
  const isTutorialMobile = useTutorialIsMobile();
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const { profileThemeName } = useMindThemePreference();
  const backToMapsUrl =
    accessMode === "admin"
      ? `/${locale}/admin/users/maps`
      : sourceTab === "notes" || sourceTab === "terms"
      ? `/${locale}/maps?tab=${sourceTab}`
      : `/${locale}/maps`;
  const isAdminView = accessMode === "admin";

  const [draft, setDraft] = useState<MapDraft | null>(null);
  const [mapData, setMapData] = useState<MapRow["mind_elixir"] | null>(null);
  const [hasDraft, setHasDraft] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [leftOpen, setLeftOpen] = useState(false);
  const [leftTab, setLeftTab] = useState<"info" | "notes" | "terms">("info");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Array<{ id: string; text: string }>>([]);
  const [searchIndex, setSearchIndex] = useState(0);
  const searchIndexRef = useRef(0);
  const lastStepAtRef = useRef(0);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const editMode: "view" | "edit" = isAdminView ? "view" : "edit";
  const panMode = false;
  const [themeName, setThemeName] = useState<string>(
    profileThemeName ? PROFILE_THEME_NAME : DEFAULT_THEME_NAME
  );
  const themeInitRef = useRef(false);
  const themeOptions = useMemo(
    () => [{ name: PROFILE_THEME_NAME }, { name: DEFAULT_THEME_NAME }, ...MIND_THEMES],
    []
  );
  const mindRef = useRef<ClientMindElixirHandle | null>(null);
  const centeredOnceRef = useRef(false);
  const pendingRecenterRef = useRef(false);
  const [showMetadataDialog, setShowMetadataDialog] = useState(false);
  const [isSavingMeta, setIsSavingMeta] = useState(false);
  const [tagEditOpen, setTagEditOpen] = useState(false);
  const [tagEditSubmitting, setTagEditSubmitting] = useState(false);
  const [allTagNames, setAllTagNames] = useState<string[]>([]);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [savedPulse, setSavedPulse] = useState(false);
  const autoSaveTimerRef = useRef<number | null>(null);
  const lastSavedDraftRef = useRef<string | null>(null);
  const lastAutoSaveErrorRef = useRef<number>(0);
  const lastHighlightToastRef = useRef(0);
  const savedPulseTimerRef = useRef<number | null>(null);
  const [confirmDiscardOpen, setConfirmDiscardOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareEnabled, setShareEnabled] = useState(false);
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [desktopMoreOpen, setDesktopMoreOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [mobileMapActionsOpen, setMobileMapActionsOpen] = useState(false);
  const [mobileThemeOpen, setMobileThemeOpen] = useState(false);
  const [mobileToolbarCollapsed, setMobileToolbarCollapsed] = useState(false);
  const [showTimestamps, setShowTimestamps] = useState(true);
  const desktopMoreRef = useRef<HTMLDivElement | null>(null);
  const mobileMapActionsRef = useRef<HTMLDivElement | null>(null);
  const mobileThemeRef = useRef<HTMLDivElement | null>(null);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [tutorialStepIndex, setTutorialStepIndex] = useState(0);
  const initializedMapIdRef = useRef<string | null>(null);

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
      ]),
    []
  );

  useEffect(() => {
    if (!mapId) return;

    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        if (isAdminView) {
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
          setMapData(data.mindElixir);
          setThemeName(profileThemeName ? PROFILE_THEME_NAME : DEFAULT_THEME_NAME);
          themeInitRef.current = true;
        } else {
          const supabase = createClient();
          const { data, error } = await supabase
            .from("maps")
            .select(
              "id,created_at,updated_at,title,short_title,channel_name,source_url,source_type,tags,description,summary,thumbnail_url,map_status,credits_charged,mind_elixir,mind_elixir_draft,mind_theme_override"
            )
            .eq("id", mapId)
            .single();

          if (cancelled) return;
          if (error) throw error;

          const row = data as MapRow;
          setDraft(toDraft(row));

          const draftMind = row?.mind_elixir_draft ?? null;
          const mind = row?.mind_elixir ?? null;
          const effectiveMind = draftMind ?? mind ?? null;

          setHasDraft(Boolean(draftMind));
          if (!effectiveMind) {
            throw new Error("mind_elixir 데이터가 없습니다.");
          }
          setMapData(effectiveMind);

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
        setHasDraft(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAdminView, mapId, profileThemeName]);

  useEffect(() => {
    if (loading || !draft) return;
    if (initializedMapIdRef.current === draft.id) return;
    initializedMapIdRef.current = draft.id;
    setLeftOpen(!isTutorialMobile);
    const tutorialCompleted = getMapTutorialCompleted(
      isTutorialMobile ? "mobile" : "desktop"
    );
    setTutorialOpen(!tutorialCompleted);
    setTutorialStepIndex(0);
  }, [loading, draft?.id, isTutorialMobile]);

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
    if (!themeInitRef.current) {
      setThemeName(profileThemeName ? PROFILE_THEME_NAME : DEFAULT_THEME_NAME);
      themeInitRef.current = true;
      return;
    }
    if (!profileThemeName && themeName === PROFILE_THEME_NAME) {
      setThemeName(DEFAULT_THEME_NAME);
    }
  }, [profileThemeName, themeName]);

  const title = useMemo(
    () => draft?.shortTitle ?? draft?.title ?? t("fallbackTitle"),
    [draft?.shortTitle, draft?.title, t]
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
  useEffect(() => {
    if (isTutorialMobile) {
      setMobileToolbarCollapsed(false);
    }
  }, [isTutorialMobile]);
  const initialMapData = useMemo(
    () =>
      isTutorialMobile
        ? getInitialFullyCollapsedMapData(mapData ?? null)
        : getInitialCollapsedMapData(mapData ?? null),
    [mapData, isTutorialMobile]
  );
  const hasTimestampNodes = useMemo(
    () => hasValidTimestampInMindData(mapData ?? null),
    [mapData]
  );

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
    searchInputRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    if (!desktopMoreOpen && !mobileMapActionsOpen && !mobileThemeOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (desktopMoreOpen && desktopMoreRef.current?.contains(target)) {
        return;
      }
      if (mobileMapActionsOpen && mobileMapActionsRef.current?.contains(target)) {
        return;
      }
      if (mobileThemeOpen && mobileThemeRef.current?.contains(target)) {
        return;
      }
      setMobileMapActionsOpen(false);
      setMobileThemeOpen(false);
      setDesktopMoreOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [desktopMoreOpen, mobileMapActionsOpen, mobileThemeOpen]);

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverscrollX = html.style.overscrollBehaviorX;
    const prevBodyOverscrollX = body.style.overscrollBehaviorX;

    html.style.overscrollBehaviorX = "none";
    body.style.overscrollBehaviorX = "none";

    return () => {
      html.style.overscrollBehaviorX = prevHtmlOverscrollX;
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
      const snapshot = mindRef.current?.getSnapshot?.();
      if (!snapshot) return;
      const payload = JSON.stringify(snapshot);
      if (payload === lastSavedDraftRef.current) return;

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
        setIsSavingDraft(false);
      }
    }, 1200);
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

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = json?.message || json?.error || "요청 실패";
        throw new Error(typeof msg === "string" ? msg : msg?.[0] || "요청 실패");
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
    sourceUrl?: string;
    title: string;
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
          short_title: meta.title,
          description: meta.description,
          tags: meta.tags ?? [],
          thumbnail_url: meta.thumbnailUrl,
          channel_name: meta.channelName,
          source_type: detectSourceType(meta.sourceUrl),
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
          "id,created_at,updated_at,title,short_title,channel_name,source_url,source_type,tags,description,thumbnail_url,map_status,credits_charged"
        )
        .eq("id", mapId)
        .single();

      if (error) throw error;
      if (data) {
        setDraft(toDraft(data as MapRow));
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
    if (!shareToken) return null;
    if (typeof window === "undefined") return null;
    const origin = window.location.origin;
    return `${origin}/${locale}/share/${encodeURIComponent(shareToken)}`;
  }, [shareToken, locale]);

  const statusLabel = isSavingDraft
    ? t("draftStatus.autoSaving")
    : savedPulse
    ? t("draftStatus.saved")
    : hasDraft
    ? t("draftStatus.hasDraft")
    : undefined;
  const statusTone = isSavingDraft ? "warning" : savedPulse ? "success" : "neutral";
  const controlIconButtonClass =
    "inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/80 bg-white/88 text-slate-600 shadow-[0_10px_26px_-18px_rgba(15,23,42,0.18)] backdrop-blur-sm transition hover:bg-white hover:text-slate-900 dark:border-white/10 dark:bg-[#0f172a]/82 dark:text-white/78 dark:shadow-[0_18px_40px_-26px_rgba(2,6,23,0.72)] dark:hover:bg-[#162033] dark:hover:text-white";
  const controlPanelClass =
    "rounded-2xl border border-slate-200/80 bg-white/95 p-1.5 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.24)] backdrop-blur-md dark:border-white/10 dark:bg-[#0f172a]/95 dark:shadow-[0_22px_52px_-28px_rgba(2,6,23,0.92)]";
  const controlMenuItemClass =
    "w-full rounded-xl px-3 py-2 text-left text-[12px] font-semibold text-slate-700 transition hover:bg-slate-100/90 hover:text-slate-900 dark:text-white/80 dark:hover:bg-white/10 dark:hover:text-white";
  const controlMenuItemContentClass = "flex items-center gap-2.5";
  const secondaryControlPillClass =
    "inline-flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white/90 px-3.5 text-[11px] font-semibold text-slate-700 shadow-[0_10px_26px_-18px_rgba(15,23,42,0.16)] backdrop-blur-sm transition hover:bg-white hover:text-slate-900 dark:border-white/10 dark:bg-[#0f172a]/84 dark:text-white/76 dark:shadow-[0_18px_40px_-28px_rgba(2,6,23,0.78)] dark:hover:bg-[#162033] dark:hover:text-white";
  const primaryControlPillClass =
    "inline-flex items-center gap-1.5 rounded-xl bg-[linear-gradient(135deg,#2563eb_0%,#1d4ed8_100%)] px-3.5 text-[11px] font-semibold text-white shadow-[0_14px_30px_-18px_rgba(37,99,235,0.5)] transition hover:shadow-[0_18px_34px_-18px_rgba(37,99,235,0.62)] dark:bg-[linear-gradient(135deg,#3b82f6_0%,#2563eb_100%)]";
  const searchShellClass =
    "relative z-[40] flex h-8 w-[228px] items-center gap-2 rounded-lg border border-slate-400 bg-white px-2.5 text-[11px] text-slate-700 shadow-[0_8px_20px_-18px_rgba(15,23,42,0.14)] dark:border-white/28 dark:bg-[#0b1220] dark:text-white dark:shadow-[0_16px_36px_-30px_rgba(2,6,23,0.7)]";
  const plainHeaderIconButtonClass =
    "inline-flex h-8 w-8 items-center justify-center text-slate-500 transition hover:text-slate-900 dark:text-white/65 dark:hover:text-white";

  return (
    <div className="fixed inset-0 z-[120] bg-white dark:bg-[#0b1220] [--header-h:68px]">
      <FullscreenHeader
        title={title}
        onClose={() => router.push(backToMapsUrl)}
        closeLabel={t("actions.closeMap")}
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
          <div className="hidden sm:flex items-center gap-1.5">
            {!isAdminView && statusLabel ? (
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
            {!isAdminView && hasDraft ? (
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
            <button
              type="button"
              onClick={() => setShowTimestamps((prev) => !prev)}
              className={plainHeaderIconButtonClass}
              aria-label={
                showTimestamps
                  ? t("moreMenu.hideTimestamps")
                  : t("moreMenu.showTimestamps")
              }
              title={
                showTimestamps
                  ? t("moreMenu.hideTimestamps")
                  : t("moreMenu.showTimestamps")
              }
            >
              <Icon
                icon={
                  showTimestamps
                    ? "mdi:timeline-clock-outline"
                    : "mdi:timeline-clock-outline"
                }
                className={`h-4 w-4 ${showTimestamps ? "text-sky-700 dark:text-sky-200" : ""}`}
              />
            </button>
            <button
              type="button"
              onClick={() => {
                setTutorialStepIndex(0);
                setTutorialOpen(true);
              }}
              className={plainHeaderIconButtonClass}
              aria-label={t("actions.tutorial")}
              title={t("actions.tutorial")}
            >
              <Icon icon="mdi:school-outline" className="h-4 w-4" />
            </button>
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
                <div className={`absolute right-0 mt-2 w-[210px] ${controlPanelClass}`}>
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
                      )})}
                    </div>
                  </div>
                  <div className="my-1 h-px bg-neutral-200 dark:bg-white/10" />
                  {hasTimestampNodes ? (
                    <button
                      type="button"
                      onClick={() => {
                        setDesktopMoreOpen(false);
                        setShowTimestamps((prev) => !prev);
                      }}
                      className={controlMenuItemClass}
                    >
                      {showTimestamps
                        ? t("moreMenu.hideTimestamps")
                        : t("moreMenu.showTimestamps")}
                    </button>
                  ) : null}
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
                      setShortcutsOpen(true);
                    }}
                    className={controlMenuItemClass}
                  >
                    <span className={controlMenuItemContentClass}>
                      <Icon icon="mdi:keyboard-outline" className="h-4 w-4 shrink-0 text-slate-400 dark:text-white/50" />
                      <span>{t("moreMenu.shortcuts")}</span>
                    </span>
                  </button>
                  {!isAdminView ? (
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
        }
      />

      <div className="relative w-full" style={{ height: "calc(100% - var(--header-h))" }}>
        <div className="pointer-events-auto absolute right-3 top-3 z-[25] flex flex-col gap-2 sm:hidden">
          <button
            type="button"
            onClick={() => {
              setMobileToolbarCollapsed((v) => !v);
              setMobileMapActionsOpen(false);
              setMobileThemeOpen(false);
            }}
            className={controlIconButtonClass}
            aria-label={mobileToolbarCollapsed ? "도구 펼치기" : "도구 접기"}
            title={mobileToolbarCollapsed ? "도구 펼치기" : "도구 접기"}
          >
            <Icon
              icon={mobileToolbarCollapsed ? "mdi:chevron-left" : "mdi:chevron-right"}
              className="h-4 w-4"
            />
          </button>
          {!mobileToolbarCollapsed ? (
            <>
              <button
                type="button"
                onClick={() => mindRef.current?.centerMap?.()}
                className={controlIconButtonClass}
                aria-label="가운데로"
                title="가운데로"
              >
                <Icon icon="mdi:crosshairs-gps" className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => mindRef.current?.zoomIn?.()}
                className={controlIconButtonClass}
                aria-label="확대"
                title="확대"
              >
                <Icon icon="mdi:plus" className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => mindRef.current?.zoomOut?.()}
                className={controlIconButtonClass}
                aria-label="축소"
                title="축소"
              >
                <Icon icon="mdi:minus" className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => mindRef.current?.collapseAll?.()}
                className={controlIconButtonClass}
                aria-label="전체 접기"
                title="전체 접기"
              >
                <Icon icon="mdi:collapse-all-outline" className="h-4 w-4" />
              </button>
              <div className="relative" ref={mobileMapActionsRef}>
                <button
                  type="button"
                  onClick={() => setMobileMapActionsOpen((v) => !v)}
                  className={controlIconButtonClass}
                  aria-label="맵 조작"
                  title="맵 조작"
                >
                  <Icon icon="mdi:vector-polyline" className="h-4 w-4" />
                </button>

            {mobileMapActionsOpen && (
              <div className={`absolute right-full mr-2 top-0 w-[160px] ${controlPanelClass}`}>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMapActionsOpen(false);
                    mindRef.current?.expandAll?.();
                  }}
                  className={controlMenuItemClass}
                >
                  전체 펴기
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMapActionsOpen(false);
                    mindRef.current?.expandOneLevel?.();
                  }}
                  className={controlMenuItemClass}
                >
                  한단계 펴기
                </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMapActionsOpen(false);
                      mindRef.current?.collapseOneLevel?.();
                    }}
                    className={controlMenuItemClass}
                  >
                    한단계 접기
                  </button>
                  <div className="my-1 h-px bg-neutral-200 dark:bg-white/10" />
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMapActionsOpen(false);
                      mindRef.current?.setLayout?.("left");
                    }}
                    className={controlMenuItemClass}
                  >
                    왼쪽 정렬
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMapActionsOpen(false);
                      mindRef.current?.setLayout?.("right");
                    }}
                    className={controlMenuItemClass}
                  >
                    오른쪽 정렬
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMapActionsOpen(false);
                      mindRef.current?.setLayout?.("side");
                    }}
                    className={controlMenuItemClass}
                  >
                    가운데 정렬
                </button>
              </div>
            )}
              </div>

              <div className="relative" ref={mobileThemeRef}>
                <button
                  type="button"
                  onClick={() => setMobileThemeOpen((v) => !v)}
                  className={controlIconButtonClass}
                  aria-label="테마"
                  title="테마"
                >
                  <Icon icon="mdi:palette-outline" className="h-4 w-4" />
                </button>
                {mobileThemeOpen && (
                  <div className={`absolute right-full mr-2 top-0 w-[180px] p-2 ${controlPanelClass}`}>
                    <div className="text-[11px] font-semibold text-slate-500 dark:text-white/60">
                      테마
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

              <button
                type="button"
                onClick={handleExportPng}
                className={controlIconButtonClass}
                aria-label="PNG 저장"
                title="PNG 저장"
              >
                <Icon icon="mdi:download" className="h-4 w-4" />
              </button>

              {!isAdminView ? (
                <button
                  type="button"
                  onClick={() => {
                    setShareOpen(true);
                    void fetchShareStatus();
                  }}
                  className={controlIconButtonClass}
                  aria-label="공유"
                  title="공유"
                >
                  <Icon icon="mdi:share-variant" className="h-4 w-4" />
                </button>
              ) : null}

              <button
                type="button"
                onClick={() => {
                  setTutorialStepIndex(0);
                  setTutorialOpen(true);
                }}
                className={controlIconButtonClass}
                aria-label={t("actions.tutorial")}
                title={t("actions.tutorial")}
              >
                <Icon icon="mdi:school-outline" className="h-4 w-4" />
              </button>

            </>
          ) : null}
        </div>
        <div className="absolute inset-0 bg-[#f6f7fb] dark:bg-[#070c16]" />
        <div
          className="pointer-events-none absolute inset-0 opacity-60 [background-image:linear-gradient(to_right,rgba(15,23,42,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.06)_1px,transparent_1px)] [background-size:28px_28px] dark:opacity-30 dark:[background-image:linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)]"
        />
        <div className="pointer-events-none absolute inset-0 [mask-image:radial-gradient(closest-side,black,transparent)] bg-[radial-gradient(900px_520px_at_50%_30%,rgba(59,130,246,0.10),transparent_62%)] dark:bg-[radial-gradient(900px_520px_at_50%_30%,rgba(56,189,248,0.10),transparent_62%)]" />

        <div className="absolute inset-0">
          <div className="h-full w-full rounded-2xl border border-neutral-200/70 bg-white/65 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
            <ClientMindElixir
              ref={mindRef}
              mode={resolvedTheme === "dark" ? "dark" : "light"}
              editMode={editMode}
              onChange={(op) => {
                if (!op?.name) return;
                if (op.name === "toggleHighlight") {
                  scheduleAutoSave();
                  return;
                }
                if (op.name === "updateNote") {
                  const now = Date.now();
                  if (now - lastHighlightToastRef.current > 2000) {
                    lastHighlightToastRef.current = now;
                    toast.message("노트 변경을 저장 중...");
                  }
                  scheduleAutoSave();
                  return;
                }
                if (!MUTATING_OPS.has(op.name)) return;
                scheduleAutoSave();
              }}
              theme={
                themeName === DEFAULT_THEME_NAME
                  ? null
                  : themeName === PROFILE_THEME_NAME
                  ? undefined
                  : MIND_THEME_BY_NAME[themeName]
              }
              data={initialMapData ?? undefined}
              loading={loading}
              placeholderData={loadingMindElixir}
              showMiniMap={!isTutorialMobile}
              showTimestamps={showTimestamps}
              focusInsetLeft={leftOpen ? LEFT_PANEL_FOCUS_INSET : 0}
              openMenuOnClick={false}
              disableDirectContextMenu
              showSelectionContextMenuButton
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

        {draft && (
          <LeftPanel
            open={leftOpen}
            onClose={() => setLeftOpen(false)}
            onEdit={isAdminView ? undefined : () => setShowMetadataDialog(true)}
            onEditTags={isAdminView ? undefined : () => setTagEditOpen(true)}
            onDelete={isAdminView ? undefined : () => setConfirmDeleteOpen(true)}
            deleteLabel={isAdminView ? undefined : t("actions.delete")}
            map={draft}
            mapId={isAdminView ? undefined : mapId}
            mindData={mapData}
            onSelectNodeNote={handleSelectNodeNote}
            tab={leftTab}
            onTabChange={setLeftTab}
            termsTabId={FULLSCREEN_PAGE_TERMS_TAB_ID}
          />
        )}

        {tutorialOpen ? (
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
            draftTitle={draft.shortTitle ?? draft.title ?? t("selectedMap")}
            initialTags={draft.tags ?? []}
            allTags={allTagNames}
            saving={tagEditSubmitting}
            onSave={handleTagEditSave}
          />
        ) : null}

        {showMetadataDialog && draft && (
          <MapMetadataEditDialog
            mapId={draft.id}
            initial={{
              sourceUrl: draft.sourceUrl ?? "",
              title: draft.shortTitle ?? draft.title ?? "",
              channelName: draft.channelName ?? "",
              tags: draft.tags ?? [],
              description: draft.description ?? "",
              thumbnailUrl: draft.thumbnailUrl ?? "",
            }}
            onClose={() => setShowMetadataDialog(false)}
            onSave={handleSaveMetadata}
            saving={isSavingMeta}
          />
        )}
      </div>

      {!isAdminView ? (
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
      />
      ) : null}

      {!isAdminView ? (
      <DiscardDraftDialog
        open={confirmDiscardOpen}
        onClose={() => setConfirmDiscardOpen(false)}
        onConfirm={() => {
          setConfirmDiscardOpen(false);
          handleDiscardDraft();
        }}
      />
      ) : null}

      {!isAdminView ? (
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

    </div>
  );
}
