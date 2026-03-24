"use client";

import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";
import OutputLanguageSelect from "./OutputLanguageSelect";

type Props = {
  scriptText: string;
  setScriptText: (v: string) => void;
  error: string | null;
  isProcessing: boolean;
  currentCredits: number;
  requiredCredits: number;
  onGenerate: () => void;

  // ✅ 유튜브 모달 열기
  onOpenYoutubeDialog?: () => void;
  showYoutubeHelpButton?: boolean;

  // ✅ 출력 언어 state (부모에서 관리)
  outputLang: string;
  setOutputLang: (v: string) => void;

  // ✅ 추가: 입력 잠금 (메타다이얼로그가 열렸을 때 true)
  disabled?: boolean;

  // ✅ 추가: 한도 초과 UI 처리용 (부모에서 계산해서 내려주기)
  isTooLarge?: boolean;
  billingLength?: number; // 과금 기준 글자수
  maxLength?: number; // 최대 허용 과금 기준 글자수 (ex: 110,000)
  textareaReadOnly?: boolean;
  onAttemptEditReadOnly?: () => void;
};

export default function ScriptInputCard({
  scriptText,
  setScriptText,
  error,
  isProcessing,
  currentCredits,
  requiredCredits,
  onGenerate,
  onOpenYoutubeDialog,
  showYoutubeHelpButton = true,
  outputLang,
  setOutputLang,
  disabled = false,

  // ✅ new
  isTooLarge = false,
  billingLength,
  maxLength,
  textareaReadOnly = false,
  onAttemptEditReadOnly,
}: Props) {
  const t = useTranslations("ScriptInputCard");
  const locked = disabled || isProcessing;

  // ✅ 생성 버튼 차단 조건: 입력 없음 / 잠금 / 한도초과
  const canGenerate = Boolean(scriptText.trim()) && !locked && !isTooLarge;

  return (
    <section
      className="
        relative
        mt-1 rounded-3xl border border-blue-300
        bg-[linear-gradient(180deg,#eef5ff_0%,#f7fbff_100%)]
        shadow-[0_26px_60px_-28px_rgba(15,23,42,0.22)]
        p-4 sm:p-5 md:p-6 flex flex-col gap-4
        ring-1 ring-blue-200/90

        dark:border-[rgb(var(--hero-b))]/35
        dark:ring-1 dark:ring-[rgb(var(--hero-b))]/20
        dark:shadow-[0_28px_90px_-55px_rgba(0,0,0,0.85)]
        dark:bg-[linear-gradient(180deg,rgba(59,130,246,0.12),rgba(15,23,42,0.9))]
      "
    >
      {/* ✅ 잠금 오버레이: 메타다이얼로그 열림/처리중일 때 입력 영역 전체 잠금 */}
      {locked && (
        <div
          className="
            absolute inset-0 z-20 rounded-3xl
            bg-white/65
            dark:bg-black/35
          "
        >
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div
              className="
                rounded-2xl border border-slate-400 bg-white
                px-4 py-3 text-[13px] sm:text-sm font-semibold text-neutral-800
                shadow-[0_18px_60px_-40px_rgba(15,23,42,0.6)]
                dark:border-white/20 dark:bg-[#0F172A]/92 dark:text-white
              "
            >
              {t("lockedMessage")}
            </div>
          </div>
        </div>
      )}

      {/* 상단: 제목 (좌) + 유튜브 옵션 버튼 (우) */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full bg-blue-600 text-[12px] sm:text-sm font-bold text-white dark:bg-[rgb(var(--hero-b))] dark:text-neutral-950">
            1
          </span>
          <h2 className="text-[15px] sm:text-lg md:text-xl font-bold text-neutral-900 dark:text-white">
            {t("title")}
          </h2>
        </div>

        {showYoutubeHelpButton && onOpenYoutubeDialog ? (
          <button
            type="button"
            onClick={onOpenYoutubeDialog}
            disabled={locked}
            className="
              inline-flex items-center gap-1.5
              rounded-full border border-slate-400 bg-white
              px-3 py-1.5 text-[13px] sm:text-sm font-semibold text-neutral-800
              hover:bg-slate-100
              dark:border-white/30 dark:bg-white/[0.08] dark:text-neutral-100 dark:hover:bg-white/[0.12]
              disabled:opacity-60 disabled:cursor-not-allowed
            "
          >
            <Icon icon="mdi:youtube" className="h-4.5 w-4.5 text-red-500" />
            {t("youtubeHelp")}
          </button>
        ) : null}
      </div>

      {/* ✅ 한도 초과 배너 (잠금과 무관하게 표시) */}
      {isTooLarge && (
        <div
          className="
            rounded-2xl border border-red-200 bg-red-50
            px-3 py-2 text-[13px] sm:text-sm text-red-800
            dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200
            whitespace-pre-line
          "
        >
          {t("tooLargeTitle")}
          {"\n"}
          {typeof billingLength === "number" ? (
            <>
              {t("billingLength", { count: billingLength })}
              {"\n"}
            </>
          ) : null}
          {typeof maxLength === "number" ? (
            <>{t("maxLength", { count: maxLength })}</>
          ) : (
            <>{t("maxExceeded")}</>
          )}
        </div>
      )}

      <div className="space-y-2">
        <textarea
          className="
            w-full min-h-[260px] md:min-h-[300px] resize-y
            rounded-2xl border-2 border-indigo-600 bg-white
            px-3.5 py-3 text-[14px] sm:text-sm md:text-[15px] text-neutral-900
            shadow-[0_20px_48px_-26px_rgba(15,23,42,0.28)]
            placeholder:text-neutral-500
            focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-200/80
            dark:border-indigo-400 dark:bg-slate-950/88 dark:text-neutral-50 dark:placeholder:text-neutral-400
            dark:shadow-[0_18px_36px_-24px_rgba(0,0,0,0.45)]
            dark:focus:border-[rgb(var(--hero-b))] dark:focus:ring-[rgb(var(--hero-b))]/25
            disabled:opacity-60 disabled:cursor-not-allowed
          "
          placeholder={t("placeholder")}
          value={scriptText}
          onChange={(e) => {
            if (textareaReadOnly) {
              onAttemptEditReadOnly?.();
              return;
            }
            setScriptText(e.target.value);
          }}
          onClick={() => {
            if (!textareaReadOnly) return;
            onAttemptEditReadOnly?.();
          }}
          onBeforeInput={(e) => {
            if (!textareaReadOnly) return;
            e.preventDefault();
            onAttemptEditReadOnly?.();
          }}
          onPaste={(e) => {
            if (!textareaReadOnly) return;
            e.preventDefault();
            onAttemptEditReadOnly?.();
          }}
          onDrop={(e) => {
            if (!textareaReadOnly) return;
            e.preventDefault();
            onAttemptEditReadOnly?.();
          }}
          onKeyDown={(e) => {
            if (!textareaReadOnly) return;
            const blockedKeys = [
              "Backspace",
              "Delete",
              "Enter",
            ];
            if (
              blockedKeys.includes(e.key) ||
              (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey)
            ) {
              e.preventDefault();
              onAttemptEditReadOnly?.();
            }
          }}
          readOnly={textareaReadOnly}
          disabled={locked}
        />
      </div>

      {error && <p className="text-[13px] sm:text-sm text-red-500 whitespace-pre-line">{error}</p>}

      {/* 하단: 언어 선택 -> 생성 */}
      <div className="grid gap-3">
        <div className="flex flex-col gap-2">
          <div
            className="
              p-0
            "
          >
            <div className="grid gap-4 md:grid-cols-[minmax(0,420px)_320px] md:items-start">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full bg-blue-600 text-[12px] sm:text-sm font-bold text-white dark:bg-[rgb(var(--hero-b))] dark:text-neutral-950">
                      2
                    </span>
                    <p className="text-[15px] sm:text-lg md:text-xl font-bold text-neutral-900 dark:text-white">
                      {t("languageTitle")}
                    </p>
                  </div>
                </div>

                <OutputLanguageSelect
                  value={outputLang}
                  onChange={setOutputLang}
                  disabled={locked}
                />
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full bg-blue-600 text-[12px] sm:text-sm font-bold text-white dark:bg-[rgb(var(--hero-b))] dark:text-neutral-950">
                    3
                  </span>
                  <p className="text-[15px] sm:text-lg md:text-xl font-bold text-neutral-900 dark:text-white">
                    {t("generateTitle")}
                  </p>
                </div>
                <div className="text-[13px] sm:text-[15px] font-semibold text-neutral-700 dark:text-neutral-200">
                  {t("creditsInfo", {
                    current: currentCredits.toLocaleString(),
                    required: requiredCredits,
                  })}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (isTooLarge) return;
                    onGenerate();
                  }}
                  disabled={!canGenerate}
                  className="
                    inline-flex w-full items-center justify-center gap-2 rounded-[22px] px-5 py-3.5 sm:px-6 sm:py-4
                    text-[15px] sm:text-base md:text-lg font-bold text-white
                    bg-[linear-gradient(135deg,#1d4ed8_0%,#2563eb_45%,#3b82f6_100%)] hover:brightness-[1.03]
                    dark:bg-[rgb(var(--hero-a))] dark:hover:bg-[rgb(var(--hero-b))]
                    shadow-[0_24px_54px_-18px_rgba(37,99,235,0.8)] hover:shadow-[0_28px_58px_-18px_rgba(37,99,235,0.88)]
                    transition-transform hover:scale-[1.03] active:scale-100
                    disabled:bg-neutral-400 disabled:hover:scale-100 disabled:cursor-not-allowed
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--hero-a))]/60
                  "
                >
                  {t("generateButton")}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
