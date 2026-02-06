"use client";

import { Icon } from "@iconify/react";
import { useMemo, useRef, useState } from "react";

type TermItem = { term: string; meaning: string };

export default function TermsBlock({
  terms,
  loading,
  usedCount,
  onAutoExtract,
  onExplainCustom,
}: {
  terms: TermItem[];
  loading: boolean;
  usedCount: number;
  onAutoExtract: () => void;
  onExplainCustom: (termsCsv: string) => void;
}) {
  const LIMIT = 5;

  const hasTerms = terms.length > 0;
  const remaining = useMemo(() => Math.max(0, LIMIT - usedCount), [usedCount]);

  const [custom, setCustom] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  const cleanedCsv = useMemo(() => {
    return custom
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 12)
      .join(", ");
  }, [custom]);

  // ✅ 버튼은 "세션 남아있고 로딩 아니면" 항상 활성화
  const canClick = remaining > 0 && !loading;

  const handleClick = () => {
    if (!canClick) return;

    // terms가 없으면: 1회차 자동 추출 (1 credit)
    if (!hasTerms) {
      onAutoExtract();
      return;
    }

    // terms가 있으면: 인풋이 비어있을 땐 포커스만
    if (cleanedCsv.length === 0) {
      inputRef.current?.focus();
      return;
    }

    // 인풋이 있으면: 커스텀 용어 해설
    onExplainCustom(cleanedCsv);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="text-xs text-neutral-500 dark:text-white/60">
        어려운 용어가 많으신가요?
      </div>

      {loading ? (
        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600 dark:border-white/10 dark:bg-white/[0.06] dark:text-white/75">
          용어 해설 생성 중…
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {terms.length === 0 ? (
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600 dark:border-white/10 dark:bg-white/[0.06] dark:text-white/75">
              아직 생성된 용어 해설이 없어요.
            </div>
          ) : (
            terms.map((x) => (
              <div
                key={x.term}
                className="rounded-2xl border border-neutral-200 bg-white p-3 dark:border-white/10 dark:bg-white/[0.06]"
              >
                <div className="font-semibold text-neutral-900 dark:text-white">
                  {x.term}
                </div>
                <div className="mt-1 text-sm text-neutral-700 dark:text-white/80">
                  {x.meaning}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ✅ terms가 있으면: 입력창 보여주기 */}
      {hasTerms && (
        <input
          ref={inputRef}
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          placeholder="추가로 해설 받고 싶은 용어를 콤마로 입력 (예: JWT, CORS)"
          className="
            w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2
            text-sm text-neutral-900 placeholder:text-neutral-400
            dark:border-white/10 dark:bg-white/[0.06]
            dark:text-white dark:placeholder:text-white/35
          "
        />
      )}

      {/* ✅ 버튼: 항상 살아있게 보이도록 */}
      <button
        type="button"
        onClick={handleClick}
        disabled={!canClick}
        className="
          group inline-flex items-center gap-2
          rounded-2xl px-3 py-2 text-xs font-semibold
          text-white
          bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-500
          shadow-[0_10px_30px_rgba(37,99,235,0.30)]
          hover:shadow-[0_14px_40px_rgba(79,70,229,0.55)]
          transition-all duration-150
          hover:-translate-y-0.5 hover:scale-[1.02] active:scale-100
          disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:scale-100
        "
      >
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-white/50 bg-white/15 shadow-sm">
          <Icon
            icon={loading ? "mdi:loading" : hasTerms ? "mdi:send" : "mdi:sparkles"}
            className="h-3.5 w-3.5"
          />
        </span>

        {hasTerms ? "용어 해설 더 받기" : "AI 용어 해설 생성 (1 credit)"}

        {hasTerms && (
          <span className="ml-1 rounded-full border border-white/35 bg-white/15 px-2 py-0.5 text-[11px] text-white/90">
            {remaining}/{LIMIT}
          </span>
        )}
      </button>
    </div>
  );
}
