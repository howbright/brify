"use client";

import { Icon } from "@iconify/react";
import { MapDraft } from "./types";

export default function DraftMapCard({ draft }: { draft: MapDraft }) {
  const badge =
    draft.status === "done"
      ? {
          text: "완료",
          cls: "bg-emerald-100 text-emerald-700 border-emerald-200",
          darkCls: "dark:bg-emerald-500/12 dark:text-emerald-200 dark:border-emerald-400/25",
        }
      : draft.status === "failed"
      ? {
          text: "실패",
          cls: "bg-rose-100 text-rose-700 border-rose-200",
          darkCls: "dark:bg-rose-500/12 dark:text-rose-200 dark:border-rose-400/25",
        }
      : {
          text: "처리중",
          cls: "bg-amber-100 text-amber-700 border-amber-200",
          darkCls: "dark:bg-amber-500/12 dark:text-amber-200 dark:border-amber-400/25",
        };

  return (
    <div
      className="
        relative overflow-hidden
        rounded-3xl border border-neutral-200 bg-white
        shadow-[0_18px_40px_-28px_rgba(15,23,42,0.45)]
        p-4 flex gap-4

        /* ✅ dark: 페이지 배경(#020818)보다 한 톤 밝은 surface */
        dark:bg-[#111C2E]
        dark:border-white/10
        dark:ring-1 dark:ring-white/10
        dark:shadow-[0_34px_120px_-70px_rgba(0,0,0,0.95)]
      "
    >
      {/* ✅ subtle highlight (카드 분리감) */}
      <div
        className="
          pointer-events-none absolute inset-0
          bg-[radial-gradient(900px_240px_at_10%_0%,rgba(59,130,246,0.12),transparent_60%)]
          dark:bg-[radial-gradient(900px_240px_at_10%_0%,rgba(56,189,248,0.16),transparent_60%)]
        "
      />
      <div className="pointer-events-none absolute inset-0 dark:bg-white/[0.03]" />

      <div
        className="
          relative
          h-16 w-28 rounded-2xl overflow-hidden
          border border-neutral-200 bg-neutral-50
          flex-shrink-0

          dark:border-white/10
          dark:bg-white/[0.06]
        "
      >
        {draft.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={draft.thumbnailUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-[11px] text-neutral-400 dark:text-white/45">
            thumbnail
          </div>
        )}
      </div>

      <div className="relative flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-semibold text-neutral-900 dark:text-white truncate">
              {draft.title}
            </p>
            <p className="text-xs text-neutral-500 dark:text-white/60 truncate">
              {draft.channelName ? draft.channelName : "출처 없음"}
              {draft.sourceUrl ? " · URL 있음" : ""}
            </p>
          </div>

          <span
            className={`
              rounded-full border px-2.5 py-1 text-[11px] font-semibold
              ${badge.cls} ${badge.darkCls}
            `}
          >
            {badge.text}
          </span>
        </div>

        {draft.tags?.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {draft.tags.slice(0, 6).map((tag) => (
              <span
                key={tag}
                className="
                  rounded-full border border-neutral-200 bg-neutral-50
                  px-2 py-0.5 text-[11px] text-neutral-600

                  dark:border-white/10
                  dark:bg-white/[0.06]
                  dark:text-white/75
                "
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div className="mt-3 flex items-center justify-between">
          <div className="text-[11px] text-neutral-500 dark:text-white/60">
            {new Date(draft.createdAt).toLocaleString()}
          </div>

          <button
            type="button"
            className="
              inline-flex items-center gap-1.5 rounded-2xl
              border border-neutral-200 bg-white px-3 py-1.5
              text-xs font-semibold text-neutral-700 hover:bg-neutral-50

              dark:border-white/12
              dark:bg-white/[0.06]
              dark:text-white/85
              dark:hover:bg-white/10
            "
          >
            <Icon icon="mdi:open-in-new" className="h-4 w-4" />
            열기(프로토타입)
          </button>
        </div>
      </div>
    </div>
  );
}
