"use client";

import dynamic from "next/dynamic";
import { Icon } from "@iconify/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useMessages, useTranslations } from "next-intl";
import { toast } from "sonner";

import FullscreenHeader from "@/components/maps/FullscreenHeader";
import MapControls from "@/components/maps/MapControls";
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
import { loadingMindElixir } from "@/app/lib/g6/sampleData";
import {
  getMapTutorialCompleted,
  setMapTutorialCompleted,
} from "@/app/lib/mapTutorialState";
import type { ClientMindElixirHandle } from "@/components/ClientMindElixir";
import type { MapDraft } from "@/app/[locale]/(main)/video-to-map/types";

const PROFILE_THEME_NAME = "내설정테마";

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

const DEMO_EDIT_BUTTON_ID = "demo-edit-button";
const DEMO_TERMS_TAB_ID = "demo-terms-tab";

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

  useEffect(() => {
    setNotes(getDemoNotes(t));
    setTerms(getDemoTerms(t));
    setActiveTab("info");
  }, [language, map.id, t]);

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
      className={`
        absolute left-0 top-0 z-[18] h-full
        transition-transform duration-300
        ${open ? "translate-x-0" : "-translate-x-[calc(100%+28px)]"}
      `}
    >
      <div className="relative flex h-full w-[min(420px,calc(100vw-18px))] max-w-full flex-col border-r border-slate-400 bg-white/96 shadow-[0_20px_50px_-36px_rgba(15,23,42,0.55)] dark:border-white/20 dark:bg-[#0b1220]/96 dark:shadow-[0_32px_100px_-70px_rgba(0,0,0,0.95)]">
        <div className="border-b border-slate-400 px-3 pb-3 pt-3 sm:px-4 sm:pt-4 dark:border-white/20">
          <div className="flex items-start gap-2">
            <div className="inline-flex rounded-full border border-slate-400 bg-neutral-50 p-1 dark:border-white/20 dark:bg-white/[0.04]">
              {[
                ["info", t("tabs.info")],
                ["notes", t("tabs.notes")],
                ["terms", t("tabs.terms")],
              ].map(([tab, label]) => (
                <button
                  key={tab}
                  type="button"
                  id={tab === "terms" ? DEMO_TERMS_TAB_ID : undefined}
                  onClick={() =>
                    setActiveTab(tab as "info" | "notes" | "terms")
                  }
                  className={`rounded-full px-2.5 py-1 text-[13px] font-semibold transition-colors sm:px-3 sm:py-1.5 ${
                    activeTab === tab
                      ? "bg-blue-600 text-[14px] font-extrabold text-white sm:text-[16px] dark:bg-blue-500"
                      : "text-[14px] font-bold text-neutral-700 hover:text-neutral-900 sm:text-[16px] dark:text-white/80 dark:hover:text-white"
                  }`}
                >
                  {label}
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
  const t = useTranslations("DemoFullscreenDialog");
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
  const [leftOpen, setLeftOpen] = useState(true);
  const [editMode, setEditMode] = useState<"view" | "edit">("view");
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [tutorialStepIndex, setTutorialStepIndex] = useState(0);
  const [shareGuideOpen, setShareGuideOpen] = useState(false);
  const [mobileToolbarCollapsed, setMobileToolbarCollapsed] = useState(false);
  const [themeName, setThemeName] = useState<string>(
    profileThemeName ? PROFILE_THEME_NAME : DEFAULT_THEME_NAME
  );
  const mindRef = useRef<ClientMindElixirHandle | null>(null);
  const [mounted, setMounted] = useState(false);
  const lastEditHintRef = useRef(0);

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
      mindRef.current?.collapseToLevel?.(2);
      mindRef.current?.centerMap?.();
      window.setTimeout(() => {
        mindRef.current?.zoomIn?.();
        window.setTimeout(() => {
          mindRef.current?.zoomIn?.();
          window.setTimeout(() => {
            mindRef.current?.zoomIn?.();
            window.setTimeout(() => {
              mindRef.current?.zoomIn?.();
              window.setTimeout(() => {
                mindRef.current?.zoomIn?.();
              }, 140);
            }, 140);
          }, 140);
        }, 140);
      }, 120);
    }, 220);
    return () => window.clearTimeout(timer);
  }, [open, mounted, draft?.id, language, isTutorialMobile]);

  useEffect(() => {
    if (isTutorialMobile) {
      setEditMode("edit");
      setMobileToolbarCollapsed(true);
    }
  }, [isTutorialMobile]);

  if (!open || !draft || !mounted) return null;

  const resolvedThemeName =
    themeName === PROFILE_THEME_NAME ? profileThemeName : themeName;
  const appliedTheme =
    resolvedThemeName && resolvedThemeName !== DEFAULT_THEME_NAME
      ? MIND_THEME_BY_NAME[resolvedThemeName]
      : undefined;

  const handleExportPng = async () => {
    const blob = await mindRef.current?.exportPng?.();
    if (!blob) return;
    const safeTitle = (title ?? "map").replace(/[\\/:*?"<>|]+/g, "-").trim() || "map";
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
      editButtonId: DEMO_EDIT_BUTTON_ID,
      termsTabId: DEMO_TERMS_TAB_ID,
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
      ? "이 구조맵은 데모용입니다"
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

  return createPortal(
    <div className="fixed left-0 top-0 z-[120] h-screen w-screen max-w-none bg-black/70" role="dialog" aria-modal="true" aria-label={title ?? t("dialog.title")}>
      <div className="relative h-full w-full overflow-hidden bg-white [--header-h:68px] dark:bg-[#0b1220]">
        <FullscreenHeader
          title={title ?? t("dialog.title")}
          onClose={handleGoHome}
          closeLabel={t("actions.closeMap")}
          left={
            <button
              type="button"
              onClick={() => setLeftOpen((prev) => !prev)}
              className="inline-flex items-center p-1 text-neutral-800 hover:text-neutral-900 dark:text-white/85 dark:hover:text-white"
              aria-label={t("actions.infoPanel")}
              title={t("actions.infoPanel")}
            >
              <span className="sr-only">{t("actions.infoPanel")}</span>
              {leftOpen ? (
                <Icon icon="mdi:chevron-left" className="h-8 w-8" />
              ) : (
                <span className="inline-flex h-4 w-5 flex-col justify-between">
                  <span className="h-[2px] w-full bg-[#111827] dark:bg-white" />
                  <span className="h-[2px] w-full bg-[#111827] dark:bg-white" />
                  <span className="h-[2px] w-full bg-[#111827] dark:bg-white" />
                </span>
              )}
            </button>
          }
          right={
            <div className="hidden items-center gap-2 sm:flex">
              <MapControls
                editMode={editMode}
                panMode={false}
                themes={themeOptions}
                currentThemeName={themeName}
                onToggleEdit={() =>
                  setEditMode((mode) => (mode === "view" ? "edit" : "view"))
                }
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
                onPublish={() => {}}
                onShare={handleOpenDemoShareGuide}
                onOpenTutorial={handleRestartTutorial}
                highlightEditToggle={tutorialOpen && tutorialStepIndex === 0}
                modeToggleTutorialId="demo-mode-toggle"
                editButtonTutorialId={DEMO_EDIT_BUTTON_ID}
                editButtonId={DEMO_EDIT_BUTTON_ID}
                onExportPng={handleExportPng}
                onCloseMap={handleGoHome}
                placement="inline"
                hidePanToggle
              />
            </div>
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
                data={mapData ?? undefined}
                loading={false}
                placeholderData={loadingMindElixir}
                onViewModeEditAttempt={() => {
                  if (editMode !== "view") return;
                  const now = Date.now();
                  if (now - lastEditHintRef.current < 5000) return;
                  lastEditHintRef.current = now;
                  toast.message(t("toasts.editModeRequired"));
                }}
              />
            </div>
          </div>

          <div className="absolute right-4 top-3 z-[15] hidden sm:block">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-400 bg-white/80 px-3 py-1 text-[14px] font-extrabold text-neutral-700 dark:border-white/20 dark:bg-[#0b1220]/60 dark:text-white/85">
              <Icon icon="mdi:gesture-tap" className="h-4 w-4" />
              {editMode === "edit" ? t("badges.editMode") : t("badges.viewMode")}
            </span>
          </div>

          <button
            type="button"
            onClick={handleStartService}
            className="absolute bottom-[228px] right-5 z-[20] inline-flex items-center gap-2 rounded-[22px] bg-[linear-gradient(135deg,#2563eb_0%,#0ea5e9_42%,#14b8a6_100%)] px-6 py-4 text-[17px] font-black tracking-[-0.02em] text-white shadow-[0_28px_60px_-24px_rgba(14,165,233,0.78)] transition-transform hover:scale-[1.03] hover:shadow-[0_32px_70px_-24px_rgba(37,99,235,0.82)]"
            title={t("actions.startService")}
          >
            <Icon icon="mdi:rocket-launch" className="h-5 w-5" />
            {t("actions.startService")}
          </button>

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
                editButtonId: DEMO_EDIT_BUTTON_ID,
                termsTabId: DEMO_TERMS_TAB_ID,
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
