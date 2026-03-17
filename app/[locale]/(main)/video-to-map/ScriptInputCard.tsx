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
        mt-1 rounded-3xl border border-neutral-300 bg-white
        shadow-[0_26px_60px_-28px_rgba(15,23,42,0.22)]
        backdrop-blur-sm
        p-5 md:p-6 flex flex-col gap-4
        ring-1 ring-neutral-200/90

        dark:bg-[#0F172A]
        dark:border-white/12
        dark:ring-1 dark:ring-white/10
        dark:shadow-[0_28px_90px_-55px_rgba(0,0,0,0.85)]
        dark:bg-[linear-gradient(to_bottom,rgba(255,255,255,0.06),rgba(255,255,255,0.0))]
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
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base md:text-lg font-semibold text-neutral-900 dark:text-white">
          콘텐츠 붙여넣기
        </h2>

        <button
          type="button"
          onClick={onOpenYoutubeDialog}
          disabled={locked}
          className="
            inline-flex items-center gap-1.5
            rounded-full border border-neutral-200 bg-neutral-50
            px-2.5 py-1 text-[11px] md:text-xs font-semibold text-neutral-700
            hover:bg-neutral-100
            dark:border-white/12 dark:bg-white/6 dark:text-neutral-200 dark:hover:bg-white/10
            disabled:opacity-60 disabled:cursor-not-allowed
          "
        >
          <Icon icon="mdi:youtube" className="h-4 w-4 text-red-500" />
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
        <div className="flex items-center gap-2 px-1">
          <span className="h-2.5 w-2.5 rounded-full bg-blue-500 dark:bg-[rgb(var(--hero-b))]" />
          <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">
            스크립트 입력
          </p>
        </div>

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

      {/* 하단: 좌측(크레딧 + 언어) / 우측(생성 버튼) */}
      <div className="flex flex-col gap-3">
        {/* 좌측: 크레딧 + 출력 언어 */}
        <div className="flex flex-col gap-2">
          <p className="text-xs text-neutral-600 dark:text-neutral-300">
            예상 사용: <b>{requiredCredits}</b> 크레딧{" "}
            <span className="mx-1.5 text-neutral-300 dark:text-white/20">
              ·
            </span>
            보유: <b>{currentCredits.toLocaleString()}</b> 크레딧
          </p>

          <div
            className="
              rounded-2xl border border-blue-200 bg-blue-50/80
              p-3
              dark:border-[rgb(var(--hero-b))]/25 dark:bg-[rgb(var(--hero-b))]/10
            "
          >
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white dark:bg-[rgb(var(--hero-b))] dark:text-neutral-950">
                    <Icon icon="mdi:translate" className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                      출력 언어 확인
                    </p>
                    <p className="text-xs text-neutral-600 dark:text-neutral-300">
                      구조맵이 어떤 언어로 생성될지 먼저 확인해 주세요.
                    </p>
                  </div>
                </div>

                <span
                  className="
                    rounded-full border border-blue-200 bg-white px-2.5 py-1
                    text-xs font-semibold text-blue-700
                    dark:border-[rgb(var(--hero-b))]/30 dark:bg-slate-950/60 dark:text-[rgb(var(--hero-b))]
                  "
                >
                  {outputLanguageLabel}
                </span>
              </div>

              <div
                className={[
                  "rounded-xl border px-3 py-2 text-xs",
                  outputLang === "auto"
                    ? "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-300/25 dark:bg-amber-400/10 dark:text-amber-100"
                    : "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-300/25 dark:bg-emerald-400/10 dark:text-emerald-100",
                ].join(" ")}
              >
                {outputLang === "auto"
                  ? "자동 감지로 생성됩니다. 영어 영상이면 영어로, 일본어 영상이면 일본어로 생성될 수 있어요."
                  : `이번 구조맵은 ${outputLanguageLabel}로 생성됩니다.`}
              </div>

              <OutputLanguageSelect
                value={outputLang}
                onChange={setOutputLang}
                disabled={locked}
              />
            </div>
          </div>
        </div>

        {/* 우측: 생성 버튼 */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => {
              // ✅ 한도 초과면 클릭해도 안 넘어가게 방어
              if (isTooLarge) return;
              onGenerate();
            }}
            disabled={!canGenerate}
            className="
              inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-2.5
              text-sm md:text-[15px] font-semibold text-white
              bg-blue-600 hover:bg-blue-700
              dark:bg-[rgb(var(--hero-a))] dark:hover:bg-[rgb(var(--hero-b))]
              shadow-sm hover:shadow-md
              transition-transform hover:scale-[1.03] active:scale-100
              disabled:bg-neutral-400 disabled:hover:scale-100 disabled:cursor-not-allowed
              focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--hero-a))]/60
            "
          >
            구조맵 생성하기
          </button>
        </div>
      </div>
    </section>
  );
}
