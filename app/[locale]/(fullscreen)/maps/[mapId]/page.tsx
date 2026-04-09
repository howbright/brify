"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Icon } from "@iconify/react";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import LeftPanel from "@/components/maps/LeftPanel";
import MapControls from "@/components/maps/MapControls";
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

export default function MapDetailPage() {
  const t = useTranslations("FullscreenMapPage");
  const tTutorial = useTranslations("MapTutorial");
  const isTutorialMobile = useTutorialIsMobile();
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { resolvedTheme } = useTheme();
  const { profileThemeName } = useMindThemePreference();

  const mapId = String(params?.mapId ?? "");
  const locale = String(params?.locale ?? "ko");
  const sourceTab = searchParams.get("tab");
  const backToMapsUrl =
    sourceTab === "notes" || sourceTab === "terms"
      ? `/${locale}/maps?tab=${sourceTab}`
      : `/${locale}/maps`;

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
  const editMode = "edit" as const;
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
  const [mobileMapActionsOpen, setMobileMapActionsOpen] = useState(false);
  const [mobileThemeOpen, setMobileThemeOpen] = useState(false);
  const [mobileToolbarCollapsed, setMobileToolbarCollapsed] = useState(false);
  const [showTimestamps, setShowTimestamps] = useState(true);
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
  }, [mapId]);

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
    if (!mobileMapActionsOpen && !mobileThemeOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (mobileMapActionsOpen && mobileMapActionsRef.current?.contains(target)) {
        return;
      }
      if (mobileThemeOpen && mobileThemeRef.current?.contains(target)) {
        return;
      }
      setMobileMapActionsOpen(false);
      setMobileThemeOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [mobileMapActionsOpen, mobileThemeOpen]);
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
    if (centeredOnceRef.current) return;
    centeredOnceRef.current = true;
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

  return (
    <div className="fixed inset-0 z-[120] bg-white dark:bg-[#0b1220] [--header-h:68px]">
      <FullscreenHeader
        title={title}
        onClose={() => router.push(backToMapsUrl)}
        closeLabel={t("actions.closeMap")}
        left={
          <>
              <button
                id={FULLSCREEN_PAGE_LEFT_PANEL_BUTTON_ID}
                type="button"
                onClick={() => (leftOpen ? setLeftOpen(false) : openTab(leftTab))}
                className="
                  inline-flex items-center
                  p-1
                  text-neutral-800 hover:text-neutral-900
                  dark:text-white/85 dark:hover:text-white
                "
                aria-label={t("tabs.info")}
                title={t("tabs.info")}
              >
                <span className="sr-only">{t("tabs.info")}</span>
                {leftOpen ? (
                  <Icon icon="mdi:chevron-left" className="h-7 w-7" />
                ) : (
                  <span className="inline-flex h-4 w-5 flex-col justify-between">
                    <span className="h-[2px] w-full bg-[#111827] dark:bg-white" />
                    <span className="h-[2px] w-full bg-[#111827] dark:bg-white" />
                    <span className="h-[2px] w-full bg-[#111827] dark:bg-white" />
                  </span>
                )}
              </button>

            {searchOpen ? (
              <div className="relative z-[40] flex items-center gap-2 w-full sm:w-auto rounded-xl border border-neutral-900 bg-black px-2 py-1 text-[11px] text-white shadow-sm dark:border-white/20 dark:bg-black dark:text-white">
                <Icon icon="mdi:magnify" className="h-3.5 w-3.5" />
                <input
                  ref={searchInputRef}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
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
                  placeholder="검색"
                  className="w-full sm:w-[140px] bg-transparent text-[11px] text-white outline-none placeholder:text-white/60"
                />
                <span className="text-[10px] text-white/70">
                  {searchResults.length ? `${searchIndex + 1}/${searchResults.length}` : "0"}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => stepSearch(-1)}
                    className="inline-flex h-5 w-5 items-center justify-center rounded-md hover:bg-white/10"
                    aria-label="이전 결과"
                    title="이전 결과"
                  >
                    <Icon icon="mdi:chevron-up" className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => stepSearch(1)}
                    className="inline-flex h-5 w-5 items-center justify-center rounded-md hover:bg-white/10"
                    aria-label="다음 결과"
                    title="다음 결과"
                  >
                    <Icon icon="mdi:chevron-down" className="h-3.5 w-3.5" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={closeSearch}
                  className="inline-flex h-5 w-5 items-center justify-center rounded-md hover:bg-white/10"
                  aria-label="검색 닫기"
                  title="검색 닫기"
                >
                  <Icon icon="mdi:close" className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="
                  inline-flex items-center justify-center
                  h-8 w-8 rounded-lg
                  border border-neutral-900/30 bg-neutral-900 text-white shadow-md
                  hover:bg-neutral-800
                  dark:border-white/15 dark:bg-white/15 dark:text-white dark:hover:bg-white/20
                "
                aria-label="검색"
                title="검색"
              >
                <Icon icon="mdi:magnify" className="h-4 w-4" />
              </button>
            )}
          </>
        }
        right={
          <div className="hidden sm:flex items-center gap-2">
            <MapControls
              editMode={editMode}
              panMode={panMode}
              themes={themeOptions}
              currentThemeName={themeName}
              onToggleEdit={() => {}}
              onTogglePanMode={() => {}}
              onSelectTheme={handleSelectTheme}
                  onCollapseAll={() => mindRef.current?.collapseAll()}
                  onExpandAll={() => mindRef.current?.expandAll()}
                  onExpandLevel={() => mindRef.current?.expandOneLevel()}
                  onCollapseLevel={() => mindRef.current?.collapseOneLevel()}
                  onAlignLeft={() => mindRef.current?.setLayout?.("left")}
                  onAlignRight={() => mindRef.current?.setLayout?.("right")}
                  onAlignSide={() => mindRef.current?.setLayout?.("side")}
                  onPublish={handlePublish}
                  onCenterMap={() => mindRef.current?.centerMap?.()}
                  onZoomIn={() => mindRef.current?.zoomIn?.()}
                  onZoomOut={() => mindRef.current?.zoomOut?.()}
                  showTimestamps={showTimestamps}
                  onToggleTimestamps={
                    hasTimestampNodes
                      ? () => setShowTimestamps((prev) => !prev)
                      : undefined
                  }
                  onCloseMap={() => router.push(backToMapsUrl)}
              onShare={() => {
                setShareOpen(true);
                void fetchShareStatus();
              }}
              onExportPng={handleExportPng}
              onOpenTutorial={() => {
                setTutorialStepIndex(0);
                setTutorialOpen(true);
              }}
              placement="inline"
              hideEditToggle
              hidePanToggle
            />
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
            className="
              inline-flex h-9 w-9 items-center justify-center rounded-2xl
              border border-neutral-200 bg-white/95 text-neutral-700 shadow-md
              dark:border-white/10 dark:bg-[#0b1220]/85 dark:text-white/80
            "
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
                className="
                  inline-flex h-9 w-9 items-center justify-center rounded-2xl
                  border border-neutral-200 bg-white/95 text-neutral-700 shadow-md
                  dark:border-white/10 dark:bg-[#0b1220]/85 dark:text-white/80
                "
                aria-label="가운데로"
                title="가운데로"
              >
                <Icon icon="mdi:crosshairs-gps" className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => mindRef.current?.zoomIn?.()}
                className="
                  inline-flex h-9 w-9 items-center justify-center rounded-2xl
                  border border-neutral-200 bg-white/95 text-neutral-700 shadow-md
                  dark:border-white/10 dark:bg-[#0b1220]/85 dark:text-white/80
                "
                aria-label="확대"
                title="확대"
              >
                <Icon icon="mdi:plus" className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => mindRef.current?.zoomOut?.()}
                className="
                  inline-flex h-9 w-9 items-center justify-center rounded-2xl
                  border border-neutral-200 bg-white/95 text-neutral-700 shadow-md
                  dark:border-white/10 dark:bg-[#0b1220]/85 dark:text-white/80
                "
                aria-label="축소"
                title="축소"
              >
                <Icon icon="mdi:minus" className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => mindRef.current?.collapseAll?.()}
                className="
                  inline-flex h-9 w-9 items-center justify-center rounded-2xl
                  border border-neutral-200 bg-white/95 text-neutral-700 shadow-md
                  dark:border-white/10 dark:bg-[#0b1220]/85 dark:text-white/80
                "
                aria-label="전체 접기"
                title="전체 접기"
              >
                <Icon icon="mdi:collapse-all-outline" className="h-4 w-4" />
              </button>
              <div className="relative" ref={mobileMapActionsRef}>
                <button
                  type="button"
                  onClick={() => setMobileMapActionsOpen((v) => !v)}
                  className="
                    inline-flex h-9 w-9 items-center justify-center rounded-2xl
                    border border-neutral-200 bg-white/95 text-neutral-700 shadow-md
                    dark:border-white/10 dark:bg-[#0b1220]/85 dark:text-white/80
                  "
                  aria-label="맵 조작"
                  title="맵 조작"
                >
                  <Icon icon="mdi:vector-polyline" className="h-4 w-4" />
                </button>

            {mobileMapActionsOpen && (
              <div className="absolute right-full mr-2 top-0 w-[160px] rounded-2xl border border-neutral-200 bg-white p-1 shadow-lg dark:border-white/10 dark:bg-[#0f172a]">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMapActionsOpen(false);
                    mindRef.current?.expandAll?.();
                  }}
                  className="w-full rounded-xl px-3 py-2 text-left text-xs font-semibold text-neutral-700 hover:bg-neutral-50 dark:text-white/80 dark:hover:bg-white/10"
                >
                  전체 펴기
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMapActionsOpen(false);
                    mindRef.current?.expandOneLevel?.();
                  }}
                  className="w-full rounded-xl px-3 py-2 text-left text-xs font-semibold text-neutral-700 hover:bg-neutral-50 dark:text-white/80 dark:hover:bg-white/10"
                >
                  한단계 펴기
                </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMapActionsOpen(false);
                      mindRef.current?.collapseOneLevel?.();
                    }}
                    className="w-full rounded-xl px-3 py-2 text-left text-xs font-semibold text-neutral-700 hover:bg-neutral-50 dark:text-white/80 dark:hover:bg-white/10"
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
                    className="w-full rounded-xl px-3 py-2 text-left text-xs font-semibold text-neutral-700 hover:bg-neutral-50 dark:text-white/80 dark:hover:bg-white/10"
                  >
                    왼쪽 정렬
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMapActionsOpen(false);
                      mindRef.current?.setLayout?.("right");
                    }}
                    className="w-full rounded-xl px-3 py-2 text-left text-xs font-semibold text-neutral-700 hover:bg-neutral-50 dark:text-white/80 dark:hover:bg-white/10"
                  >
                    오른쪽 정렬
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMapActionsOpen(false);
                      mindRef.current?.setLayout?.("side");
                    }}
                    className="w-full rounded-xl px-3 py-2 text-left text-xs font-semibold text-neutral-700 hover:bg-neutral-50 dark:text-white/80 dark:hover:bg-white/10"
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
                  className="
                    inline-flex h-9 w-9 items-center justify-center rounded-2xl
                    border border-neutral-200 bg-white/95 text-neutral-700 shadow-md
                    dark:border-white/10 dark:bg-[#0b1220]/85 dark:text-white/80
                  "
                  aria-label="테마"
                  title="테마"
                >
                  <Icon icon="mdi:palette-outline" className="h-4 w-4" />
                </button>
                {mobileThemeOpen && (
                  <div className="absolute right-full mr-2 top-0 w-[180px] rounded-2xl border border-neutral-200 bg-white p-2 shadow-lg dark:border-white/10 dark:bg-[#0f172a]">
                    <div className="text-[11px] font-semibold text-neutral-500 dark:text-white/60">
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
                              : "border-neutral-200 bg-white text-neutral-600 dark:border-white/10 dark:bg-white/[0.06] dark:text-white/70"
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
                className="
                  inline-flex h-9 w-9 items-center justify-center rounded-2xl
                  border border-neutral-200 bg-white/95 text-neutral-700 shadow-md
                  dark:border-white/10 dark:bg-[#0b1220]/85 dark:text-white/80
                "
                aria-label="PNG 저장"
                title="PNG 저장"
              >
                <Icon icon="mdi:download" className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setShareOpen(true);
                  void fetchShareStatus();
                }}
                className="
                  inline-flex h-9 w-9 items-center justify-center rounded-2xl
                  border border-neutral-200 bg-white/95 text-neutral-700 shadow-md
                  dark:border-white/10 dark:bg-[#0b1220]/85 dark:text-white/80
                "
                aria-label="공유"
                title="공유"
              >
                <Icon icon="mdi:share-variant" className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setTutorialStepIndex(0);
                  setTutorialOpen(true);
                }}
                className="
                  inline-flex h-9 w-9 items-center justify-center rounded-2xl
                  border border-neutral-200 bg-white/95 text-neutral-700 shadow-md
                  dark:border-white/10 dark:bg-[#0b1220]/85 dark:text-white/80
                "
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

        {(statusLabel || hasDraft) && (
          <div className="pointer-events-auto absolute right-4 top-3 z-[15] flex items-center gap-2">
            {statusLabel && (
              <span
                className={`
                  inline-flex items-center px-1 text-[11px] font-semibold
                  ${
                    statusTone === "success"
                      ? "text-emerald-600 dark:text-emerald-300"
                      : statusTone === "warning"
                      ? "text-amber-600 dark:text-amber-300"
                      : "text-neutral-500 dark:text-white/70"
                  }
                `}
              >
                {statusLabel}
              </span>
            )}
            {hasDraft && (
              <>
                <button
                  type="button"
                  onClick={() => setConfirmDiscardOpen(true)}
                  className="
                    inline-flex items-center gap-1.5 rounded-full border border-neutral-200/70
                    bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-neutral-600
                    shadow-sm hover:text-neutral-900
                    dark:border-white/10 dark:bg-[#0b1220]/80 dark:text-white/70 dark:hover:text-white
                  "
                >
                  <Icon icon="mdi:undo-variant" className="h-3.5 w-3.5" />
                  {t("actions.discardDraft")}
                </button>
                <button
                  type="button"
                  onClick={handlePublish}
                  className="
                    inline-flex items-center gap-1.5
                    rounded-full
                    bg-blue-600 px-4 py-1.5 text-[13px] font-semibold text-white shadow-md
                    hover:bg-blue-700
                    dark:bg-blue-500 dark:hover:bg-blue-400
                  "
                >
                  <Icon icon="mdi:check-circle-outline" className="h-4.5 w-4.5" />
                  {t("actions.publish")}
                </button>
              </>
            )}
          </div>
        )}

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
            onEdit={() => setShowMetadataDialog(true)}
            onEditTags={() => setTagEditOpen(true)}
            onDelete={() => setConfirmDeleteOpen(true)}
            deleteLabel={t("actions.delete")}
            map={draft}
            mapId={mapId}
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

      <DiscardDraftDialog
        open={confirmDiscardOpen}
        onClose={() => setConfirmDiscardOpen(false)}
        onConfirm={() => {
          setConfirmDiscardOpen(false);
          handleDiscardDraft();
        }}
      />

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

    </div>
  );
}
