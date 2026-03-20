"use client";

import dynamic from "next/dynamic";
import { Icon } from "@iconify/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTheme } from "next-themes";

import FullscreenHeader from "@/components/maps/FullscreenHeader";
import MapControls from "@/components/maps/MapControls";
import NoteItem, { type NoteItemData } from "@/components/maps/NoteItem";
import TermsBlock from "@/components/maps/TermsBlock";
import {
  DEFAULT_THEME_NAME,
  MIND_THEMES,
  MIND_THEME_BY_NAME,
} from "@/components/maps/themes";
import { useMindThemePreference } from "@/components/maps/MindThemePreferenceProvider";
import { loadingMindElixir } from "@/app/lib/g6/sampleData";
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

type DemoLanguage = "ko" | "en";

type DemoTermItem = {
  term: string;
  meaning: string;
  isNew?: boolean;
};

const DEMO_NOTES_BY_LANGUAGE: Record<DemoLanguage, NoteItemData[]> = {
  ko: [
    {
      id: "demo-note-1",
      text: "첫 번째 식사와 두 번째 식사의 시간대가 명확해서 하루 흐름이 한눈에 들어온다.",
      createdAt: Date.now() - 1000 * 60 * 18,
      createdAtLabel: "방금 전",
    },
    {
      id: "demo-note-2",
      text: "OMAD를 하지 않는 이유가 체중 유지라는 점이 핵심 포인트다.",
      createdAt: Date.now() - 1000 * 60 * 42,
      createdAtLabel: "방금 전",
    },
  ],
  en: [
    {
      id: "demo-note-1",
      text: "The meal timing makes the daily fasting rhythm easy to follow at a glance.",
      createdAt: Date.now() - 1000 * 60 * 18,
      createdAtLabel: "Just now",
    },
    {
      id: "demo-note-2",
      text: "A key takeaway is that he avoids OMAD to maintain weight, not because of hunger.",
      createdAt: Date.now() - 1000 * 60 * 42,
      createdAtLabel: "Just now",
    },
  ],
};

const DEMO_TERMS_BY_LANGUAGE: Record<DemoLanguage, DemoTermItem[]> = {
  ko: [
    {
      term: "OMAD",
      meaning: "하루 한 끼만 먹는 식사 방식이다.",
    },
    {
      term: "grass-fed",
      meaning: "곡물보다 목초 위주로 사육된 재료를 뜻하며, 영상에서는 품질 기준으로 반복해서 언급된다.",
    },
    {
      term: "pasture-raised",
      meaning: "방목 환경에서 키운 달걀이나 가축을 뜻하며, 식재료 선택 기준으로 강조된다.",
    },
  ],
  en: [
    {
      term: "OMAD",
      meaning: "A one-meal-a-day eating pattern.",
    },
    {
      term: "grass-fed",
      meaning: "Used as a quality standard for animal-based foods in the video.",
    },
    {
      term: "pasture-raised",
      meaning: "A sourcing standard for eggs and livestock that is emphasized throughout the routine.",
    },
  ],
};

function safeDateLabel(value?: number) {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  } catch {
    return "-";
  }
}

