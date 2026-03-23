"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import ScriptInputCard from "@/app/[locale]/(main)/video-to-map/ScriptInputCard";
import DraftMapCard from "@/app/[locale]/(main)/video-to-map/DraftMapCard";
import type { MapDraft } from "@/app/[locale]/(main)/video-to-map/types";
import { brifyDemoSample } from "@/app/lib/demo/brifyDemoSample";
import DemoFullscreenDialog from "@/components/demo/DemoFullscreenDialog";

const DEMO = brifyDemoSample;
const DEMO_CREDITS = 26;
const DEMO_PROCESSING_MS = 5000;

function resolveDemoLanguage(outputLang: string): "ko" | "en" {
  if (outputLang === "ko") return "ko";
  return "en";
}

function buildDemoDraft(language: "ko" | "en", scriptText: string): MapDraft {
  return {
    id: "demo-map",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    sourceUrl: DEMO.sourceUrl,
    sourceType: "youtube",
    title: DEMO.title,
    channelName: DEMO.channelName,
    thumbnailUrl: DEMO.thumbnailUrl,
    tags: DEMO.tags,
    description: DEMO.summaryByLanguage[language],
    summary: DEMO.summaryByLanguage[language],
    sourceCharCount: scriptText.length,
    status: "processing",
    requiredCredits: 1,
  };
}

export default function DemoPage() {
  const [scriptText, setScriptText] = useState(DEMO.transcriptLines.join("\n\n"));
  const [outputLang, setOutputLang] = useState("ko");
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [drafts, setDrafts] = useState<MapDraft[]>([]);
  const [openDraft, setOpenDraft] = useState<MapDraft | null>(null);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const processingTimerRef = useRef<number | null>(null);
  const draftsSectionRef = useRef<HTMLElement | null>(null);
  const lastReadonlyToastRef = useRef(0);

  const resolvedLanguage = useMemo(
    () => resolveDemoLanguage(outputLang),
    [outputLang]
  );
  const selectedMindData = DEMO.mindDataByLanguage[resolvedLanguage];
  const requiredCredits = 1;

  const handleDemoLanguageChange = (nextLang: string) => {
    if (nextLang === "ko" || nextLang === "en" || nextLang === "auto") {
      setOutputLang(nextLang);
      return;
    }

    toast.message("데모에서는 한국어와 영어만 선택할 수 있어요.");
  };

  useEffect(() => {
    return () => {
      if (processingTimerRef.current) {
        window.clearTimeout(processingTimerRef.current);
      }
    };
  }, []);

  const handleGenerate = () => {
    if (!scriptText.trim()) {
      setError("샘플 원문이 비어 있어 구조맵을 만들 수 없어요.");
      return;
    }

    if (processingTimerRef.current) {
      window.clearTimeout(processingTimerRef.current);
    }

    setError(null);
    setIsProcessing(true);

    const language = resolvedLanguage;
    const nextDraft = buildDemoDraft(language, scriptText);
    setDrafts([nextDraft]);
    window.setTimeout(() => {
      draftsSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 120);

    processingTimerRef.current = window.setTimeout(() => {
      setDrafts([
        {
          ...nextDraft,
          updatedAt: Date.now(),
          status: "done",
          result: DEMO.mindDataByLanguage[language],
        },
      ]);
      setScriptText("");
      setIsProcessing(false);
      toast.success("샘플 구조맵 생성이 완료됐어요.");
      processingTimerRef.current = null;
    }, DEMO_PROCESSING_MS);
  };

  const handleAttemptEditDemoText = () => {
    const now = Date.now();
    if (now - lastReadonlyToastRef.current < 1600) return;
    lastReadonlyToastRef.current = now;
    toast.message("데모 페이지에서는 샘플 원문을 수정할 수 없어요.");
  };

  return (
    <main
      className="
        pt-16 pb-16 min-h-screen w-full relative
        bg-[#f4f6fb] dark:bg-[#020617]
        text-neutral-900 dark:text-neutral-50
      "
    >
      <div
        className="
          pointer-events-none absolute inset-x-0 top-0 h-72 -z-10
          bg-[radial-gradient(900px_380px_at_20%_0%,rgb(var(--hero-a)_/_0.16),transparent_65%),radial-gradient(900px_380px_at_80%_0%,rgb(var(--hero-b)_/_0.14),transparent_65%)]
        "
      />
      <div
        className="
          pointer-events-none absolute inset-0 -z-10
          [mask-image:linear-gradient(to_bottom,black,transparent_70%)]
          bg-[linear-gradient(to_right,rgb(var(--hero-grid)_/_0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgb(var(--hero-grid)_/_0.035)_1px,transparent_1px)]
          bg-[size:26px_26px]
          opacity-60
          dark:opacity-30
        "
      />

      <div className="max-w-6xl mx-auto px-2 md:px-10 flex flex-col gap-3 relative">
        <header className="mt-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white/90 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700 shadow-sm dark:border-white/20 dark:bg-white/8 dark:text-blue-300">
            <span className="h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-400" />
            Interactive Demo
          </div>
          <h1 className="mt-4 text-2xl font-extrabold leading-tight tracking-tight text-neutral-900 dark:text-white">
            샘플 콘텐츠로{" "}
            <span className="text-blue-700 dark:text-[rgb(var(--hero-b))]">
              구조맵 생성 흐름
            </span>
            을 체험해보세요
          </h1>
        </header>

        <div className="grid gap-8 items-start lg:grid-cols-[minmax(0,1fr)]">
          <ScriptInputCard
            scriptText={scriptText}
            setScriptText={setScriptText}
            error={error}
            isProcessing={isProcessing}
            currentCredits={DEMO_CREDITS}
            requiredCredits={requiredCredits}
            onGenerate={handleGenerate}
            showYoutubeHelpButton={false}
            outputLang={outputLang}
            setOutputLang={handleDemoLanguageChange}
            isTooLarge={false}
            disabled={false}
            textareaReadOnly
            onAttemptEditReadOnly={handleAttemptEditDemoText}
          />
        </div>

        {drafts.length > 0 && (
          <section ref={draftsSectionRef} className="mt-2 space-y-3">
            <div className="flex items-end justify-between gap-2">
              <h2 className="text-base font-semibold md:text-lg">만든 구조맵</h2>
            </div>

            <div className="grid gap-3">
              {drafts.map((draft) => (
                <DraftMapCard
                  key={draft.id}
                  draft={draft}
                  onOpen={(targetDraft) => {
                    setOpenDraft(targetDraft);
                    setShowFullscreen(true);
                  }}
                />
              ))}
            </div>
          </section>
        )}
      </div>

      <DemoFullscreenDialog
        open={showFullscreen}
        title={openDraft?.title ?? "구조맵 미리보기"}
        draft={openDraft}
        mapData={openDraft?.result ?? selectedMindData}
        language={resolvedLanguage}
        onClose={() => {
          setShowFullscreen(false);
          setOpenDraft(null);
        }}
      />
    </main>
  );
}
