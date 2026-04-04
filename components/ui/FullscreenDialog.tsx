"use client";

import dynamic from "next/dynamic";
import { Icon } from "@iconify/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import LeftPanel from "@/components/maps/LeftPanel";
import FullscreenHeader from "@/components/maps/FullscreenHeader";
import type { MapDraft } from "@/app/[locale]/(main)/video-to-map/types";
import { loadingMindElixir } from "@/app/lib/mind-elixir/sampleData";
import MapControls from "@/components/maps/MapControls";
import {
  DEFAULT_THEME_NAME,
  MIND_THEMES,
  MIND_THEME_BY_NAME,
} from "@/components/maps/themes";
import MapTutorialOverlay from "@/components/maps/tutorial/MapTutorialOverlay";
import { getMapTutorialSteps } from "@/components/maps/tutorial/mapTutorialSteps";
import useTutorialIsMobile from "@/components/maps/tutorial/useTutorialIsMobile";
import { useMindThemePreference } from "@/components/maps/MindThemePreferenceProvider";
import type { ClientMindElixirHandle } from "@/components/ClientMindElixir";
import TagEditDialog from "@/components/maps/TagEditDialog";
import {
  getMapTutorialCompleted,
  setMapTutorialCompleted,
} from "@/app/lib/mapTutorialState";

const PROFILE_THEME_NAME = "내설정테마";
const FULLSCREEN_TERMS_TAB_ID = "fullscreen-map-terms-tab";
const FULLSCREEN_LEFT_PANEL_BUTTON_ID = "fullscreen-map-left-panel-button";
const LEFT_PANEL_FOCUS_INSET = 560;

type MindNode = {
  children?: MindNode[];
  expanded?: boolean;
};

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

const ClientMindElixir = dynamic(
  () => import("@/components/ClientMindElixir"),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
        <span className="text-slate-500 dark:text-slate-400">
          마인드맵 로딩 중…
        </span>
      </div>
    ),
  }
);