function sourceTypeLabel(sourceType?: MapDraft["sourceType"]) {
  switch (sourceType) {
    case "youtube":
      return "youtube";
    case "website":
      return "website";
    case "file":
      return "file";
    default:
      return "manual";
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
  const [activeTab, setActiveTab] = useState<"info" | "notes" | "terms">("info");
  const [noteText, setNoteText] = useState("");
  const [notes, setNotes] = useState<NoteItemData[]>(() =>
    DEMO_NOTES_BY_LANGUAGE[language].map((item) => ({ ...item }))
  );
  const [terms, setTerms] = useState<DemoTermItem[]>(() =>
    DEMO_TERMS_BY_LANGUAGE[language].map((item) => ({ ...item }))
  );

  useEffect(() => {
    setNotes(DEMO_NOTES_BY_LANGUAGE[language].map((item) => ({ ...item })));
    setTerms(DEMO_TERMS_BY_LANGUAGE[language].map((item) => ({ ...item })));
    setActiveTab("info");
  }, [language, map.id]);

  const createdLabel = useMemo(() => safeDateLabel(map.createdAt), [map.createdAt]);
  const updatedLabel = useMemo(() => safeDateLabel(map.updatedAt), [map.updatedAt]);

  const addNote = () => {
    const trimmed = noteText.trim();
    if (!trimmed) return;
    const createdAt = Date.now();
    setNotes((prev) => [
      {
        id: `demo-note-${createdAt}`,
        text: trimmed,
        createdAt,
        createdAtLabel: language === "ko" ? "방금 전" : "Just now",
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
          meaning:
            language === "ko"
              ? "영상에서 커피에 넣는 감미료로 언급된다."
              : "Mentioned in the video as the sweetener added to coffee.",
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
        meaning:
          language === "ko"
            ? "데모용으로 추가된 사용자 지정 용어입니다."
            : "A custom term added in the demo view.",
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
      <div className="relative flex h-full w-[340px] flex-col border-r border-slate-400 bg-white/96 shadow-[0_20px_50px_-36px_rgba(15,23,42,0.55)] backdrop-blur dark:border-white/20 dark:bg-[#0b1220]/96 dark:shadow-[0_32px_100px_-70px_rgba(0,0,0,0.95)]">
        <div className="border-b border-slate-400 px-4 pb-3 pt-4 dark:border-white/20">
          <div className="flex items-start gap-2">
            <div className="inline-flex rounded-full border border-slate-400 bg-neutral-50 p-1 dark:border-white/20 dark:bg-white/[0.04]">
              {[
                ["info", "정보"],
                ["notes", "노트"],
                ["terms", "용어"],
              ].map(([tab, label]) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() =>
                    setActiveTab(tab as "info" | "notes" | "terms")
                  }
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                    activeTab === tab
                      ? "bg-blue-600 text-white dark:bg-blue-500"
                      : "text-neutral-600 hover:text-neutral-900 dark:text-white/70 dark:hover:text-white"
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
              aria-label="닫기"
              title="닫기"
            >
              <Icon icon="mdi:chevron-left" className="h-5 w-5" />
            </button>
          </div>

          {activeTab === "info" && (
            <div className="mt-3 whitespace-normal break-words text-sm font-semibold text-neutral-900 dark:text-white/90">
              {map.title}
            </div>
          )}
        </div>

        <div className="relative min-h-0 flex-1 overflow-y-auto px-4 py-4">
          {activeTab === "info" ? (
            <>
              <div className="mb-3 text-[11px] text-neutral-400 dark:text-white/40">
                <div>
                  생성 {createdLabel} · 수정 {updatedLabel}
                </div>
                <div className="mt-0.5">
                  크레딧:{" "}
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
                    <h3 className="text-xs font-semibold text-neutral-900 dark:text-white/85">
                      한문단요약
                    </h3>
                  </div>
                  <div className="rounded-3xl border border-slate-400 bg-blue-50/60 p-3.5 text-[12px] leading-5 text-neutral-700 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.2)] dark:border-white/20 dark:bg-blue-500/10 dark:text-white/80 dark:shadow-[0_34px_120px_-70px_rgba(0,0,0,0.55)]">
                    <p className="whitespace-pre-wrap break-words">{map.summary}</p>
                  </div>
                </section>
              ) : null}

              <DemoSection title="출처">
                <div className="flex gap-3">
                  <div className="relative h-16 w-28 flex-shrink-0 overflow-hidden rounded-2xl border border-slate-400 bg-neutral-50 dark:border-white/20 dark:bg-white/[0.06]">
                    {map.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={map.thumbnailUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[11px] text-neutral-400 dark:text-white/45">
                        thumbnail
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <DemoRow
                      icon="mdi:youtube"
                      label="출처 타입"
                      value={sourceTypeLabel(map.sourceType)}
                    />
                    <DemoRow
                      icon="mdi:account-circle-outline"
                      label="채널"
                      value={map.channelName ?? "-"}
                    />

                    <div className="mt-1">
                      <div className="text-[11px] text-neutral-500 dark:text-white/60">
                        원본 링크
                      </div>
                      {map.sourceUrl ? (
                        <a
                          href={map.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-0.5 block truncate text-xs font-semibold text-blue-700 hover:underline dark:text-sky-200"
                          title={map.sourceUrl}
                        >
                          {map.sourceUrl}
                        </a>
                      ) : (
                        <div className="mt-0.5 text-xs text-neutral-700 dark:text-white/85">
                          -
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </DemoSection>

              <DemoSection title="태그">
                {map.tags?.length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {map.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-slate-400 bg-neutral-50 px-2 py-0.5 text-[11px] font-semibold text-neutral-700 dark:border-white/20 dark:bg-white/[0.06] dark:text-white/80"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                ) : null}
              </DemoSection>

              <DemoSection title="설명">
                <div className="whitespace-pre-wrap break-words text-xs text-neutral-700 dark:text-white/80">
                  {map.description ?? "-"}
                </div>
              </DemoSection>
            </>
          ) : activeTab === "notes" ? (
            <div className="flex flex-col gap-3">
              <div className="text-xs text-neutral-500 dark:text-white/60">
                중요한 노드를 읽으면서 떠오른 생각을 바로 남길 수 있어요.
              </div>
              <div className="rounded-2xl border border-slate-400 bg-white p-3 dark:border-white/20 dark:bg-white/[0.04]">
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="이 노드에서 떠오른 생각을 적어보세요."
                  className="w-full rounded-xl border border-slate-400 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200 dark:border-white/20 dark:bg-white/[0.06] dark:text-white dark:focus:ring-blue-500/20"
                  rows={3}
                />
                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={addNote}
                    className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-400 bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 dark:border-white/20 dark:bg-blue-500"
                  >
                    <Icon icon="mdi:plus" className="h-4 w-4" />
                    노트 추가
                  </button>
                </div>
              </div>

              {notes.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-400 bg-neutral-50 p-4 text-sm text-neutral-500 dark:border-white/20 dark:bg-white/[0.04] dark:text-white/60">
                  아직 노트가 없습니다.
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
              <div className="mb-3 rounded-2xl border border-slate-400 bg-sky-50/70 px-3 py-2 text-[11px] text-slate-700 shadow-[0_16px_30px_-24px_rgba(14,116,144,0.45)] dark:border-white/20 dark:bg-sky-500/10 dark:text-white/75">
                <div className="flex items-center gap-2">
                  <Icon icon="mdi:sparkles" className="h-4 w-4 text-sky-500 dark:text-sky-300" />
                  <span className="font-semibold">
                    AI가 핵심 용어를 자동으로 추출해 이해를 돕습니다.
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
        <h3 className="text-xs font-semibold text-neutral-900 dark:text-white/85">
          {title}
        </h3>
      </div>
      <div className="rounded-3xl border border-slate-400 bg-white p-3 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.25)] dark:border-white/20 dark:bg-white/[0.04] dark:shadow-[0_34px_120px_-70px_rgba(0,0,0,0.55)]">
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
        <div className="text-[11px] text-neutral-500 dark:text-white/60">{label}</div>
        <div className="truncate text-xs font-semibold text-neutral-800 dark:text-white/85">
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
  const { profileThemeName } = useMindThemePreference();
  const { resolvedTheme } = useTheme();
  const [leftOpen, setLeftOpen] = useState(true);
  const [editMode, setEditMode] = useState<"view" | "edit">("view");
  const [panMode, setPanMode] = useState(false);
  const [themeName, setThemeName] = useState<string>(
    profileThemeName ? PROFILE_THEME_NAME : DEFAULT_THEME_NAME
  );
  const mindRef = useRef<ClientMindElixirHandle | null>(null);
  const [mounted, setMounted] = useState(false);

  const themeOptions = useMemo(
    () => [{ name: PROFILE_THEME_NAME }, { name: DEFAULT_THEME_NAME }, ...MIND_THEMES],
    []
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    mindRef.current?.setPanMode(panMode);
  }, [panMode]);

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

  return createPortal(
    <div className="fixed left-0 top-0 z-[120] h-screen w-screen max-w-none bg-black/70 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={title ?? "구조맵 미리보기"}>
      <div className="relative h-full w-full overflow-hidden bg-white [--header-h:68px] dark:bg-[#0b1220]">
        <FullscreenHeader
          title={title ?? "구조맵 미리보기"}
          onClose={onClose}
          closeLabel="맵 닫기"
          left={
            <button
              type="button"
              onClick={() => setLeftOpen((prev) => !prev)}
              className="inline-flex items-center p-1 text-neutral-800 hover:text-neutral-900 dark:text-white/85 dark:hover:text-white"
              aria-label="정보 패널"
              title="정보 패널"
            >
              <span className="sr-only">정보 패널</span>
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
          }
          right={
            <div className="hidden items-center gap-2 sm:flex">
              <MapControls
                editMode={editMode}
                panMode={panMode}
                themes={themeOptions}
                currentThemeName={themeName}
                onToggleEdit={() =>
                  setEditMode((mode) => (mode === "view" ? "edit" : "view"))
                }
                onTogglePanMode={() => setPanMode((prev) => !prev)}
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
                placement="inline"
              />
            </div>
          }
        />

        <div className="relative w-full" style={{ height: "calc(100% - var(--header-h))" }}>
          <div className="absolute inset-0 bg-[#f6f7fb] dark:bg-[#070c16]" />
          <div className="pointer-events-none absolute inset-0 opacity-60 [background-image:linear-gradient(to_right,rgba(15,23,42,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.06)_1px,transparent_1px)] [background-size:28px_28px] dark:opacity-30 dark:[background-image:linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)]" />
          <div className="pointer-events-none absolute inset-0 [mask-image:radial-gradient(closest-side,black,transparent)] bg-[radial-gradient(900px_520px_at_50%_30%,rgba(59,130,246,0.10),transparent_62%)] dark:bg-[radial-gradient(900px_520px_at_50%_30%,rgba(56,189,248,0.10),transparent_62%)]" />

          <div className="absolute inset-0 p-0">
            <div className="h-full w-full rounded-2xl border border-slate-400 bg-white/65 shadow-sm backdrop-blur-sm dark:border-white/20 dark:bg-white/[0.03]">
              <ClientMindElixir
                ref={mindRef}
                mode={resolvedTheme === "dark" ? "dark" : "light"}
                editMode={editMode}
                theme={appliedTheme}
                data={mapData ?? undefined}
                loading={false}
                placeholderData={loadingMindElixir}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="absolute bottom-4 left-4 z-[15] inline-flex items-center gap-1.5 rounded-2xl border border-slate-400 bg-white/90 px-3 py-2 text-xs font-semibold text-neutral-700 shadow-lg backdrop-blur hover:bg-white dark:border-white/20 dark:bg-[#0b1220]/75 dark:text-white/80 dark:hover:bg-[#0b1220]/90"
            title="데모로 돌아가기"
          >
            <Icon icon="mdi:arrow-left" className="h-4 w-4" />
            데모로 돌아가기
          </button>

          <div className="absolute right-4 top-3 z-[15] hidden sm:block">
            <span className="inline-flex items-center gap-1 rounded-full border border-slate-400 bg-white/80 px-2.5 py-1 text-[11px] text-neutral-600 dark:border-white/20 dark:bg-[#0b1220]/60 dark:text-white/65">
              <Icon icon="mdi:gesture-tap" className="h-3.5 w-3.5" />
              {editMode === "edit" ? "편집 모드" : "보기 모드"}
            </span>
          </div>

          <div className="pointer-events-auto absolute right-3 top-3 z-[25] flex flex-col gap-2 sm:hidden">
            {[
              {
                icon: editMode === "view" ? "mdi:pencil" : "mdi:eye-outline",
                onClick: () =>
                  setEditMode((mode) => (mode === "view" ? "edit" : "view")),
                label: editMode === "view" ? "편집 모드" : "보기 모드",
              },
              {
                icon: panMode ? "mdi:arrow-top-left" : "mdi:hand-back-left",
                onClick: () => setPanMode((prev) => !prev),
                label: panMode ? "선택 모드" : "이동 모드",
              },
              {
                icon: "mdi:crosshairs-gps",
                onClick: () => mindRef.current?.centerMap?.(),
                label: "가운데로",
              },
              {
                icon: "mdi:plus",
                onClick: () => mindRef.current?.zoomIn?.(),
                label: "확대",
              },
              {
                icon: "mdi:minus",
                onClick: () => mindRef.current?.zoomOut?.(),
                label: "축소",
              },
            ].map((action) => (
              <button
                key={action.label}
                type="button"
                onClick={action.onClick}
                className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-400 bg-white/95 text-neutral-700 shadow-md backdrop-blur dark:border-white/20 dark:bg-[#0b1220]/85 dark:text-white/80"
                aria-label={action.label}
                title={action.label}
              >
                <Icon icon={action.icon} className="h-4 w-4" />
              </button>
            ))}
          </div>

          <DemoLeftPanel
            open={leftOpen}
            onClose={() => setLeftOpen(false)}
            map={draft}
            language={language}
          />
        </div>
      </div>
    </div>,
    document.body
  );
}
