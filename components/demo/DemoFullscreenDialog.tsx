"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { Icon } from "@iconify/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useLocale, useMessages, useTranslations } from "next-intl";
import * as Tooltip from "@radix-ui/react-tooltip";
import { toast } from "sonner";

import FullscreenHeader from "@/components/maps/FullscreenHeader";
import NoteItem, { type NoteItemData } from "@/components/maps/NoteItem";
import TermsBlock from "@/components/maps/TermsBlock";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import MapTutorialOverlay, {
  type MapTutorialLanguage as DemoLanguage,
} from "@/components/maps/tutorial/MapTutorialOverlay";
import { getMapTutorialSteps } from "@/components/maps/tutorial/mapTutorialSteps";
import useTutorialIsMobile from "@/components/maps/tutorial/useTutorialIsMobile";
import {
  DEFAULT_THEME_NAME,
  MIND_THEMES,
  MIND_THEME_BY_NAME,
} from "@/components/maps/themes";
import { useMindThemePreference } from "@/components/maps/MindThemePreferenceProvider";
import { getLoadingMindElixir } from "@/app/lib/mind-elixir/sampleData";
import {
  getMapTutorialCompleted,
  setMapTutorialCompleted,
} from "@/app/lib/mapTutorialState";
import type { ClientMindElixirHandle } from "@/components/ClientMindElixir";
import type { MapDraft } from "@/app/[locale]/(main)/video-to-map/types";

const PROFILE_THEME_NAME = "내설정테마";
const DEMO_THEME_NAME = "Inkline";

const ClientMindElixir = dynamic(
  () => import("@/components/ClientMindElixir"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
        <span className="text-slate-500 dark:text-slate-400">
          마인드맵 로딩 중…
        </span>
      </div>
    ),
  }
);

type DemoTermItem = {
  term: string;
  meaning: string;
  isNew?: boolean;
};

const DEMO_TERMS_TAB_ID = "demo-terms-tab";
const DEMO_LEFT_PANEL_BUTTON_ID = "demo-left-panel-button";

type DemoMindNode = {
  expanded?: boolean;
  children?: DemoMindNode[];
};

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function collapseToLevel(node: DemoMindNode, level: number, depth = 0) {
  node.expanded = depth < level;
  node.children?.forEach((child) => collapseToLevel(child, level, depth + 1));
}

function collapseAllDescendants(node: DemoMindNode, depth = 0) {
  node.expanded = depth === 0;
  node.children?.forEach((child) => collapseAllDescendants(child, depth + 1));
}

function getInitialCollapsedMapData<T>(raw: T): T {
  if (!raw || typeof raw !== "object") return raw;
  const cloned = cloneJson(raw) as T & { nodeData?: DemoMindNode };
  const root = cloned?.nodeData;
  if (!root) return cloned;
  collapseToLevel(root, 2);
  return cloned;
}

function getInitialFullyCollapsedMapData<T>(raw: T): T {
  if (!raw || typeof raw !== "object") return raw;
  const cloned = cloneJson(raw) as T & { nodeData?: DemoMindNode };
  const root = cloned?.nodeData;
  if (!root) return cloned;
  collapseAllDescendants(root);
  return cloned;
}

function getDemoNotes(t: ReturnType<typeof useTranslations>): NoteItemData[] {
  const items = t.raw("notes.items") as Array<{ text: string; createdAtLabel: string }>;
  return items.map((item, index) => ({
    id: `demo-note-${index + 1}`,
    text: item.text,
    createdAt: Date.now() - 1000 * 60 * (index === 0 ? 18 : 42),
    createdAtLabel: item.createdAtLabel,
  }));
}

function getDemoTerms(t: ReturnType<typeof useTranslations>): DemoTermItem[] {
  return t.raw("terms.items") as DemoTermItem[];
}

function safeDateLabel(value: number | undefined, locale: string) {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleDateString(locale === "ko" ? "ko-KR" : "en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  } catch {
    return "-";
  }
}

function sourceTypeLabel(
  t: ReturnType<typeof useTranslations>,
  sourceType?: MapDraft["sourceType"]
) {
  switch (sourceType) {
    case "youtube":
      return t("sourceTypes.youtube");
    case "website":
      return t("sourceTypes.website");
    case "file":
      return t("sourceTypes.file");
    default:
      return t("sourceTypes.manual");
  }
}

