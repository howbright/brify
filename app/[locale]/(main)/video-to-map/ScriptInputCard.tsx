"use client";

import { Icon } from "@iconify/react";
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
  onOpenYoutubeDialog: () => void;

  // ✅ 출력 언어 state (부모에서 관리)
  outputLang: string;
  setOutputLang: (v: string) => void;

  // ✅ 추가: 입력 잠금 (메타다이얼로그가 열렸을 때 true)
  disabled?: boolean;

  // ✅ 추가: 한도 초과 UI 처리용 (부모에서 계산해서 내려주기)
  isTooLarge?: boolean;
  billingLength?: number; // 과금 기준 글자수
  maxLength?: number; // 최대 허용 과금 기준 글자수 (ex: 110,000)
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
  outputLang,
  setOutputLang,
  disabled = false,

  // ✅ new
  isTooLarge = false,
  billingLength,
  maxLength,
}: Props) {
  const locked = disabled || isProcessing;

  const outputLanguageLabel =
    outputLang === "auto"
      ? "자동 감지"
      : outputLang === "ko"
        ? "한국어"
        : outputLang === "en"
          ? "English"
          : outputLang === "ja"
            ? "日本語"
            : outputLang === "zh-Hans"
              ? "简体中文"
              : outputLang === "zh-Hant"
                ? "繁體中文"
                : outputLang;

  // ✅ 생성 버튼 차단 조건: 입력 없음 / 잠금 / 한도초과
  const canGenerate = Boolean(scriptText.trim()) && !locked && !isTooLarge;

  return (
    <section
      className="
        relative
        mt-1 rounded-3xl border border-blue-300
        bg-[linear-gradient(180deg,#eef5ff_0%,#f7fbff_100%)]
        shadow-[0_26px_60px_-28px_rgba(15,23,42,0.22)]
        backdrop-blur-sm
        p-5 md:p-6 flex flex-col gap-4
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
            bg-white/55 backdrop-blur-sm
            dark:bg-black/25
          "
        >
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div
              className="
                rounded-2xl border border-neutral-200 bg-white/92
                px-4 py-3 text-sm font-semibold text-neutral-800
                shadow-[0_18px_60px_-40px_rgba(15,23,42,0.6)]
                dark:border-white/12 dark:bg-[#0F172A]/80 dark:text-white
              "
            >
              작업이 진행 중입니다. 잠시만 기다려 주세요.
            </div>
          </div>
        </div>
      )}

      {/* 상단: 제목 (좌) + 유튜브 옵션 버튼 (우) */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white dark:bg-[rgb(var(--hero-b))] dark:text-neutral-950">
            1
          </span>
          <h2 className="text-base md:text-lg font-semibold text-neutral-900 dark:text-white">
            콘텐츠를 붙여넣으세요
          </h2>
        </div>

        <button
          type="button"
          onClick={onOpenYoutubeDialog}
          disabled={locked}
          className="
            inline-flex items-center gap-1.5
            rounded-full border border-slate-400 bg-neutral-50
            px-3 py-1.5 text-sm font-semibold text-neutral-800
            hover:bg-neutral-100
            dark:border-white/30 dark:bg-white/6 dark:text-neutral-100 dark:hover:bg-white/10
            disabled:opacity-60 disabled:cursor-not-allowed
          "
        >
          <Icon icon="mdi:youtube" className="h-4.5 w-4.5 text-red-500" />
          유투브 스크립트 가져오는 방법
        </button>
      </div>

      {/* ✅ 한도 초과 배너 (잠금과 무관하게 표시) */}
      {isTooLarge && (
        <div
          className="
            rounded-2xl border border-red-200 bg-red-50
            px-3 py-2 text-sm text-red-800
            dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200
            whitespace-pre-line
          "
        >
          입력 분량이 너무 커서 처리할 수 없습니다.
          {"\n"}
          {typeof billingLength === "number" ? (
            <>
              과금 기준 분량: {billingLength.toLocaleString()}자
              {"\n"}
            </>
          ) : null}
          {typeof maxLength === "number" ? (
            <>최대 허용: {maxLength.toLocaleString()}자</>
          ) : (
            <>최대 허용치를 초과했어</>
          )}
        </div>
      )}

      <div className="space-y-2">
        <textarea
          className="
            w-full min-h-[260px] md:min-h-[300px] resize-y
            rounded-2xl border-2 border-indigo-600 bg-white
            px-4 py-3 text-sm md:text-[15px] text-neutral-900
            shadow-[0_18px_40px_-30px_rgba(15,23,42,0.2)]
            placeholder:text-neutral-500
            focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-200/80
            dark:border-indigo-400 dark:bg-slate-950/72 dark:text-neutral-50 dark:placeholder:text-neutral-400
            dark:shadow-[0_18px_36px_-24px_rgba(0,0,0,0.45)]
            dark:focus:border-[rgb(var(--hero-b))] dark:focus:ring-[rgb(var(--hero-b))]/25
            disabled:opacity-60 disabled:cursor-not-allowed
          "
          placeholder="여기에 텍스트를 그대로 붙여 넣어 주세요. (예: 0:03, 12:45 같은 시간 표시가 함께 있어도 괜찮아요.)"
          value={scriptText}
          onChange={(e) => setScriptText(e.target.value)}
          disabled={locked}
        />
      </div>

      {error && <p className="text-sm text-red-500 whitespace-pre-line">{error}</p>}

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
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white dark:bg-[rgb(var(--hero-b))] dark:text-neutral-950">
                      2
                    </span>
                    <p className="text-base md:text-lg font-semibold text-neutral-900 dark:text-white">
                      어떤 언어로 맵을 만들까요?
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
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white dark:bg-[rgb(var(--hero-b))] dark:text-neutral-950">
                    3
                  </span>
                  <p className="text-base md:text-lg font-semibold text-neutral-900 dark:text-white">
                    맵을 생성해요
                  </p>
                </div>
                <div className="text-sm font-medium text-neutral-600 dark:text-neutral-300">
                  보유 {currentCredits.toLocaleString()}크레딧 · 이번 생성 {requiredCredits}크레딧
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (isTooLarge) return;
                    onGenerate();
                  }}
                  disabled={!canGenerate}
                  className="
                    inline-flex w-full items-center justify-center gap-2 rounded-[22px] px-6 py-4
                    text-base md:text-lg font-bold text-white
                    bg-[linear-gradient(135deg,#1d4ed8_0%,#2563eb_45%,#3b82f6_100%)] hover:brightness-[1.03]
                    dark:bg-[rgb(var(--hero-a))] dark:hover:bg-[rgb(var(--hero-b))]
                    shadow-[0_22px_48px_-18px_rgba(37,99,235,0.72)] hover:shadow-[0_26px_52px_-18px_rgba(37,99,235,0.82)]
                    transition-transform hover:scale-[1.03] active:scale-100
                    disabled:bg-neutral-400 disabled:hover:scale-100 disabled:cursor-not-allowed
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--hero-a))]/60
                  "
                >
                  구조맵 생성하기
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
