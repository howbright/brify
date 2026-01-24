"use client";

import { Icon } from "@iconify/react";
import type { MapDraft } from "./types";

export default function ResultReadyPanel({
  draft,
  onOpen,
  onCreateNew,
}: {
  draft: MapDraft | null;
  onOpen: () => void;
  onCreateNew: () => void;
}) {
  return (
    <section
      className="
        relative overflow-hidden
        mt-1 rounded-3xl border border-neutral-200 bg-white
        shadow-[0_22px_45px_-24px_rgba(15,23,42,0.55)]
        backdrop-blur-sm
        p-5 md:p-6

        /* ✅ dark: 페이지 배경(#020818)보다 한 톤 밝은 surface */
        dark:bg-[#111C2E]
        dark:border-white/10
        dark:ring-1 dark:ring-white/10
        dark:shadow-[0_38px_140px_-70px_rgba(0,0,0,0.95)]
      "
    >
      {/* ✅ 상단 하이라이트(분리감 + 제품스러운 표면감) */}
      <div
        className="
          pointer-events-none absolute inset-0
          bg-[radial-gradient(900px_260px_at_15%_0%,rgba(59,130,246,0.14),transparent_60%)]
          dark:bg-[radial-gradient(900px_260px_at_15%_0%,rgba(56,189,248,0.16),transparent_60%)]
        "
      />
      <div className="pointer-events-none absolute inset-0 dark:bg-white/[0.03]" />

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div
              className="
                h-9 w-9 rounded-2xl
                bg-blue-600 text-white
                flex items-center justify-center
                dark:bg-[rgb(var(--hero-b))]
                shadow-sm
              "
            >
              <Icon icon="mdi:check-bold" className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <p className="text-base md:text-lg font-semibold text-neutral-900 dark:text-white">
                생성이 완료되었습니다
              </p>
              <p className="text-xs text-neutral-500 dark:text-white/60 truncate">
                {draft?.title ? `“${draft.title}”` : "방금 생성된 구조맵을 확인해 주세요."}
              </p>
            </div>
          </div>

          {/* ✅ 미니 프리뷰: 다크에서 더 '카드'처럼 보이게 */}
          <div
            className="
              mt-4 rounded-2xl border border-blue-200/70 bg-blue-50/70
              px-3 py-2.5

              dark:border-white/10
              dark:bg-white/[0.06]
              dark:shadow-[0_20px_70px_-55px_rgba(0,0,0,0.95)]
            "
          >
            <p className="text-sm font-semibold text-neutral-900 dark:text-white">
              다음 단계
            </p>
            <p className="mt-1 text-xs text-neutral-700 dark:text-white/75">
              구조맵을 열어 확인하시거나, 새 콘텐츠로 다시 생성하실 수 있습니다.
            </p>
          </div>
        </div>
      </div>

      <div className="relative mt-4 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-end">
        <button
          type="button"
          onClick={onCreateNew}
          className="
            inline-flex items-center justify-center gap-2
            rounded-2xl px-4 py-2 text-sm font-semibold
            border border-neutral-200 bg-white hover:bg-neutral-50

            dark:border-white/12
            dark:bg-white/[0.06]
            dark:text-neutral-100
            dark:hover:bg-white/10
          "
        >
          <Icon icon="mdi:plus" className="h-4 w-4" />
          다른 구조맵 생성하기
        </button>

        <button
          type="button"
          onClick={onOpen}
          className="
            inline-flex items-center justify-center gap-2
            rounded-2xl px-4 py-2 text-sm font-semibold text-white
            bg-blue-600 hover:bg-blue-700
            dark:bg-[rgb(var(--hero-a))] dark:hover:bg-[rgb(var(--hero-b))]
            shadow-sm hover:shadow-md
          "
        >
          <Icon icon="mdi:open-in-new" className="h-4 w-4" />
          구조맵 열기
        </button>
      </div>
    </section>
  );
}