function DemoLeftPanel({
  open,
  onClose,
  map,
  language,
}: {
  open: boolean;
  onClose: () => void;
  map: MapDraft;
  language: DemoLanguage;
}) {
  const t = useTranslations("DemoFullscreenDialog");
  const [activeTab, setActiveTab] = useState<"info" | "notes" | "terms">("info");
  const [noteText, setNoteText] = useState("");
  const [notes, setNotes] = useState<NoteItemData[]>(() => getDemoNotes(t));
  const [terms, setTerms] = useState<DemoTermItem[]>(() => getDemoTerms(t));
  const panelRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setNotes(getDemoNotes(t));
    setTerms(getDemoTerms(t));
    setActiveTab("info");
  }, [language, map.id, t]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (panelRef.current?.contains(target)) return;
      onClose();
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [open, onClose]);

  const createdLabel = useMemo(
    () => safeDateLabel(map.createdAt, language),
    [language, map.createdAt]
  );
  const updatedLabel = useMemo(
    () => safeDateLabel(map.updatedAt, language),
    [language, map.updatedAt]
  );

  const addNote = () => {
    const trimmed = noteText.trim();
    if (!trimmed) return;
    const createdAt = Date.now();
    setNotes((prev) => [
      {
        id: `demo-note-${createdAt}`,
        text: trimmed,
        createdAt,
        createdAtLabel: t("notes.justNow"),
      },
      ...prev,
    ]);
    setNoteText("");
  };

  const updateNote = (id: string, text: string) => {
    setNotes((prev) => prev.map((note) => (note.id === id ? { ...note, text } : note)));
  };

  const deleteNote = (id: string) => {
    setNotes((prev) => prev.filter((note) => note.id !== id));
  };

  const requestAutoTerms = () => {
    setTerms((prev) => {
      if (prev.some((term) => term.term === "xylitol")) return prev;
      return [
        ...prev,
        {
          term: "xylitol",
          meaning: t("terms.autoAddedXylitol"),
          isNew: true,
        },
      ];
    });
  };

  const requestCustomTerms = (termsCsv: string) => {
    const additions = termsCsv
      .split(",")
      .map((term) => term.trim())
      .filter(Boolean)
      .map((term) => ({
        term,
        meaning: t("terms.customAdded"),
        isNew: true,
      }));

    setTerms((prev) => {
      const existing = new Set(prev.map((item) => item.term.toLowerCase()));
      const filtered = additions.filter(
        (item) => !existing.has(item.term.toLowerCase())
      );
      return [...filtered, ...prev];
    });
  };

  const deleteTerm = (term: string) => {
    setTerms((prev) => prev.filter((item) => item.term !== term));
  };

  return (
    <aside
      ref={panelRef}
      className={`
        absolute left-0 top-[-40px] z-[32] h-[calc(100%+40px)]
        transition-transform duration-300
        ${open ? "translate-x-0" : "-translate-x-[calc(100%+28px)]"}
      `}
    >
      <div className="relative flex h-full w-[min(420px,calc(100vw-18px))] max-w-full flex-col border-r border-slate-400 bg-white/96 shadow-[0_20px_50px_-36px_rgba(15,23,42,0.55)] dark:border-white/20 dark:bg-[#0b1220]/96 dark:shadow-[0_32px_100px_-70px_rgba(0,0,0,0.95)]">
        <div className="border-b border-slate-400 px-3 pb-3 pt-3 sm:px-4 sm:pt-4 dark:border-white/20">
          <div className="flex items-start gap-2">
            <div className="inline-flex rounded-full border border-slate-400 bg-neutral-50 p-1 dark:border-white/20 dark:bg-white/[0.04]">
              {[
                {
                  tab: "info" as const,
                  label: t("tabs.info"),
                },
                {
                  tab: "notes" as const,
                  label: t("tabs.notes"),
                  count: notes.length,
                },
                {
                  tab: "terms" as const,
                  label: t("tabs.terms"),
                  count: terms.length,
                },
              ].map(({ tab, label, count }) => (
                <button
                  key={tab}
                  type="button"
                  id={tab === "terms" ? DEMO_TERMS_TAB_ID : undefined}
                  onClick={() => setActiveTab(tab)}
                  className={`rounded-full px-2.5 py-1 text-[13px] font-semibold transition-colors sm:px-3 sm:py-1.5 ${
                    activeTab === tab
                      ? "bg-blue-600 text-[14px] font-extrabold text-white sm:text-[16px] dark:bg-blue-500"
                      : "text-[14px] font-bold text-neutral-700 hover:text-neutral-900 sm:text-[16px] dark:text-white/80 dark:hover:text-white"
                  }`}
                >
                  <span className="inline-flex items-center gap-1.5">
                    <span>{label}</span>
                    {typeof count === "number" ? (
                      <span
                        className={`inline-flex min-w-[1.2rem] items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-black leading-none ${
                          activeTab === tab
                            ? "bg-white/20 text-white"
                            : "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-200"
                        }`}
                      >
                        {count}
                      </span>
                    ) : null}
                  </span>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="ml-auto -mr-4 inline-flex h-8 w-10 items-center justify-center rounded-l-full rounded-r-md bg-blue-600 text-white shadow-sm hover:bg-blue-700 dark:bg-blue-500/70 dark:hover:bg-blue-500"
              aria-label={t("actions.close")}
              title={t("actions.close")}
            >
              <Icon icon="mdi:chevron-left" className="h-5 w-5" />
            </button>
          </div>

          {activeTab === "info" && (
            <div className="mt-3 whitespace-normal break-words text-[15px] font-bold text-neutral-900 sm:text-[17px] dark:text-white/90">
              {map.title}
            </div>
          )}
        </div>

        <div className="relative min-h-0 flex-1 overflow-y-auto px-3 py-3 sm:px-4 sm:py-4">
          {activeTab === "info" ? (
            <>
              <div className="mb-3 text-[13px] sm:text-[14px] text-neutral-500 dark:text-white/55">
                <div>
                  {t("info.created")} {createdLabel} · {t("info.updated")}{" "}
                  {updatedLabel}
                </div>
                <div className="mt-0.5">
                  {t("info.credits")}:{" "}
                  <span className="font-semibold text-neutral-600 dark:text-white/70">
                    {typeof map.creditsCharged === "number"
                      ? map.creditsCharged
                      : map.requiredCredits ?? 1}
                  </span>
                </div>
              </div>

              {map.summary ? (
                <section className="mb-4">
                  <div className="mb-2.5 flex items-center gap-2">
                    <div className="h-5 w-1 rounded-full bg-blue-200 dark:bg-blue-500/40" />
                    <h3 className="text-base font-bold text-neutral-900 dark:text-white/90">
                      {t("info.summary")}
                    </h3>
                  </div>
                  <div className="rounded-3xl border border-slate-400 bg-blue-50/60 p-3 text-[13px] leading-6 text-neutral-700 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.2)] sm:p-3.5 sm:text-[14px] sm:leading-6 dark:border-white/20 dark:bg-blue-500/10 dark:text-white/80 dark:shadow-[0_34px_120px_-70px_rgba(0,0,0,0.55)]">
                    <p className="whitespace-pre-wrap break-words">{map.summary}</p>
                  </div>
                </section>
              ) : null}

              <DemoSection title={t("info.source")}>
                <div className="flex gap-3">
                  <div className="relative h-16 w-28 flex-shrink-0 overflow-hidden rounded-2xl border border-slate-400 bg-neutral-50 dark:border-white/20 dark:bg-white/[0.06]">
                    {map.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={map.thumbnailUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[11px] text-neutral-400 dark:text-white/45">
                        {t("info.thumbnail")}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <DemoRow
                      icon="mdi:youtube"
                      label={t("info.sourceType")}
                      value={sourceTypeLabel(t, map.sourceType)}
                    />
                    <DemoRow
                      icon="mdi:account-circle-outline"
                      label={t("info.channel")}
                      value={map.channelName ?? "-"}
                    />

                    <div className="mt-1">
                      <div className="text-[13px] text-neutral-500 dark:text-white/60">
                        {t("info.originalLink")}
                      </div>
                      {map.sourceUrl ? (
                        <a
                          href={map.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-0.5 block truncate text-[14px] font-semibold text-blue-700 hover:underline sm:text-[15px] dark:text-sky-200"
                          title={map.sourceUrl}
                        >
                          {map.sourceUrl}
                        </a>
                      ) : (
                        <div className="mt-0.5 text-[14px] sm:text-[15px] text-neutral-700 dark:text-white/85">
                          -
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </DemoSection>

              <DemoSection title={t("info.tags")}>
                {map.tags?.length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {map.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-slate-400 bg-neutral-50 px-2.5 py-1 text-[13px] font-semibold text-neutral-700 dark:border-white/20 dark:bg-white/[0.06] dark:text-white/80"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                ) : null}
              </DemoSection>

              <DemoSection title={t("info.description")}>
                <div className="whitespace-pre-wrap break-words text-[13px] leading-6 sm:text-[14px] sm:leading-6 text-neutral-700 dark:text-white/80">
                  {map.description ?? "-"}
                </div>
              </DemoSection>
            </>
          ) : activeTab === "notes" ? (
            <div className="flex flex-col gap-3">
              <div className="rounded-2xl border border-slate-400 bg-white p-3 dark:border-white/20 dark:bg-white/[0.04]">
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder={t("notes.placeholder")}
                  className="w-full rounded-xl border-2 border-blue-500 bg-white px-3 py-2 text-[14px] shadow-[0_16px_36px_-24px_rgba(37,99,235,0.35)] outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-200/80 sm:text-[15px] dark:border-blue-400 dark:bg-white/[0.06] dark:text-white dark:shadow-[0_20px_42px_-28px_rgba(56,189,248,0.4)] dark:focus:border-blue-300 dark:focus:ring-blue-500/20"
                  rows={3}
                />
                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={addNote}
                    className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-400 bg-blue-600 px-3 py-2 text-[14px] font-semibold text-white hover:bg-blue-700 sm:text-[15px] dark:border-white/20 dark:bg-blue-500"
                  >
                    <Icon icon="mdi:plus" className="h-4 w-4" />
                    {t("notes.add")}
                  </button>
                </div>
              </div>

              {notes.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-400 bg-neutral-50 p-4 text-[13px] sm:text-sm text-neutral-500 dark:border-white/20 dark:bg-white/[0.04] dark:text-white/60">
                  {t("notes.empty")}
                </div>
              ) : (
                notes.map((note) => (
                  <NoteItem
                    key={note.id}
                    note={note}
                    onDelete={deleteNote}
                    onUpdate={updateNote}
                  />
                ))
              )}
            </div>
          ) : (
            <>
              <div className="mb-3 rounded-2xl border border-slate-400 bg-sky-50/70 px-3 py-2 text-[15px] text-slate-700 shadow-[0_16px_30px_-24px_rgba(14,116,144,0.45)] sm:text-base dark:border-white/20 dark:bg-sky-500/10 dark:text-white/75">
                <div className="flex items-center gap-2">
                  <Icon icon="mdi:sparkles" className="h-4 w-4 text-sky-500 dark:text-sky-300" />
                  <span className="font-semibold">
                    {t("terms.helper")}
                  </span>
                </div>
              </div>

              <TermsBlock
                terms={terms}
                loading={false}
                error={null}
                usedCount={0}
                onAutoExtract={requestAutoTerms}
                onExplainCustom={requestCustomTerms}
                onDeleteTerm={deleteTerm}
              />
            </>
          )}
        </div>
      </div>
    </aside>
  );
}

function DemoSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-4">
      <div className="mb-2 flex items-center gap-2">
        <div className="h-5 w-1 rounded-full bg-neutral-200 dark:bg-white/15" />
        <h3 className="text-[15px] font-bold text-neutral-900 sm:text-base dark:text-white/90">
          {title}
        </h3>
      </div>
      <div className="rounded-3xl border border-slate-400 bg-white p-3 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.25)] sm:p-3 dark:border-white/20 dark:bg-white/[0.04] dark:shadow-[0_34px_120px_-70px_rgba(0,0,0,0.55)]">
        {children}
      </div>
    </section>
  );
}

function DemoRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <Icon icon={icon} className="h-4 w-4 text-neutral-500 dark:text-white/55" />
      <div className="min-w-0">
        <div className="text-[12px] sm:text-[13px] text-neutral-500 dark:text-white/60">{label}</div>
        <div className="truncate text-[15px] font-semibold text-neutral-800 sm:text-base dark:text-white/85">
          {value}
        </div>
      </div>
    </div>
  );
}

export default function DemoFullscreenDialog({
  open,
  title,
  onClose,
  draft,
  mapData,
  language = "ko",
}: {
  open: boolean;
  title?: string;
  onClose: () => void;
  draft?: MapDraft | null;
  mapData?: unknown | null;
  language?: DemoLanguage;
}) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("DemoFullscreenDialog");
  const tMap = useTranslations("FullscreenMapPage");
  const tTutorial = useTranslations("MapTutorial");
  const messages = useMessages() as {
    DemoFullscreenDialog?: {
      shareDialog?: {
        title?: string;
        description?: string;
        action?: string;
        cancel?: string;
      };
    };
  };
  const isTutorialMobile = useTutorialIsMobile();
  const { profileThemeName } = useMindThemePreference();
  const { resolvedTheme } = useTheme();
  const [leftOpen, setLeftOpen] = useState(false);
  const editMode = "edit" as const;
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [tutorialStepIndex, setTutorialStepIndex] = useState(0);
  const [shareGuideOpen, setShareGuideOpen] = useState(false);
  const [mobileToolbarCollapsed, setMobileToolbarCollapsed] = useState(false);
  const [desktopMoreOpen, setDesktopMoreOpen] = useState(false);
  const [showTimestamps, setShowTimestamps] = useState(true);
  const loadingMindElixir = useMemo(() => getLoadingMindElixir(locale), [locale]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Array<{ id: string; text: string }>>([]);
  const [searchIndex, setSearchIndex] = useState(0);
  const [themeName, setThemeName] = useState<string>(
    DEMO_THEME_NAME
  );
  const mindRef = useRef<ClientMindElixirHandle | null>(null);
  const desktopMoreRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement | null>(null);
  const searchIndexRef = useRef(0);
  const initialMapData = useMemo(
    () =>
      isTutorialMobile
        ? getInitialFullyCollapsedMapData(mapData ?? null)
        : getInitialCollapsedMapData(mapData ?? null),
    [mapData, isTutorialMobile]
  );
  const [mounted, setMounted] = useState(false);

  const themeOptions = useMemo(
    () => [{ name: PROFILE_THEME_NAME }, { name: DEFAULT_THEME_NAME }, ...MIND_THEMES],
    []
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open || !mounted) return;
    setLeftOpen(!isTutorialMobile);
    const tutorialCompleted = getMapTutorialCompleted(
      isTutorialMobile ? "mobile" : "desktop"
    );
    setTutorialOpen(!tutorialCompleted);
    setTutorialStepIndex(0);
    const timer = window.setTimeout(() => {
      if (isTutorialMobile) {
        mindRef.current?.collapseAll?.();
      } else {
        mindRef.current?.collapseToLevel?.(2);
      }
      mindRef.current?.centerMap?.();
      const zoomCount = isTutorialMobile ? 5 : 5;
      for (let i = 0; i < zoomCount; i += 1) {
        window.setTimeout(() => {
          mindRef.current?.zoomIn?.();
        }, 120 + i * 140);
      }
    }, 220);
    const mobileCollapseRetry = isTutorialMobile
      ? window.setTimeout(() => {
          mindRef.current?.collapseAll?.();
          mindRef.current?.centerMap?.();
        }, 220 + 120 + 5 * 140 + 240)
      : null;
    return () => {
      window.clearTimeout(timer);
      if (mobileCollapseRetry) {
        window.clearTimeout(mobileCollapseRetry);
      }
    };
  }, [open, mounted, draft?.id, language, isTutorialMobile]);

  useEffect(() => {
    if (isTutorialMobile) {
      setMobileToolbarCollapsed(false);
    }
  }, [isTutorialMobile]);

  useEffect(() => {
    if (!desktopMoreOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (desktopMoreRef.current?.contains(target)) return;
      setDesktopMoreOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [desktopMoreOpen]);

  const closeSearch = () => {
    setSearchOpen(false);
    setSearchQuery("");
    setSearchResults([]);
    setSearchIndex(0);
    searchIndexRef.current = 0;
    mindRef.current?.clearSearchHighlights?.();
  };

  const stepSearch = (dir: 1 | -1) => {
    if (!searchResults.length) return;
    const current = searchIndexRef.current;
    const next = (current + dir + searchResults.length) % searchResults.length;
    searchIndexRef.current = next;
    setSearchIndex(next);
    const id = searchResults[next]?.id;
    if (id) {
      mindRef.current?.setSearchActive?.(id);
      mindRef.current?.focusNodeById?.(id);
    }
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
    if (!searchOpen) return;
    const q = searchQuery.trim();
    if (!q) {
      setSearchResults([]);
      setSearchIndex(0);
      searchIndexRef.current = 0;
      mindRef.current?.clearSearchHighlights?.();
      return;
    }

    const matches = mindRef.current?.findNodesByQuery?.(q, {
      includeNotes: true,
    }) ?? [];
    setSearchResults(matches);
    setSearchIndex(0);
    searchIndexRef.current = 0;
    mindRef.current?.setSearchHighlights?.(
      matches.map((item) => item.id),
      q
    );
    if (matches[0]?.id) {
      mindRef.current?.setSearchActive?.(matches[0].id);
      mindRef.current?.focusNodeById?.(matches[0].id);
    }
  }, [searchOpen, searchQuery]);

  if (!open || !draft || !mounted) return null;

  const headerTitle = title ?? draft.title ?? t("dialog.title");

  const resolvedThemeName =
    themeName === PROFILE_THEME_NAME ? profileThemeName : themeName;
  const appliedTheme =
    resolvedThemeName && resolvedThemeName !== DEFAULT_THEME_NAME
      ? MIND_THEME_BY_NAME[resolvedThemeName]
      : undefined;

  const handleExportPng = async () => {
    const blob = await mindRef.current?.exportPng?.();
    if (!blob) return;
    const safeTitle = (headerTitle ?? "map").replace(/[\\/:*?"<>|]+/g, "-").trim() || "map";
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
    const steps = getMapTutorialSteps(tTutorial, {
      platform: isTutorialMobile ? "mobile" : "desktop",
      termsTabId: DEMO_TERMS_TAB_ID,
      leftPanelButtonId: DEMO_LEFT_PANEL_BUTTON_ID,
    });
    if (tutorialStepIndex >= steps.length - 1) {
      setMapTutorialCompleted(true, isTutorialMobile ? "mobile" : "desktop");
      setTutorialOpen(false);
      return;
    }
    setTutorialStepIndex((prev) => prev + 1);
  };

  const handleGoHome = () => {
    toast.message(
      t("toasts.demoFinished")
    );
    window.setTimeout(() => {
      router.push(`/${language}`);
    }, 900);
  };

  const handleStartService = () => {
    router.push(`/${language}/video-to-map`);
  };

  const handleOpenDemoShareGuide = () => {
    setShareGuideOpen(true);
  };

  const handleRestartTutorial = () => {
    setTutorialStepIndex(0);
    setTutorialOpen(true);
  };

  const shareDialogMessages = messages.DemoFullscreenDialog?.shareDialog;
  const shareDialogTitle =
    shareDialogMessages?.title ??
    (language === "ko"
      ? "이 구조맵은 예시용입니다"
      : "This Structure Map is for demo only");
  const shareDialogDescription =
    shareDialogMessages?.description ??
    (language === "ko"
      ? "실제 서비스에서는 구조맵을 링크로 공유하고 다른 사람과 함께 볼 수 있어요. 서비스를 시작하면 내 구조맵의 공유 링크를 바로 만들 수 있습니다."
      : "In the full service, you can share your Structure Map by link and view it together with others. Start using Brify to create a share link for your own map.");
  const shareDialogAction =
    shareDialogMessages?.action ??
    (language === "ko" ? "서비스 시작하기" : "Start Using Brify");
  const shareDialogCancel =
    shareDialogMessages?.cancel ?? (language === "ko" ? "닫기" : "Close");
  const searchShellClass =
    "relative z-[40] flex h-8 w-[228px] items-center gap-2 rounded-lg border border-slate-400 bg-white px-2.5 text-[11px] text-slate-700 shadow-[0_8px_20px_-18px_rgba(15,23,42,0.14)] dark:border-white/28 dark:bg-[#0b1220] dark:text-white dark:shadow-[0_16px_36px_-30px_rgba(2,6,23,0.7)]";
  const mobileSearchShellClass =
    "relative z-[40] flex h-8 w-[min(72vw,290px)] items-center gap-1.5 rounded-lg border border-slate-400 bg-white px-2 text-[11px] text-slate-700 dark:border-white/28 dark:bg-[#0b1220] dark:text-white";
  const plainHeaderIconButtonClass =
    "inline-flex h-8 w-8 items-center justify-center text-slate-500 transition hover:text-slate-900 dark:text-white/65 dark:hover:text-white";
  const controlPanelClass =
    "rounded-2xl border border-slate-200/80 bg-white/95 p-1.5 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.24)] backdrop-blur-md dark:border-white/10 dark:bg-[#0f172a]/95 dark:shadow-[0_22px_52px_-28px_rgba(2,6,23,0.92)]";
  const controlMenuItemClass =
    "w-full rounded-xl px-3 py-2 text-left text-[12px] font-semibold text-slate-700 transition hover:bg-slate-100/90 hover:text-slate-900 dark:text-white/80 dark:hover:bg-white/10 dark:hover:text-white";
  const controlMenuItemContentClass = "flex items-center gap-2.5";

  return createPortal(
    <div className="fixed left-0 top-0 z-[120] h-screen w-screen max-w-none bg-black/70" role="dialog" aria-modal="true" aria-label={headerTitle}>
      <div className="relative h-full w-full overflow-hidden bg-white [--header-h:68px] dark:bg-[#0b1220]">
        <FullscreenHeader
          title={headerTitle}
          onClose={handleGoHome}
          closeLabel={t("actions.closeMap")}
          left={
            !leftOpen ? (
              <button
                id={DEMO_LEFT_PANEL_BUTTON_ID}
                type="button"
                onClick={() => setLeftOpen(true)}
                className="
                  inline-flex h-8 w-10 items-center justify-center
                  rounded-l-none rounded-r-full
                  bg-blue-600 text-white
                  shadow-sm transition hover:bg-blue-700
                  dark:bg-blue-500/70 dark:text-white dark:hover:bg-blue-500
                "
                aria-label={t("actions.infoPanel")}
                title={t("actions.infoPanel")}
              >
                <span className="sr-only">{t("actions.infoPanel")}</span>
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
                    }
                  }}
                  placeholder={tMap("actions.searchPlaceholder")}
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
                    aria-label={tMap("actions.clearSearch")}
                    title={tMap("actions.clearSearch")}
                  >
                    <Icon icon="mdi:close" className="h-3.5 w-3.5" />
                  </button>
                ) : null}
                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => stepSearch(-1)}
                    className="inline-flex h-5 w-5 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-white/65 dark:hover:bg-white/10 dark:hover:text-white"
                    aria-label={tMap("actions.previousSearchResult")}
                    title={tMap("actions.previousSearchResult")}
                  >
                    <Icon icon="mdi:chevron-up" className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => stepSearch(1)}
                    className="inline-flex h-5 w-5 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-white/65 dark:hover:bg-white/10 dark:hover:text-white"
                    aria-label={tMap("actions.nextSearchResult")}
                    title={tMap("actions.nextSearchResult")}
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
                    ? tMap("moreMenu.hideTimestamps")
                    : tMap("moreMenu.showTimestamps")
                }
                title={
                  showTimestamps
                    ? tMap("moreMenu.hideTimestamps")
                    : tMap("moreMenu.showTimestamps")
                }
              >
                <Icon
                  icon="mdi:timeline-clock-outline"
                  className={`h-4 w-4 ${showTimestamps ? "text-sky-700 dark:text-sky-200" : ""}`}
                />
              </button>
            </div>

            <div className="hidden sm:flex items-center gap-1.5">
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
                    }
                  }}
                  placeholder={tMap("actions.searchPlaceholder")}
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
                    aria-label={tMap("actions.clearSearch")}
                    title={tMap("actions.clearSearch")}
                  >
                    <Icon icon="mdi:close" className="h-3.5 w-3.5" />
                  </button>
                ) : null}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => stepSearch(-1)}
                    className="inline-flex h-6 w-6 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-white/65 dark:hover:bg-white/10 dark:hover:text-white"
                    aria-label={tMap("actions.previousSearchResult")}
                    title={tMap("actions.previousSearchResult")}
                  >
                    <Icon icon="mdi:chevron-up" className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => stepSearch(1)}
                    className="inline-flex h-6 w-6 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-white/65 dark:hover:bg-white/10 dark:hover:text-white"
                    aria-label={tMap("actions.nextSearchResult")}
                    title={tMap("actions.nextSearchResult")}
                  >
                    <Icon icon="mdi:chevron-down" className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <button
                    type="button"
                    onClick={() => setShowTimestamps((prev) => !prev)}
                    className={plainHeaderIconButtonClass}
                    aria-label={
                      showTimestamps
                        ? tMap("moreMenu.hideTimestamps")
                        : tMap("moreMenu.showTimestamps")
                    }
                    title={
                      showTimestamps
                        ? tMap("moreMenu.hideTimestamps")
                        : tMap("moreMenu.showTimestamps")
                    }
                  >
                    <Icon
                      icon="mdi:timeline-clock-outline"
                      className={`h-4 w-4 ${showTimestamps ? "text-sky-700 dark:text-sky-200" : ""}`}
                    />
                  </button>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content
                    side="bottom"
                    sideOffset={8}
                    className="z-[260] rounded-xl bg-slate-950 px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-[0_14px_32px_-18px_rgba(15,23,42,0.65)] dark:bg-white dark:text-slate-950"
                  >
                    {showTimestamps
                      ? tMap("moreMenu.hideTimestamps")
                      : tMap("moreMenu.showTimestamps")}
                    <Tooltip.Arrow className="fill-slate-950 dark:fill-white" />
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <button
                    type="button"
                    onClick={handleRestartTutorial}
                    className={plainHeaderIconButtonClass}
                    aria-label={tMap("actions.tutorial")}
                    title={tMap("actions.tutorial")}
                  >
                    <Icon icon="mdi:school-outline" className="h-4 w-4" />
                  </button>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content
                    side="bottom"
                    sideOffset={8}
                    className="z-[260] rounded-xl bg-slate-950 px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-[0_14px_32px_-18px_rgba(15,23,42,0.65)] dark:bg-white dark:text-slate-950"
                  >
                    {tMap("actions.tutorial")}
                    <Tooltip.Arrow className="fill-slate-950 dark:fill-white" />
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
              <div className="relative" ref={desktopMoreRef}>
                <button
                  type="button"
                  onClick={() => setDesktopMoreOpen((v) => !v)}
                  className={plainHeaderIconButtonClass}
                  aria-label={tMap("actions.more")}
                  title={tMap("actions.more")}
                >
                  <Icon icon="mdi:dots-horizontal" className="h-4 w-4" />
                </button>
                {desktopMoreOpen ? (
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
                        <span>{tMap("moreMenu.layoutLeft")}</span>
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
                        <span>{tMap("moreMenu.layoutRight")}</span>
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
                        <span>{tMap("moreMenu.layoutBoth")}</span>
                      </span>
                    </button>
                    <div className="my-1 h-px bg-neutral-200 dark:bg-white/10" />
                    <div className="px-3 py-2">
                      <div className="text-[11px] font-semibold text-slate-500 dark:text-white/60">
                        {tMap("moreMenu.theme")}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {themeOptions.map((theme) => {
                          const themeLabel =
                            theme.name === PROFILE_THEME_NAME
                              ? tMap("moreMenu.profileTheme")
                              : theme.name === DEFAULT_THEME_NAME
                              ? tMap("moreMenu.defaultTheme")
                              : theme.name;
                          return (
                            <button
                              key={theme.name}
                              type="button"
                              onClick={() => {
                                setThemeName(theme.name);
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
                        setShowTimestamps((prev) => !prev);
                      }}
                      className={controlMenuItemClass}
                    >
                      {showTimestamps
                        ? tMap("moreMenu.hideTimestamps")
                        : tMap("moreMenu.showTimestamps")}
                    </button>
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
                        <span>{tMap("moreMenu.savePng")}</span>
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDesktopMoreOpen(false);
                        handleOpenDemoShareGuide();
                      }}
                      className={controlMenuItemClass}
                    >
                      <span className={controlMenuItemContentClass}>
                        <Icon icon="mdi:share-variant-outline" className="h-4 w-4 shrink-0 text-slate-400 dark:text-white/50" />
                        <span>{tMap("moreMenu.share")}</span>
                      </span>
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </>
        }
      />

        <div className="relative w-full" style={{ height: "calc(100% - var(--header-h))" }}>
          <div className="absolute inset-0 bg-[#f6f7fb] dark:bg-[#070c16]" />
          <div className="pointer-events-none absolute inset-0 opacity-60 [background-image:linear-gradient(to_right,rgba(15,23,42,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.06)_1px,transparent_1px)] [background-size:28px_28px] dark:opacity-30 dark:[background-image:linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)]" />
          <div className="pointer-events-none absolute inset-0 [mask-image:radial-gradient(closest-side,black,transparent)] bg-[radial-gradient(900px_520px_at_50%_30%,rgba(59,130,246,0.10),transparent_62%)] dark:bg-[radial-gradient(900px_520px_at_50%_30%,rgba(56,189,248,0.10),transparent_62%)]" />

          <div className="absolute inset-0 p-0">
            <div className="h-full w-full rounded-b-2xl border-x border-b border-slate-400 bg-white/65 shadow-sm dark:border-white/20 dark:bg-white/[0.03]">
              <ClientMindElixir
                ref={mindRef}
                mode={resolvedTheme === "dark" ? "dark" : "light"}
                editMode={editMode}
                theme={appliedTheme}
                data={initialMapData ?? undefined}
                loading={false}
                placeholderData={loadingMindElixir}
                showMiniMap={!isTutorialMobile}
                showTimestamps={showTimestamps}
                openMenuOnClick={false}
                disableDirectContextMenu
                showSelectionContextMenuButton
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleStartService}
            className="absolute bottom-[228px] right-5 z-[20] hidden items-center gap-2 rounded-[22px] bg-[linear-gradient(135deg,#2563eb_0%,#0ea5e9_42%,#14b8a6_100%)] px-6 py-4 text-[17px] font-black tracking-[-0.02em] text-white shadow-[0_28px_60px_-24px_rgba(14,165,233,0.78)] transition-transform hover:scale-[1.03] hover:shadow-[0_32px_70px_-24px_rgba(37,99,235,0.82)] sm:inline-flex"
            title={t("actions.startService")}
          >
            <Icon icon="mdi:rocket-launch" className="h-5 w-5" />
            {t("actions.startService")}
          </button>

          <div className="pointer-events-none absolute bottom-4 left-4 z-[22]">
            <button
              type="button"
              onClick={handleGoHome}
              className="pointer-events-auto inline-flex items-center gap-1 rounded-full border border-sky-200/90 bg-sky-50/95 px-3.5 py-2 text-[13px] font-extrabold tracking-[-0.02em] text-slate-800 shadow-[0_18px_40px_-18px_rgba(15,23,42,0.5)] backdrop-blur-sm transition hover:border-sky-300 hover:bg-sky-100/95 dark:border-white/14 dark:bg-[#0f172a]/90 dark:text-white/88 dark:hover:border-white/22 dark:hover:bg-[#111c31] sm:gap-1.5 sm:px-6 sm:py-3.5 sm:text-[18px]"
            >
              <div className="relative h-7 w-[36px] shrink-0 sm:h-11 sm:w-[56px]">
                <Image
                  src="/images/newlogo.png"
                  alt="Brify logo"
                  fill
                  sizes="(max-width: 640px) 36px, 56px"
                  className="object-contain"
                />
              </div>
              <span>{language === "ko" ? "브라이피" : "Brify"}</span>
            </button>
          </div>

          <div className="pointer-events-auto absolute right-3 top-16 z-[25] flex flex-col gap-2 sm:hidden">
            <button
              type="button"
              onClick={() => setMobileToolbarCollapsed((prev) => !prev)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-400 bg-white/95 text-neutral-700 shadow-md dark:border-white/20 dark:bg-[#0b1220]/85 dark:text-white/80"
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

          <DemoLeftPanel
            open={leftOpen}
            onClose={() => setLeftOpen(false)}
            map={draft}
            language={language}
          />

          {tutorialOpen ? (
            <MapTutorialOverlay
              stepIndex={tutorialStepIndex}
              steps={getMapTutorialSteps(tTutorial, {
                platform: isTutorialMobile ? "mobile" : "desktop",
                termsTabId: DEMO_TERMS_TAB_ID,
                leftPanelButtonId: DEMO_LEFT_PANEL_BUTTON_ID,
              })}
              onNext={handleTutorialNext}
              onSkip={() => setTutorialOpen(false)}
            />
          ) : null}

          <ConfirmDialog
            open={shareGuideOpen}
            onOpenChange={setShareGuideOpen}
            onConfirm={() => {
              setShareGuideOpen(false);
              handleStartService();
            }}
            title={shareDialogTitle}
            description={shareDialogDescription}
            actionLabel={shareDialogAction}
            cancelLabel={shareDialogCancel}
            tone="primary"
            titleClassName="font-semibold"
            descriptionClassName="text-[14px] md:text-[15px] font-medium leading-relaxed text-neutral-700 dark:text-white/82"
          />
        </div>
      </div>
    </div>,
    document.body
  );
}
