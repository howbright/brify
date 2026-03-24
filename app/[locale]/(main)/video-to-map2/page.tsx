"use client";

import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import ScriptHelpSection from "./ScriptHelpSection";
import { useTranslations } from "next-intl";

const LONG_SCRIPT_THRESHOLD = 6000; // 🔹 이 글자 수를 넘으면 2크레딧, 아니면 1크레딧

// TODO: 실제 로그인 유저의 현재 크레딧으로 교체
const MOCK_CURRENT_CREDITS = 42;

// 길이에 따라 필요한 크레딧 계산
function getRequiredCredits(text: string) {
  const length = text.trim().length;
  if (!length) return 1;
  return length > LONG_SCRIPT_THRESHOLD ? 2 : 1;
}

export default function VideoToMapPage() {
  const t = useTranslations("VideoToMapPage");

  const [scriptText, setScriptText] = useState("");
  const [showCreditDialog, setShowCreditDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusStep, setStatusStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null); // TODO: 구조맵 결과 타입으로 변경
  const [isHelpOpen, setIsHelpOpen] = useState(false); // 🔹 도움말 토글 상태

  // 실제로는 훅/컨텍스트에서 받아오거나, 서버에서 가져온 값을 props로 받으면 됨
  const currentCredits = MOCK_CURRENT_CREDITS;
  const requiredCredits = getRequiredCredits(scriptText);

  const statusMessages = [
    t("status.reading"),
    t("status.splittingFlow"),
    t("status.extractingKeywords"),
    t("status.arrangingStructure"),
    t("status.almostThere"),
  ];

  useEffect(() => {
    if (!isProcessing) {
      setStatusStep(0);
      return;
    }

    let step = 0;
    const interval = setInterval(() => {
      step = (step + 1) % statusMessages.length;
      setStatusStep(step);
    }, 2500);

    return () => clearInterval(interval);
  }, [isProcessing, statusMessages.length]);

  const handleClickGenerate = () => {
    setError(null);
    if (!scriptText.trim()) {
      setError(t("errors.emptyScript"));
      return;
    }
    setShowCreditDialog(true);
  };

  const handleConfirmUseCredits = async () => {
    // (추가) 크레딧 부족 체크 — 실제론 서버에서도 다시 검증해야 함
    if (currentCredits < requiredCredits) {
      setShowCreditDialog(false);
      setError(t("errors.insufficientCredits"));
      return;
    }

    setShowCreditDialog(false);
    setIsProcessing(true);
    setError(null);
    setResult(null);

    try {
      // TODO: 실제 백엔드 API 경로로 변경
      const res = await fetch("/api/video-to-map", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script: scriptText }),
      });

      if (!res.ok) {
        throw new Error(t("errors.requestFailed"));
      }

      const data = await res.json();
      setResult(data);
    } catch (e: any) {
      console.error(e);
      setError(e?.message ?? t("errors.unknown"));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <main
      className="
        pt-16 pb-16 min-h-screen w-full relative
        bg-[#f4f6fb] dark:bg-[#020617]
        text-neutral-900 dark:text-neutral-50
      "
    >
      {/* 상단만 살짝 블루 톤 그라데이션 + 아주 약한 그리드 */}
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

      <div className="max-w-6xl mx-auto px-6 md:px-10 flex flex-col gap-10 relative">
        {/* 상단 헤더 / 상세 기능 페이지 느낌 */}
        <header className="mt-7 flex flex-col gap-4">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold leading-tight tracking-tight text-neutral-900 dark:text-white dark:[text-shadow:0_1px_10px_rgba(0,0,0,0.45)]">
            {t("title.prefix")}{" "}
            <span className="text-blue-700 dark:text-[rgb(var(--hero-b))]">
              {t("title.highlight")}
            </span>
          </h1>
          <p className="text-sm md:text-base text-neutral-700 dark:text-neutral-300 max-w-2xl">
            {t("description.beforeBold")}{" "}
            <span className="font-semibold text-neutral-900 dark:text-neutral-50">
              {t("description.bold")}
            </span>{" "}
            {t("description.afterBold")}
          </p>
        </header>

        {/* 메인 레이아웃 */}
        <div
          className={`
            grid gap-8 items-start
            transition-[grid-template-columns] duration-300 ease-out
            ${
              isHelpOpen
                ? "lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]" // 🔓 도움말 펼쳐진 상태
                : "lg:grid-cols-[minmax(0,1.8fr)_minmax(0,0.4fr)]" // 🔒 기본: 왼쪽 넓고, 오른쪽 좁게
            }
          `}
        >
          {/* 왼쪽: 입력 카드 */}
          <section
            className="
              mt-1 rounded-3xl border border-neutral-200 bg-white
              shadow-[0_22px_45px_-24px_rgba(15,23,42,0.55)]
              dark:bg-[#020818] dark:border-white/15
              p-5 md:p-6 flex flex-col gap-4
            "
          >
            {/* 상단 강조 라인 */}
            <div className="flex flex-col gap-3">
              <div className="h-1.5 w-16 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 dark:from-[rgb(var(--hero-a))] dark:to-[rgb(var(--hero-b))]" />
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-base md:text-lg font-semibold text-neutral-900 dark:text-white">
                  {t("inputSection.title")}
                </h2>

                {/* 🔹 내 크레딧 pill */}
                <div
                  className="
                    flex items-center gap-1.5 rounded-full
                    border border-amber-200 bg-amber-50
                    px-2.5 py-1 text-[11px] md:text-xs text-amber-700
                    dark:border-amber-300/40 dark:bg-amber-100/10 dark:text-amber-200
                  "
                >
                  <Icon
                    icon="mdi:star-four-points-outline"
                    className="h-3.5 w-3.5"
                  />
                  <span className="font-medium">{t("credits.label")}</span>
                  <span className="font-semibold">
                    {currentCredits.toLocaleString()} {t("credits.unit")}
                  </span>
                </div>
              </div>
            </div>

            <textarea
              className="
                w-full min-h-[260px] md:min-h-[300px] resize-y
                rounded-2xl border border-neutral-200 bg-neutral-50
                px-3 py-2 text-sm md:text-[15px] text-neutral-900
                placeholder:text-neutral-400
                focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-300/60
                dark:border-white/12 dark:bg-black/40 dark:text-neutral-50 dark:placeholder:text-neutral-500
              "
              placeholder={t("inputSection.placeholder")}
              value={scriptText}
              onChange={(e) => setScriptText(e.target.value)}
            />

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex flex-col gap-1">
                <p className="text-xs md:text-sm text-neutral-600 dark:text-neutral-300">
                  {t("credits.rule", { threshold: LONG_SCRIPT_THRESHOLD })}
                </p>
              </div>
              <button
                type="button"
                onClick={handleClickGenerate}
                disabled={!scriptText.trim() || isProcessing}
                className="
                  inline-flex items-center gap-2 rounded-2xl px-5 py-2.5
                  text-sm md:text-[15px] font-semibold text-white
                  bg-blue-600 hover:bg-blue-700
                  dark:bg-[rgb(var(--hero-a))] dark:hover:bg-[rgb(var(--hero-b))]
                  shadow-sm hover:shadow-md
                  transition-transform hover:scale-[1.03] active:scale-100
                  disabled:bg-neutral-400 disabled:hover:scale-100 disabled:cursor-not-allowed
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--hero-a))]/60
                "
              >
                {isProcessing
                  ? t("buttons.generating")
                  : t("buttons.generate")}
              </button>
            </div>
          </section>

          {/* 오른쪽: 가이드 + 진행 상태 */}
          <div className="flex flex-col gap-4">
            <ScriptHelpSection
              isHelpOpen={isHelpOpen}
              onToggle={() => setIsHelpOpen((prev) => !prev)}
            />

            {/* 진행 중 표시 */}
            {isProcessing && (
              <section
                className="
                  rounded-3xl border border-blue-200 bg-blue-50
                  shadow-[0_18px_40px_-24px_rgba(37,99,235,0.45)]
                  dark:bg-[#020818]/98 dark:border-[rgb(var(--hero-b))]/50
                  p-4 md:p-5 flex items-start gap-3
                "
              >
                <div className="mt-0.5 h-8 w-8 flex items-center justify-center rounded-full bg-neutral-900 text-white text-xs font-semibold dark:bg-white dark:text-neutral-900">
                  AI
                </div>
                <div className="flex-1 space-y-2">
                  <p className="text-sm md:text-[15px] font-semibold text-neutral-900 dark:text-neutral-50">
                    {t("processing.title")}
                  </p>
                  <div className="rounded-2xl bg-white/95 px-3 py-2.5 text-xs md:text-sm text-neutral-700 dark:bg-black/40 dark:text-neutral-200">
                    <p className="mb-1 flex items-center gap-1">
                      <span>{statusMessages[statusStep]}</span>
                      <span className="inline-flex gap-0.5">
                        <span className="animate-pulse">.</span>
                        <span className="animate-pulse delay-150">.</span>
                        <span className="animate-pulse delay-300">.</span>
                      </span>
                    </p>
                    <ul className="mt-1 list-disc list-inside space-y-0.5 text-[11px] md:text-xs text-neutral-500 dark:text-neutral-400">
                      <li>{t("processing.bullet1")}</li>
                      <li>{t("processing.bullet2")}</li>
                      <li>{t("processing.bullet3")}</li>
                    </ul>
                  </div>
                </div>
              </section>
            )}
          </div>
        </div>

        {/* 결과 영역 */}
        {result && (
          <section
            className="
              mt-6 rounded-3xl border border-neutral-200 bg-white
              shadow-[0_22px_45px_-24px_rgba(15,23,42,0.55)]
              dark:bg-[#020818]/98 dark:border-white/15
              p-4 md:p-6 space-y-3
            "
          >
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base md:text-lg font-semibold text-neutral-900 dark:text-white">
                {t("result.title")}
              </h2>
              <span className="text-[11px] md:text-xs text-neutral-500 dark:text-neutral-400">
                {t("result.hint")}
              </span>
            </div>
            <p className="text-xs md:text-sm text-neutral-600 dark:text-neutral-300">
              {t("result.description")}
            </p>
            <pre
              className="
                max-h-[360px] overflow-auto rounded-2xl
                bg-neutral-950/90 text-[11px] md:text-xs text-neutral-50
                p-3 border border-neutral-800
              "
            >
              {JSON.stringify(result, null, 2)}
            </pre>
          </section>
        )}
      </div>

      {/* 크레딧 사용 안내 모달 */}
      {showCreditDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55">
          <div
            className="
              w-full max-w-md rounded-3xl
              bg-white/98 border border-neutral-200
              shadow-[0_24px_70px_-30px_rgba(15,23,42,0.85)]
              p-5 md:p-6
              dark:bg-[#020617]/98 dark:border-white/12
            "
          >
            <h2 className="text-base md:text-lg font-semibold text-neutral-900 dark:text-white mb-2.5">
              {t("modal.title")}
            </h2>
            <p className="text-sm md:text-[15px] text-neutral-700 dark:text-neutral-200 mb-3">
              {t("modal.usageText", { credits: requiredCredits })}
            </p>
            <ul className="mb-4 list-disc list-inside text-xs md:text-sm text-neutral-600 dark:text-neutral-300 space-y-1">
              <li>{t("modal.bullet1")}</li>
              <li>{t("modal.bullet2")}</li>
              <li>{t("modal.bullet3")}</li>
            </ul>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCreditDialog(false)}
                className="
                  rounded-2xl px-3 py-1.5 text-xs md:text-sm text-neutral-700
                  border border-neutral-300 bg-white
                  hover:bg-neutral-100
                  dark:text-neutral-100 dark:border-white/20 dark:bg-white/5 dark:hover:bg-white/10
                "
              >
                {t("modal.cancel")}
              </button>
              <button
                type="button"
                onClick={handleConfirmUseCredits}
                className="
                  rounded-2xl px-3.5 py-1.5 text-xs md:text-sm font-semibold text-white
                  bg-blue-600 hover:bg-blue-700
                  dark:bg-[rgb(var(--hero-a))] dark:hover:bg-[rgb(var(--hero-b))]
                  shadow-sm hover:shadow-md
                "
              >
                {t("modal.confirmButton", { credits: requiredCredits })}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
