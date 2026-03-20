"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { Icon } from "@iconify/react";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";

import { Link } from "@/i18n/navigation";
import { brifyDemoSample } from "@/app/lib/demo/brifyDemoSample";
import {
  DEFAULT_THEME_NAME,
  MIND_THEME_BY_NAME,
} from "@/components/maps/themes";
import type { ClientMindElixirHandle } from "@/components/ClientMindElixir";
import { loadingMindElixir } from "@/app/lib/g6/sampleData";

const ClientMindElixir = dynamic(() => import("@/components/ClientMindElixir"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[520px] w-full items-center justify-center rounded-[28px] border border-blue-100 bg-white text-sm font-semibold text-slate-500 shadow-sm dark:border-blue-400/20 dark:bg-[#0f172a] dark:text-slate-300">
      구조맵을 불러오는 중입니다...
    </div>
  ),
});

const DEMO = brifyDemoSample;
type OutputLanguage = "ko" | "en";

export default function DemoPage() {
  const mindRef = useRef<ClientMindElixirHandle | null>(null);
  const [hasGeneratedMap, setHasGeneratedMap] = useState(false);
  const [outputLanguage, setOutputLanguage] = useState<OutputLanguage>("ko");
  const [titleIndex, setTitleIndex] = useState(0);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showMoveHint, setShowMoveHint] = useState(true);

  const theme = useMemo(() => {
    const namedTheme = MIND_THEME_BY_NAME[DEMO.mindThemeName];
    return namedTheme ?? MIND_THEME_BY_NAME[DEFAULT_THEME_NAME] ?? undefined;
  }, []);

  const selectedMindData = DEMO.mindDataByLanguage[outputLanguage];
  const selectedSummary = DEMO.summaryByLanguage[outputLanguage];
  const titleSlides = [
    "유튜브 스크립트를 넣으면,\nBrify가 이렇게 구조화합니다",
    "어떤 긴 글도\nBrify가 이렇게 구조화합니다",
  ];

  useEffect(() => {
    if (!hasGeneratedMap) return;

    const timer = window.setTimeout(() => {
      mindRef.current?.centerMap();
      mindRef.current?.zoomIn();
    }, 180);

    return () => window.clearTimeout(timer);
  }, [hasGeneratedMap]);

  const handleEditMode = () => {
    setIsEditMode(true);
    toast.message("노드를 우클릭하면 편집 메뉴가 나타나요.");
  };

  const handleViewModeEditAttempt = () => {
    toast.message("노드를 수정하려면 먼저 편집 모드로 전환해주세요.");
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--color-background-soft)] text-slate-900 dark:bg-[#08101d] dark:text-slate-100">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(1200px_760px_at_82%_-10%,rgba(59,130,246,0.16),transparent_60%),radial-gradient(900px_620px_at_8%_14%,rgba(99,102,241,0.14),transparent_60%)] dark:bg-[radial-gradient(1200px_760px_at_82%_-10%,rgba(59,130,246,0.18),transparent_55%),radial-gradient(900px_620px_at_8%_14%,rgba(99,102,241,0.16),transparent_55%),linear-gradient(180deg,#08101d_0%,#0b1324_45%,#09111f_100%)]" />
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-6 pb-10 pt-14 md:px-10 lg:pt-20">
        <div>
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700 dark:border-blue-400/20 dark:bg-white/8 dark:text-blue-300">
              <span className="h-2 w-2 rounded-full bg-indigo-500" />
              Interactive Demo
            </div>

            <div className="mt-5 flex items-start gap-3">
              <div className="min-w-0 flex-none">
                <AnimatePresence mode="wait">
                  <motion.h1
                    key={titleIndex}
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -24 }}
                    transition={{ duration: 0.28, ease: "easeOut" }}
                    className="max-w-3xl whitespace-pre-line text-4xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl dark:text-white"
                  >
                    {titleSlides[titleIndex]}
                  </motion.h1>
                </AnimatePresence>
              </div>

              <button
                type="button"
                aria-label="다음 제목 보기"
                onClick={() =>
                  setTitleIndex((prev) => (prev + 1) % titleSlides.length)
                }
                className="group mt-1 inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-blue-100 bg-white/90 text-blue-700 shadow-sm transition-colors hover:border-blue-200 hover:bg-blue-50 dark:border-blue-400/20 dark:bg-white/8 dark:text-blue-300 dark:hover:border-blue-300/30 dark:hover:bg-white/12"
              >
                <Icon
                  icon="mdi:arrow-right"
                  className="h-5 w-5 transition-transform group-hover:translate-x-0.5"
                />
              </button>
            </div>

          </div>
        </div>

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <article className="rounded-[32px] border border-white/70 bg-white/80 p-6 shadow-[0_24px_80px_-45px_rgba(15,23,42,0.2)] backdrop-blur dark:border-white/10 dark:bg-white/6 dark:shadow-[0_24px_80px_-45px_rgba(0,0,0,0.45)]">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
                <Icon icon="mdi:youtube" className="h-6 w-6" />
              </div>
              <div>
                <div className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-300">
                  Step 1
                </div>
                <h2 className="text-xl font-bold tracking-tight text-slate-950 dark:text-white">
                  유튜브 영상 정보 확인
                </h2>
              </div>
            </div>

            <div className="mt-5 overflow-hidden rounded-[28px] border border-slate-100 bg-white dark:border-white/10 dark:bg-[#0b1220]">
              <div className="relative aspect-[16/10] overflow-hidden bg-slate-100 dark:bg-slate-900">
                <Image
                  src={DEMO.thumbnailUrl}
                  alt={DEMO.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 560px"
                  className="object-cover"
                />
                <div className="absolute left-4 top-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-red-600/95 text-white shadow-[0_10px_24px_rgba(220,38,38,0.35)] backdrop-blur">
                  <Icon icon="mdi:youtube" className="h-6 w-6" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/15 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
                    Sample Video
                  </div>
                  <h3 className="mt-2 text-xl font-bold leading-snug">
                    {DEMO.title}
                  </h3>
                  <p className="mt-2 text-sm text-white/80">{DEMO.channelName}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 border-t border-slate-100 px-4 py-4 dark:border-white/10">
                {DEMO.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-white/8 dark:text-slate-300"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <InfoRow label="제목" value={DEMO.title} />
              <InfoRow label="채널" value={DEMO.channelName} />
              <InfoRow label="링크" value={DEMO.sourceUrl} />
              <InfoRow
                label="무슨 영상인가요?"
                value="케토 식단과 간헐적 단식 루틴을 실제 식사 흐름 중심으로 설명하는 영상입니다."
              />
            </div>
          </article>

          <article className="rounded-[32px] border border-white/70 bg-white/80 p-6 shadow-[0_24px_80px_-45px_rgba(15,23,42,0.2)] backdrop-blur dark:border-white/10 dark:bg-white/6 dark:shadow-[0_24px_80px_-45px_rgba(0,0,0,0.45)]">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
                <Icon icon="mdi:file-document-outline" className="h-6 w-6" />
              </div>
              <div>
                <div className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-700 dark:text-indigo-300">
                  Step 2
                </div>
                <h2 className="text-xl font-bold tracking-tight text-slate-950 dark:text-white">
                  원문 스크립트 확인
                </h2>
              </div>
            </div>

            <div className="mt-5 rounded-[24px] border border-blue-100/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(239,246,255,0.72)_100%)] p-4 dark:border-blue-400/15 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.9)_0%,rgba(12,18,32,0.96)_100%)]">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  미리 채워진 샘플 원문
                </div>
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {DEMO.transcriptLines.length} lines
                </div>
              </div>
              <div className="max-h-[510px] space-y-3 overflow-y-auto pr-2">
                {DEMO.transcriptLines.map((line, index) => (
                  <p
                    key={`${index}-${line}`}
                    className="rounded-2xl bg-white px-4 py-3 text-sm leading-6 text-slate-700 shadow-sm dark:bg-white/8 dark:text-slate-200 dark:shadow-none"
                  >
                    {line}
                  </p>
                ))}
              </div>
            </div>
          </article>
        </section>

        <section className="rounded-[32px] border border-blue-100 bg-[linear-gradient(135deg,rgba(239,246,255,0.95)_0%,rgba(255,255,255,0.96)_52%,rgba(238,242,255,0.9)_100%)] p-6 shadow-[0_24px_80px_-45px_rgba(37,99,235,0.16)] sm:p-8 dark:border-blue-400/15 dark:bg-[linear-gradient(135deg,rgba(17,24,39,0.92)_0%,rgba(11,18,32,0.98)_52%,rgba(22,28,45,0.96)_100%)] dark:shadow-[0_24px_80px_-45px_rgba(0,0,0,0.4)]">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-300">
                Step 3
              </div>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
                구조맵 생성
              </h2>
              <div className="mt-4 rounded-[24px] border border-blue-100 bg-white/80 p-4 dark:border-blue-400/15 dark:bg-white/6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700 dark:text-blue-300">
                      출력 언어 설정
                    </div>
                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-900 dark:text-slate-100">
                      원하는 언어로 결과를 만들 수 있어요!
                    </p>
                    <div className="mt-3 inline-flex rounded-full border border-slate-200 bg-slate-100 p-1 dark:border-white/10 dark:bg-white/8">
                      <LanguageToggleButton
                        active={outputLanguage === "ko"}
                        onClick={() => setOutputLanguage("ko")}
                        label="한국어"
                      />
                      <LanguageToggleButton
                        active={outputLanguage === "en"}
                        onClick={() => setOutputLanguage("en")}
                        label="영어"
                      />
                    </div>
                  </div>

                  <div className="relative flex items-center">
                    <button
                      type="button"
                      onClick={() => setHasGeneratedMap(true)}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-4 text-sm font-semibold text-white shadow-[0_18px_40px_-20px_rgba(37,99,235,0.6)] transition-transform hover:scale-[1.02] dark:bg-blue-500 dark:shadow-[0_18px_40px_-20px_rgba(59,130,246,0.5)]"
                    >
                      <Icon icon="mdi:sitemap-outline" className="h-5 w-5" />
                      구조맵 생성 버튼
                    </button>

                    <div className="ml-6 hidden sm:block">
                      <div className="relative -translate-y-1 rounded-xl border border-slate-400/70 bg-slate-950 px-4 py-2 text-sm font-semibold leading-5 text-white shadow-[0_18px_40px_rgba(15,23,42,0.32)] dark:border-slate-500/60 dark:bg-black">
                        버튼을 눌러
                        <br />
                        결과를 확인해보세요!
                        <span className="absolute left-[-10px] top-1/2 -translate-y-1/2 border-y-[8px] border-r-[10px] border-y-transparent border-r-slate-400/70 dark:border-r-slate-500/60" />
                        <span className="absolute left-[-8px] top-1/2 -translate-y-1/2 border-y-[7px] border-r-[9px] border-y-transparent border-r-slate-950 drop-shadow-[-2px_4px_8px_rgba(15,23,42,0.18)] dark:border-r-black" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[32px] border border-white/70 bg-white/80 p-4 shadow-[0_24px_80px_-45px_rgba(15,23,42,0.2)] backdrop-blur sm:p-6 dark:border-white/10 dark:bg-white/6 dark:shadow-[0_24px_80px_-45px_rgba(0,0,0,0.45)]">
          <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 md:flex-row md:items-end md:justify-between dark:border-white/10">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-300">
                Step 4
              </div>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
                구조맵이 펼쳐집니다
              </h2>
            </div>

          </div>

          {hasGeneratedMap ? (
            <div className="pt-6">
              <div className="overflow-hidden rounded-[28px] border border-blue-100 bg-white shadow-sm dark:border-blue-400/15 dark:bg-[#0b1220]">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-blue-100 bg-[linear-gradient(180deg,rgba(239,246,255,0.92)_0%,rgba(255,255,255,0.98)_100%)] px-4 py-3 dark:border-blue-400/15 dark:bg-[linear-gradient(180deg,rgba(30,41,59,0.82)_0%,rgba(11,18,32,0.98)_100%)]">
                  {showMoveHint && (
                    <div className="flex items-start gap-3 rounded-2xl border border-slate-500/70 bg-slate-800 px-4 py-3 text-white shadow-[0_16px_32px_rgba(15,23,42,0.28)] dark:border-slate-500/60 dark:bg-slate-900">
                      <div className="min-w-0">
                        <div className="text-base font-semibold leading-5">
                          맵 이동은 우클릭 드래그!
                        </div>
                        <div className="mt-1 text-xs font-medium text-white/75">
                          트랙패드는 두손가락
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowMoveHint(false)}
                        className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/80 transition hover:bg-white/15 hover:text-white"
                        aria-label="이동 안내 닫기"
                      >
                        <Icon icon="mdi:close" className="h-4 w-4" />
                      </button>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <div className="inline-flex rounded-full border border-slate-200 bg-slate-100 p-1 dark:border-white/10 dark:bg-white/8">
                      <ModeToggleButton
                        active={!isEditMode}
                        onClick={() => setIsEditMode(false)}
                        icon="mdi:eye-outline"
                        label="보기 모드"
                      />
                      <ModeToggleButton
                        active={isEditMode}
                        onClick={handleEditMode}
                        icon="mdi:pencil-outline"
                        label="편집 모드"
                      />
                    </div>
                    <MapActionButton
                      onClick={() => mindRef.current?.expandAll()}
                      icon="mdi:unfold-more-horizontal"
                      label="전체 펼치기"
                    />
                    <MapActionButton
                      onClick={() => mindRef.current?.collapseAll()}
                      icon="mdi:unfold-less-horizontal"
                      label="전체 접기"
                    />
                    <MapActionButton
                      onClick={() => mindRef.current?.centerMap()}
                      icon="mdi:crosshairs-gps"
                      label="가운데 정렬"
                    />
                    <MapActionButton
                      onClick={() => mindRef.current?.zoomIn()}
                      icon="mdi:plus"
                      label="확대"
                    />
                    <MapActionButton
                      onClick={() => mindRef.current?.zoomOut()}
                      icon="mdi:minus"
                      label="축소"
                    />
                  </div>
                </div>

                <div className="h-[600px] overflow-hidden bg-[radial-gradient(circle_at_top,rgba(219,234,254,0.9),transparent_42%),linear-gradient(180deg,rgba(255,255,255,1)_0%,rgba(248,250,252,1)_58%,rgba(238,242,255,0.8)_100%)] p-2 dark:bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.18),transparent_38%),linear-gradient(180deg,rgba(11,18,32,1)_0%,rgba(9,14,26,1)_70%,rgba(15,23,42,0.96)_100%)]">
                <ClientMindElixir
                  ref={mindRef}
                  mode="light"
                  theme={theme}
                  data={selectedMindData}
                  placeholderData={loadingMindElixir}
                  editMode={isEditMode ? "edit" : "view"}
                  onViewModeEditAttempt={handleViewModeEditAttempt}
                  fitOnInit={false}
                  preserveViewState
                  openMenuOnClick={false}
                  showMiniMap
                  dragButton={2}
                  panModeButton={2}
                />
                </div>

                <div className="border-t border-blue-100 bg-white px-4 py-4 dark:border-blue-400/15 dark:bg-[#0b1220]">
                  <p className="mb-3 text-center text-sm font-semibold text-blue-700 dark:text-blue-300">
                    선택 모드에서 노드를 하나 눌러보면 바로 활용할 수 있는 액션이 나타납니다.
                  </p>
                  <div className="grid gap-3 md:grid-cols-3">
                    <MapHintItem
                      icon="mdi:note-text-outline"
                      iconClassName="bg-rose-500 text-white"
                      text="각 노드마다 떠오르는 생각을 즉시 노트하세요."
                    />
                    <MapHintItem
                      icon="mdi:marker"
                      iconClassName="bg-yellow-400 text-black"
                      text="중요한 노드를 하이라이트하며 보세요."
                    />
                    <MapHintItem
                      icon="mdi:target"
                      iconClassName="bg-green-500 text-white"
                      text="이 노드를 중심으로 포커스해서 보세요."
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
                <article className="rounded-[28px] border border-indigo-100 bg-[linear-gradient(180deg,rgba(255,255,255,1)_0%,rgba(238,242,255,0.88)_100%)] p-6 dark:border-indigo-400/15 dark:bg-[linear-gradient(180deg,rgba(16,24,40,0.96)_0%,rgba(25,32,52,0.96)_100%)]">
                  <div className="inline-flex rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-indigo-800 dark:bg-indigo-500/15 dark:text-indigo-200">
                    Summary
                  </div>
                  <p className="mt-4 text-[15px] leading-8 text-slate-700 dark:text-slate-200">
                    {selectedSummary}
                  </p>
                </article>

                <aside className="rounded-[28px] border border-slate-200 bg-slate-50/80 p-6 dark:border-white/10 dark:bg-white/6">
                  <div className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                    Tags
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {DEMO.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-blue-100 bg-white px-3 py-2 text-sm font-semibold text-blue-700 shadow-sm dark:border-blue-400/20 dark:bg-white/8 dark:text-blue-300 dark:shadow-none"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </aside>
              </div>
            </div>
          ) : (
            <div className="pt-6">
              <div className="flex min-h-[320px] flex-col items-center justify-center rounded-[28px] border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center dark:border-white/10 dark:bg-white/6">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-blue-700 shadow-sm dark:bg-white/8 dark:text-blue-300 dark:shadow-none">
                  <Icon icon="mdi:sitemap-outline" className="h-7 w-7" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">
                  구조맵 생성 전 상태
                </h3>
                <p className="mt-2 max-w-xl text-sm leading-7 text-slate-600 dark:text-slate-300">
                  위의 버튼을 누르면 원문 스크립트를 바탕으로 정리된 구조맵과
                  핵심 요약이 여기 펼쳐집니다.
                </p>
              </div>
            </div>
          )}
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <FeatureCard
            step="Step 5"
            title="전체 노트 기능"
            icon="mdi:notebook-outline"
            accentClassName="bg-blue-50 text-blue-700"
            description="구조맵 전체를 보며 떠오른 생각을 한곳에 정리할 수 있어요."
          />
          <FeatureCard
            step="Step 6"
            title="용어 AI 추출"
            icon="mdi:creation-outline"
            accentClassName="bg-indigo-50 text-indigo-700"
            description="핵심 용어를 자동으로 정리해줘서 처음 보는 주제도 더 빨리 이해할 수 있어요."
          />
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <FeatureCard
            step="Step 7"
            title="편집 모드"
            icon="mdi:pencil-outline"
            accentClassName="bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
            description="편집 모드에서는 구조맵을 자유롭게 수정하며 내 방식대로 다듬을 수 있어요."
          />
          <FeatureCard
            step="Step 8"
            title="공유와 다운로드"
            icon="mdi:share-variant-outline"
            accentClassName="bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
            description="공유 링크로 전달하고, 이미지로 다운로드해서 바로 활용할 수 있어요."
          />
        </section>

        <section className="rounded-[32px] border border-white/70 bg-white/80 p-6 shadow-[0_24px_80px_-45px_rgba(15,23,42,0.2)] backdrop-blur dark:border-white/10 dark:bg-white/6 dark:shadow-[0_24px_80px_-45px_rgba(0,0,0,0.45)]">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
              <Icon icon="mdi:graph-outline" className="h-6 w-6" />
            </div>
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-700 dark:text-indigo-300">
                More Than One Map
              </div>
              <p className="mt-2 text-base font-semibold leading-7 text-slate-900 dark:text-white">
                웹페이지 여러 개를 각각 구조맵으로 만든 뒤, 하나의 연결된 맵으로 합칠 수 있어요.
              </p>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-center gap-3 rounded-[24px] border border-indigo-100 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(238,242,255,0.82)_100%)] px-4 py-4 dark:border-indigo-400/15 dark:bg-[linear-gradient(180deg,rgba(16,24,40,0.96)_0%,rgba(25,32,52,0.96)_100%)]">
            <MiniMapChip label="맵" />
            <Icon icon="mdi:plus" className="h-5 w-5 text-indigo-400" />
            <MiniMapChip label="맵" />
            <Icon icon="mdi:equal" className="h-5 w-5 text-indigo-400" />
            <MiniMapChip label="연결된 맵" large />
          </div>
        </section>

        <section className="rounded-[32px] border border-white/70 bg-white/80 p-6 shadow-[0_24px_80px_-45px_rgba(15,23,42,0.2)] backdrop-blur dark:border-white/10 dark:bg-white/6 dark:shadow-[0_24px_80px_-45px_rgba(0,0,0,0.45)]">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
              <Icon icon="mdi:tag-multiple-outline" className="h-6 w-6" />
            </div>
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-300">
                Smart Tagging
              </div>
              <p className="mt-2 text-base font-semibold leading-7 text-slate-900 dark:text-white">
                태그를 자동으로 정리해줘서, 비슷한 주제의 맵을 한눈에 분류하고 다시 찾기 쉬워집니다.
              </p>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-center rounded-[24px] border border-slate-100 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(248,250,252,0.92)_100%)] px-4 py-4 dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.96)_0%,rgba(11,18,32,0.96)_100%)]">
            <div className="flex flex-wrap items-center justify-center gap-4">
              <TagClusterChip accent="blue" mapCount={2} tagLabel="태그 A" />
              <TagClusterChip accent="amber" mapCount={3} tagLabel="태그 B" />
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden rounded-[32px] border border-blue-950/20 bg-[linear-gradient(180deg,#0b1224_0%,#0a1426_55%,#091223_100%)] px-6 py-8 text-white shadow-[0_24px_80px_-40px_rgba(11,18,36,0.55)] sm:px-8 dark:border-blue-400/20 dark:bg-[linear-gradient(180deg,#0d1830_0%,#0b1630_48%,#101a38_100%)] dark:shadow-[0_30px_90px_-40px_rgba(37,99,235,0.35)]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(420px_220px_at_18%_0%,rgba(59,130,246,0.22),transparent_60%),radial-gradient(380px_220px_at_82%_100%,rgba(99,102,241,0.2),transparent_60%)] dark:bg-[radial-gradient(420px_220px_at_18%_0%,rgba(59,130,246,0.3),transparent_60%),radial-gradient(420px_240px_at_82%_100%,rgba(129,140,248,0.28),transparent_60%)]" />
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-100/80">
                Next Step
              </div>
              <h2 className="mt-2 text-2xl font-bold tracking-tight">
                이제 내 콘텐츠로 같은 경험을 만들어보세요
              </h2>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/video-to-map"
                className="inline-flex items-center justify-center rounded-2xl bg-white px-6 py-3 text-sm font-semibold text-[#0b1224] transition-transform hover:scale-[1.02]"
              >
                무료로 시작하기
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur hover:bg-white/15"
              >
                요금 보기
              </Link>
            </div>
          </div>
        </section>
      </section>
    </div>
  );
}

function LanguageToggleButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
        active
          ? "bg-blue-600 text-white shadow-sm dark:bg-blue-500"
          : "bg-transparent text-slate-600 hover:text-blue-700 dark:text-slate-300 dark:hover:text-blue-300"
      }`}
    >
      {label}
    </button>
  );
}

function MapHintItem({
  icon,
  iconClassName,
  text,
}: {
  icon: string;
  iconClassName: string;
  text: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 dark:bg-white/8">
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm shadow-sm ${iconClassName}`}
      >
        <Icon icon={icon} className="h-4 w-4" />
      </div>
      <p className="text-sm leading-6 text-slate-700 dark:text-slate-200">{text}</p>
    </div>
  );
}

function MiniMapChip({
  label,
  large = false,
}: {
  label: string;
  large?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-indigo-100 bg-white shadow-sm dark:border-indigo-400/15 dark:bg-white/8 dark:shadow-none ${
        large ? "w-[120px]" : "w-[78px]"
      }`}
    >
      <div className="absolute inset-x-0 top-0 h-8 bg-[linear-gradient(180deg,rgba(219,234,254,0.9)_0%,rgba(255,255,255,0)_100%)] dark:bg-[linear-gradient(180deg,rgba(99,102,241,0.18)_0%,rgba(255,255,255,0)_100%)]" />
      <div
        className={`flex flex-col items-center justify-center gap-2 px-3 pb-3 pt-4 ${
          large ? "min-h-[88px]" : "min-h-[74px]"
        }`}
      >
        <div
          className={`flex items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300 ${
            large ? "h-10 w-10" : "h-8 w-8"
          }`}
        >
          <Icon
            icon="mdi:sitemap-outline"
            className={large ? "h-5 w-5" : "h-4 w-4"}
          />
        </div>
        <div className="text-center text-[11px] font-semibold text-slate-600 dark:text-slate-300">
          {label}
        </div>
      </div>
    </div>
  );
}

function TagClusterChip({
  accent,
  mapCount,
  tagLabel,
}: {
  accent: "blue" | "amber";
  mapCount: number;
  tagLabel: string;
}) {
  const tone =
    accent === "blue"
      ? {
          map: "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
          tag: "bg-blue-600 text-white dark:bg-blue-500 dark:text-white",
        }
      : {
          map: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
          tag: "bg-amber-500 text-white dark:bg-amber-400 dark:text-slate-950",
        };

  return (
    <div
      className={`flex items-center gap-3 rounded-[22px] px-4 py-3 ${
        accent === "blue"
          ? "bg-blue-50/80 dark:bg-blue-500/10"
          : "bg-amber-50/85 dark:bg-amber-500/10"
      }`}
    >
      <div className="flex items-center gap-2">
        {Array.from({ length: mapCount }).map((_, index) => (
          <div
            key={`${tagLabel}-${index}`}
            className={`flex h-10 w-10 items-center justify-center rounded-2xl shadow-sm ${tone.map}`}
          >
            <Icon icon="mdi:sitemap-outline" className="h-5 w-5" />
          </div>
        ))}
      </div>
      <div
        className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold shadow-sm ${tone.tag}`}
      >
        <Icon icon="mdi:tag-outline" className="h-4 w-4" />
        {tagLabel}
      </div>
    </div>
  );
}

function ModeToggleButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: string;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
        active
          ? "bg-blue-600 text-white shadow-sm dark:bg-blue-500"
          : "bg-transparent text-slate-600 hover:text-blue-700 dark:text-slate-300 dark:hover:text-blue-300"
      }`}
    >
      <Icon icon={icon} className="h-4 w-4" />
      {label}
    </button>
  );
}

function MapActionButton({
  onClick,
  icon,
  label,
  active = false,
}: {
  onClick: () => void;
  icon: string;
  label: string;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
        active
          ? "border-blue-600 bg-blue-600 text-white dark:border-blue-500 dark:bg-blue-500"
          : "border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:text-blue-700 dark:border-white/10 dark:bg-white/8 dark:text-slate-200 dark:hover:border-blue-400/30 dark:hover:text-blue-300"
      }`}
    >
      <Icon icon={icon} className="h-4 w-4" />
      {label}
    </button>
  );
}

function FeatureCard({
  step,
  title,
  icon,
  accentClassName,
  description,
}: {
  step: string;
  title: string;
  icon: string;
  accentClassName: string;
  description: string;
}) {
  return (
    <article className="rounded-[32px] border border-white/70 bg-white/80 p-6 shadow-[0_24px_80px_-45px_rgba(15,23,42,0.2)] backdrop-blur dark:border-white/10 dark:bg-white/6 dark:shadow-[0_24px_80px_-45px_rgba(0,0,0,0.45)]">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-2xl ${accentClassName}`}
        >
          <Icon icon={icon} className="h-6 w-6" />
        </div>
        <div>
          <div className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            {step}
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-950 dark:text-white">
            {title}
          </h2>
        </div>
      </div>

      <p className="mt-5 text-base font-semibold leading-7 text-slate-900 dark:text-slate-100">
        {description}
      </p>
    </article>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
        {label}
      </div>
      <p className="mt-1 text-sm leading-6 text-slate-700 dark:text-slate-200">{value}</p>
    </div>
  );
}
