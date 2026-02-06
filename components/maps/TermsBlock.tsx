"use client";

import { Icon } from "@iconify/react";

type TermItem = { term: string; meaning: string };

export default function TermsBlock({
  terms,
  loading,
  onRefetch,
}: {
  terms: TermItem[];
  loading: boolean;
  onRefetch: () => void;
}) {
  const hasTerms = terms.length > 0;

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

      <button
        type="button"
        onClick={onRefetch}
        disabled={loading}
        className="
    group inline-flex items-center gap-1.5
    rounded-2xl px-3 py-2 text-xs font-semibold
    text-white
    bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-500
    shadow-[0_10px_30px_rgba(37,99,235,0.30)]
    hover:shadow-[0_14px_40px_rgba(79,70,229,0.55)]
    transition-all duration-150
    hover:-translate-y-0.5 hover:scale-[1.02] active:scale-100
    disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:scale-100

    focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60 focus-visible:ring-offset-2
    dark:focus-visible:ring-indigo-300/60 dark:focus-visible:ring-offset-neutral-950
  "
      >
        <span
          className="
      inline-flex h-5 w-5 items-center justify-center
      rounded-full border border-white/50
      bg-white/15 shadow-sm
    "
        >
          <Icon
            icon={loading ? "mdi:loading" : "mdi:sparkles"}
            className="h-3.5 w-3.5"
          />
        </span>

        {hasTerms
          ? "AI 용어 해설 다시 생성 (1 credit)"
          : "AI 용어 해설 생성 (1 credit)"}
      </button>
    </div>
  );
}