export default function FullscreenDialog({
  open,
  title,
  onClose,
  onGoList,
  draft,
  mapData,
  mapLoading = false,
  mapError,
}: {
  open: boolean;
  title?: string;
  onClose: () => void;
  onGoList?: () => void;
  draft?: MapDraft | null;
  mapData?: unknown | null;
  mapLoading?: boolean;
  mapError?: string | null;
}) {
  // ✅ UI state
  const { profileThemeName } = useMindThemePreference();
  const [leftOpen, setLeftOpen] = useState(false); // metadata
  const [leftTab, setLeftTab] = useState<"info" | "notes" | "terms">("info");
  const editMode = "edit" as const;
  const panMode = false;
  const [themeName, setThemeName] = useState<string>(
    profileThemeName ? PROFILE_THEME_NAME : DEFAULT_THEME_NAME
  );
  const themeOptions = useMemo(
    () => [{ name: PROFILE_THEME_NAME }, { name: DEFAULT_THEME_NAME }, ...MIND_THEMES],
    []
  );
  const mindRef = useRef<ClientMindElixirHandle | null>(null);
  const { resolvedTheme } = useTheme();
  const t = useTranslations("FullscreenDialog");
  const tTutorial = useTranslations("MapTutorial");
  const isTutorialMobile = useTutorialIsMobile();
  const headerTitle = draft?.shortTitle ?? title ?? draft?.title ?? t("fallbackTitle");
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [tutorialStepIndex, setTutorialStepIndex] = useState(0);
  const initializedDraftIdRef = useRef<string | null>(null);


  // ✅ 좌측 패널(메타) 토글
  const toggleLeftPanel = () => {
    setLeftOpen((prev) => !prev);
  };

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Array<{ id: string; text: string }>>([]);
  const [searchIndex, setSearchIndex] = useState(0);
  const searchIndexRef = useRef(0);
  const lastStepAtRef = useRef(0);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [mobileToolbarCollapsed, setMobileToolbarCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [localDraft, setLocalDraft] = useState<MapDraft | null>(draft ?? null);
  const [tagEditOpen, setTagEditOpen] = useState(false);
  const [tagEditSubmitting, setTagEditSubmitting] = useState(false);
  const [allTagNames, setAllTagNames] = useState<string[]>([]);

  useEffect(() => {
    setLocalDraft(draft ?? null);
  }, [draft]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open || !mounted) return;
    if (initializedDraftIdRef.current === draft?.id) return;
    initializedDraftIdRef.current = draft?.id ?? null;
    setLeftOpen(!isTutorialMobile);
    const tutorialCompleted = getMapTutorialCompleted(
      isTutorialMobile ? "mobile" : "desktop"
    );
    setTutorialOpen(!tutorialCompleted);
    setTutorialStepIndex(0);
  }, [open, mounted, draft?.id, isTutorialMobile]);

  useEffect(() => {
    if (open) return;
    initializedDraftIdRef.current = null;
  }, [open]);

  useEffect(() => {
    if (isTutorialMobile) {
      setMobileToolbarCollapsed(false);
    }
  }, [isTutorialMobile]);

  useEffect(() => {
    if (!searchOpen) {
      setSearchQuery("");
      setSearchResults([]);
      setSearchIndex(0);
      searchIndexRef.current = 0;
      mindRef.current?.clearSearchHighlights?.();
      mindRef.current?.setSearchActive?.(null);
      return;
    }
    if (!searchInputRef.current) return;
    searchInputRef.current.focus();
  }, [searchOpen]);

  useEffect(() => {
    const q = searchQuery.trim().toLowerCase();
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

  const initialMapData = useMemo(
    () =>
      isTutorialMobile
        ? getInitialFullyCollapsedMapData(mapData ?? null)
        : getInitialCollapsedMapData(mapData ?? null),
    [mapData, isTutorialMobile]
  );

  useEffect(() => {
    if (!tagEditOpen || !draft?.id) return;
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
  }, [draft?.id, tagEditOpen]);

  if (!open || !draft) return null;

  if (!mounted) return null;

  const handleGoList = onGoList ?? onClose;
  const tutorialSteps = getMapTutorialSteps(tTutorial, {
    platform: isTutorialMobile ? "mobile" : "desktop",
    termsTabId: FULLSCREEN_TERMS_TAB_ID,
    leftPanelButtonId: FULLSCREEN_LEFT_PANEL_BUTTON_ID,
  });
  const mapDraft = localDraft ?? draft;
  const tagEditDraft = mapDraft;

  const handleTagEditSave = async (tags: string[]) => {
    if (!tagEditDraft?.id || tagEditSubmitting) return;
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
      setLocalDraft((prev) => (prev ? { ...prev, tags: nextTags } : prev));
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
  const resolvedThemeName =
    themeName === PROFILE_THEME_NAME ? profileThemeName : themeName;
  const appliedTheme =
    resolvedThemeName && resolvedThemeName !== DEFAULT_THEME_NAME
      ? MIND_THEME_BY_NAME[resolvedThemeName]
      : undefined;
  const handleExportPng = async () => {
    const blob = await mindRef.current?.exportPng?.();
    if (!blob) return;
    const safeTitle =
      (headerTitle ?? "map").replace(/[\\/:*?"<>|]+/g, "-").trim() || "map";
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
  const handleTutorialNext = () => {
    if (tutorialStepIndex >= tutorialSteps.length - 1) {
      setMapTutorialCompleted(true, isTutorialMobile ? "mobile" : "desktop");
      setTutorialOpen(false);
      return;
    }
    setTutorialStepIndex((prev) => prev + 1);
  };
  const handleRestartTutorial = () => {
    setTutorialStepIndex(0);
    setTutorialOpen(true);
  };
  const closeSearch = () => {
    setSearchOpen(false);
  };
  const stepSearch = (direction: 1 | -1) => {
    if (!searchResults.length) return;
    const now = Date.now();
    if (now - lastStepAtRef.current < 120) return;
    lastStepAtRef.current = now;
    const next = (searchIndexRef.current + direction + searchResults.length) % searchResults.length;
    searchIndexRef.current = next;
    setSearchIndex(next);
    const target = searchResults[next];
    mindRef.current?.setSearchActive?.(target?.id);
    if (target?.id) {
      mindRef.current?.focusNodeById?.(target.id);
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

  const content = (
    <div
      className="
        fixed left-0 top-0 z-[120]
        h-screen w-screen max-w-none
        bg-black/70
      "
      role="dialog"
      aria-modal="true"
      aria-label={headerTitle}
    >
      <div className="relative h-full w-full bg-white dark:bg-[#0b1220] overflow-hidden [--header-h:68px]">
        <FullscreenHeader
          title={headerTitle}
          onClose={onClose}
          closeLabel="맵 닫기"
          left={
            <>
              <button
                id={FULLSCREEN_LEFT_PANEL_BUTTON_ID}
                type="button"
                onClick={toggleLeftPanel}
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
                  <Icon icon="mdi:close" className="h-6 w-6" />
                ) : (
                  <span className="inline-flex h-4 w-5 flex-col justify-between">
                    <span className="h-[2px] w-full bg-[#111827] dark:bg-white" />
                    <span className="h-[2px] w-full bg-[#111827] dark:bg-white" />
                    <span className="h-[2px] w-full bg-[#111827] dark:bg-white" />
                  </span>
                )}
              </button>
              {searchOpen ? (
            <div className="relative z-[40] flex items-center gap-2 w-full sm:w-auto rounded-xl border border-neutral-900 bg-black px-2 py-1 text-[11px] text-white shadow-sm dark:border-white/30 dark:bg-black dark:text-white">
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
                onSelectTheme={(name) => setThemeName(name)}
                onCollapseAll={() => mindRef.current?.collapseAll?.()}
                onExpandAll={() => mindRef.current?.expandAll?.()}
                onExpandLevel={() => mindRef.current?.expandOneLevel?.()}
                onCollapseLevel={() => mindRef.current?.collapseOneLevel?.()}
                onAlignLeft={() => mindRef.current?.setLayout?.("left")}
                onAlignRight={() => mindRef.current?.setLayout?.("right")}
                onAlignSide={() => mindRef.current?.setLayout?.("side")}
                onCenterMap={() => mindRef.current?.centerMap?.()}
                onZoomIn={() => mindRef.current?.zoomIn?.()}
                onZoomOut={() => mindRef.current?.zoomOut?.()}
                onExportPng={handleExportPng}
                onCloseMap={onClose}
                onOpenTutorial={handleRestartTutorial}
                placement="inline"
                hideEditToggle
                hidePanToggle
              />
            </div>
          }
        />

        {/* ✅ (2) 헤더 아래: 맵 캔버스 영역 */}
        <div
          className="relative w-full"
          style={{ height: "calc(100% - var(--header-h))" }}
        >
          {/* ✅ 작업영역 배경 (격자 + 은은한 톤) */}
          <div
            className="
              absolute inset-0
              bg-[#f6f7fb]
              dark:bg-[#070c16]
            "
          />

          {/* ✅ 라이트: 그리드 */}
          <div
            className="
              pointer-events-none absolute inset-0
              opacity-60
              [background-image:linear-gradient(to_right,rgba(15,23,42,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.06)_1px,transparent_1px)]
              [background-size:28px_28px]
              dark:opacity-30
              dark:[background-image:linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)]
            "
          />

          {/* ✅ 살짝 vignette 느낌(집중감) */}
          <div
            className="
              pointer-events-none absolute inset-0
              [mask-image:radial-gradient(closest-side,black,transparent)]
              bg-[radial-gradient(900px_520px_at_50%_30%,rgba(59,130,246,0.10),transparent_62%)]
              dark:bg-[radial-gradient(900px_520px_at_50%_30%,rgba(56,189,248,0.10),transparent_62%)]
            "
          />

          {/* ✅ 실제 Elixir 캔버스 */}
          <div className="absolute inset-0 p-0">
            {/* 
              👇 이 wrapper가 배경을 잡아주니까,
              Elixir 자체 배경이 하얗더라도 "작업영역" 느낌이 살아남.
            */}
            <div className="h-full w-full rounded-2xl border border-slate-400 bg-white/65 shadow-sm dark:border-white/20 dark:bg-white/[0.03]">
              <ClientMindElixir
                ref={mindRef}
                mode={resolvedTheme === "dark" ? "dark" : "light"}
                editMode={editMode}
                theme={appliedTheme}
                data={initialMapData ?? undefined}
                loading={mapLoading}
                placeholderData={loadingMindElixir}
                showMiniMap={!isTutorialMobile}
                focusInsetLeft={leftOpen ? LEFT_PANEL_FOCUS_INSET : 0}
                openMenuOnClick={false}
                disableDirectContextMenu
                showSelectionContextMenuButton
              />
            </div>
          </div>

          {/* ✅ 구석: 내 맵 (네비게이션이라 툴바 아님) */}
          <button
            type="button"
            onClick={handleGoList}
            className="
              absolute left-4 bottom-4 z-[15]
              inline-flex items-center gap-1.5
              rounded-2xl border border-slate-400 bg-white/90 px-3 py-2
              text-xs font-semibold text-neutral-700 shadow-lg hover:bg-white
              dark:border-white/20 dark:bg-[#0b1220]/75 dark:text-white/80 dark:hover:bg-[#0b1220]/90
            "
            title="내 맵 리스트로"
          >
            <Icon icon="mdi:format-list-bulleted" className="h-4 w-4" />
            {t("goList")}
          </button>

          {mapError && (
            <div className="absolute left-4 top-3 z-[15]">
              <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] text-rose-700 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-200">
                <Icon icon="mdi:alert-circle-outline" className="h-3.5 w-3.5" />
                {t("status.fetchError")}
              </span>
            </div>
          )}

          <div className="pointer-events-auto absolute right-3 top-16 z-[25] flex flex-col gap-2 sm:hidden">
            <button
              type="button"
              onClick={() => setMobileToolbarCollapsed((v) => !v)}
              className="
                inline-flex h-9 w-9 items-center justify-center rounded-2xl
                border border-slate-400 bg-white/95 text-neutral-700 shadow-md
                dark:border-white/20 dark:bg-[#0b1220]/85 dark:text-white/80
              "
              aria-label={mobileToolbarCollapsed ? "도구 펼치기" : "도구 접기"}
              title={mobileToolbarCollapsed ? "도구 펼치기" : "도구 접기"}
            >
              <Icon
                icon={mobileToolbarCollapsed ? "mdi:chevron-left" : "mdi:chevron-right"}
                className="h-4 w-4"
              />
            </button>
            {!mobileToolbarCollapsed
              ? [
                  {
                    icon: "mdi:crosshairs-gps",
                    onClick: () => mindRef.current?.centerMap?.(),
                    label: t("actions.centerMap"),
                  },
                  {
                    icon: "mdi:plus",
                    onClick: () => mindRef.current?.zoomIn?.(),
                    label: t("actions.zoomIn"),
                  },
                  {
                    icon: "mdi:minus",
                    onClick: () => mindRef.current?.zoomOut?.(),
                    label: t("actions.zoomOut"),
                  },
                  {
                    icon: "mdi:unfold-less-horizontal",
                    onClick: () => mindRef.current?.collapseAll?.(),
                    label: t("actions.collapseAll"),
                  },
                ].map((action) => (
                  <button
                    key={action.label}
                    type="button"
                    onClick={action.onClick}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-400 bg-white/95 text-neutral-700 shadow-md dark:border-white/20 dark:bg-[#0b1220]/85 dark:text-white/80"
                    aria-label={action.label}
                    title={action.label}
                  >
                    <Icon icon={action.icon} className="h-4 w-4" />
                  </button>
                ))
              : null}
            {!mobileToolbarCollapsed ? (
              <button
                type="button"
                onClick={handleRestartTutorial}
                className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-400 bg-white/95 text-neutral-700 shadow-md dark:border-white/20 dark:bg-[#0b1220]/85 dark:text-white/80"
                aria-label={t("actions.tutorial")}
                title={t("actions.tutorial")}
              >
                <Icon icon="mdi:school-outline" className="h-4 w-4" />
              </button>
            ) : null}
          </div>

          {/* ✅ 좌측: 메타데이터 패널 */}
          <LeftPanel
            open={leftOpen}
            onClose={() => setLeftOpen(false)}
            map={mapDraft}
            mapId={mapDraft.id}
            mindData={mapData}
            onSelectNodeNote={handleSelectNodeNote}
            tab={leftTab}
            onTabChange={setLeftTab}
            onEditTags={() => setTagEditOpen(true)}
            termsTabId={FULLSCREEN_TERMS_TAB_ID}
          />

          {tutorialOpen ? (
            <MapTutorialOverlay
              stepIndex={tutorialStepIndex}
              steps={tutorialSteps}
              onNext={handleTutorialNext}
              onSkip={() => setTutorialOpen(false)}
            />
          ) : null}

          {/* ✅ 패널 닫기 버튼 제거 */}
        </div>
      </div>
      {tagEditDraft ? (
        <TagEditDialog
          open={tagEditOpen}
          onOpenChange={setTagEditOpen}
          draftTitle={tagEditDraft.title ?? "선택한 맵"}
          initialTags={tagEditDraft.tags ?? []}
          allTags={allTagNames}
          saving={tagEditSubmitting}
          onSave={handleTagEditSave}
        />
      ) : null}
    </div>
  );

  return createPortal(content, document.body);
}
