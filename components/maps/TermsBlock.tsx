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
  return (
    <div className="flex flex-col gap-3">
      <div className="text-xs text-neutral-500 dark:text-white/60">
        어려운 용어가 자동으로 추출되어 뜻을 정리해줘요.
      </div>

      {loading ? (
        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600 dark:border-white/10 dark:bg-white/[0.06] dark:text-white/75">
          용어를 불러오는 중…
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {terms.length === 0 ? (
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600 dark:border-white/10 dark:bg-white/[0.06] dark:text-white/75">
              아직 용어가 없어요. “용어 다시 추출”을 눌러보세요.
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
        className="
          inline-flex items-center gap-1.5
          rounded-2xl border border-neutral-200 bg-white px-3 py-2
          text-xs font-semibold text-neutral-700 hover:bg-neutral-50
          dark:border-white/12 dark:bg-white/[0.06]
          dark:text-white/85 dark:hover:bg-white/10
        "
      >
        <Icon icon="mdi:refresh" className="h-4 w-4" />
        용어 다시 추출
      </button>
    </div>
  );
}
