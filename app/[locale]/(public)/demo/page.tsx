"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import ScriptInputCard from "@/app/[locale]/(main)/video-to-map/ScriptInputCard";
import DraftMapCard from "@/app/[locale]/(main)/video-to-map/DraftMapCard";
import type { MapDraft } from "@/app/[locale]/(main)/video-to-map/types";
import { brifyDemoSample } from "@/app/lib/demo/brifyDemoSample";
import DemoFullscreenDialog from "@/components/demo/DemoFullscreenDialog";
import { useLocale, useTranslations } from "next-intl";

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
    tags: [...DEMO.tags],
    description: DEMO.summaryByLanguage[language],
    summary: DEMO.summaryByLanguage[language],
    sourceCharCount: scriptText.length,
    status: "processing",
    requiredCredits: 1,
  };
}

export default function DemoPage() {
  const t = useTranslations("DemoPage");
  const locale = useLocale();
  const [scriptText, setScriptText] = useState(DEMO.transcriptLines.join("\n\n"));
  const [outputLang, setOutputLang] = useState(() =>
    locale === "en" ? "en" : "ko"
  );
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [drafts, setDrafts] = useState<MapDraft[]>([]);
  const [openDraft, setOpenDraft] = useState<MapDraft | null>(null);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const processingTimerRef = useRef<number | null>(null);
  const autoOpenTimerRef = useRef<number | null>(null);
  const draftsSectionRef = useRef<HTMLElement | null>(null);
  const lastReadonlyToastRef = useRef(0);

  const resolvedLanguage = useMemo(
    () => resolveDemoLanguage(outputLang),
    [outputLang]
  );
  const selectedMindData = DEMO.mindDataByLanguage[resolvedLanguage];
  const requiredCredits = 1;
  const eyebrowLabel = locale === "ko" ? "사용해보기" : "Live Demo";

  const handleDemoLanguageChange = (nextLang: string) => {
    if (nextLang === "ko" || nextLang === "en" || nextLang === "auto") {
      setOutputLang(nextLang);
      return;
    }

    toast.message(t("toasts.languageRestricted"));
  };

  useEffect(() => {
    return () => {
      if (processingTimerRef.current) {
        window.clearTimeout(processingTimerRef.current);
      }
      if (autoOpenTimerRef.current) {
        window.clearTimeout(autoOpenTimerRef.current);
      }
    };
  }, []);

  const handleGenerate = () => {
    if (!scriptText.trim()) {
      setError(t("toasts.emptyScript"));
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
      if (!draftsSectionRef.current) return;
      const top =
        draftsSectionRef.current.getBoundingClientRect().top +
        window.scrollY -
        96;
      window.scrollTo({
        top: Math.max(0, top),
        behavior: "smooth",
      });
    }, 120);

    processingTimerRef.current = window.setTimeout(() => {
      const completedDraft = {
        ...nextDraft,
        updatedAt: Date.now(),
        status: "done" as const,
        result: DEMO.mindDataByLanguage[language],
      };

      setDrafts([
        completedDraft,
      ]);
      setScriptText("");
      setIsProcessing(false);
      toast.success(t("toasts.autoOpen"));
      autoOpenTimerRef.current = window.setTimeout(() => {
        setOpenDraft(completedDraft);
        setShowFullscreen(true);
        autoOpenTimerRef.current = null;
      }, 950);
      processingTimerRef.current = null;
    }, DEMO_PROCESSING_MS);
  };

  const handleAttemptEditDemoText = () => {
    const now = Date.now();
    if (now - lastReadonlyToastRef.current < 1600) return;
    lastReadonlyToastRef.current = now;
    toast.message(t("toasts.readOnly"));
  };

  return (
    <main
      className="
        pt-16 pb-36 min-h-screen w-full relative
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
        <header className="mt-12 md:mt-[78px]">
          <div className="inline-flex items-center gap-3 text-xl font-black tracking-[-0.03em] text-neutral-900 dark:text-white sm:text-2xl md:text-3xl">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-600 dark:bg-blue-400" />
            {eyebrowLabel}
          </div>
          <h1 className="mt-4 text-2xl font-extrabold leading-tight tracking-tight text-neutral-900 dark:text-white">
            {t("titlePrefix")}{" "}
            <span className="text-blue-700 dark:text-[rgb(var(--hero-b))]">
              {t("titleHighlight")}
            </span>
            {" "}
            {t("titleSuffix")}
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
              <h2 className="text-base font-semibold md:text-lg">{t("draftsTitle")}</h2>
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
        title={openDraft?.title ?? t("previewTitle")}
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
