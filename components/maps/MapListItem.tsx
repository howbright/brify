"use client";

import { Icon } from "@iconify/react";
import type { MapDraft } from "@/app/[locale]/(main)/video-to-map/types";
import { Link } from "@/i18n/navigation";

export default function MapListItem({
  draft,
}: {
  draft: MapDraft;
}) {
  const statusBadge =
    draft.status === "done"
      ? {
          text: "완료",
          cls: "bg-emerald-100 text-emerald-700 border-emerald-200",
          darkCls:
            "dark:bg-emerald-500/12 dark:text-emerald-200 dark:border-emerald-400/25",
        }
      : draft.status === "failed"
      ? {
          text: "실패",
          cls: "bg-rose-100 text-rose-700 border-rose-200",
          darkCls:
            "dark:bg-rose-500/12 dark:text-rose-200 dark:border-rose-400/25",
        }
      : {
          text: "처리 중",
          cls: "bg-blue-100 text-blue-700 border-blue-200",
          darkCls:
            "dark:bg-blue-500/12 dark:text-blue-200 dark:border-blue-400/25",
        };

  return (
    <article
      className="relative overflow-hidden rounded-3xl border border-neutral-200 bg-white p-4 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.45)] dark:border-white/10 dark:bg-[#111C2E] dark:ring-1 dark:ring-white/10 dark:shadow-[0_34px_120px_-70px_rgba(0,0,0,0.95)]"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(800px_220px_at_10%_0%,rgba(59,130,246,0.12),transparent_60%)] dark:bg-[radial-gradient(800px_220px_at_10%_0%,rgba(56,189,248,0.16),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 dark:bg-white/[0.03]" />

      <div className="relative flex gap-4">
        <div className="relative h-16 w-28 rounded-2xl overflow-hidden border border-neutral-200 bg-neutral-50 flex-shrink-0 dark:border-white/10 dark:bg-white/[0.06]">
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

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 pr-1">
              <p className="font-semibold text-neutral-900 dark:text-white line-clamp-2">
                {draft.title}
              </p>
              <p className="mt-1 text-xs text-neutral-500 dark:text-white/60 truncate">
                {draft.channelName ? draft.channelName : "출처 없음"}
                {draft.sourceUrl ? " · URL 있음" : ""}
              </p>
            </div>

            <span
              className={`shrink-0 whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-semibold inline-flex items-center gap-1.5 ${statusBadge.cls} ${statusBadge.darkCls}`}
            >
              <span>{statusBadge.text}</span>
            </span>
          </div>

          {draft.tags?.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {draft.tags.slice(0, 6).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-[11px] text-neutral-600 dark:border-white/10 dark:bg-white/[0.06] dark:text-white/75"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <div className="mt-3 flex items-center justify-between gap-2">
            <div className="min-w-0 text-[11px] text-neutral-500 dark:text-white/60 truncate">
              {new Date(draft.createdAt).toLocaleString()}
            </div>

            <Link
              href={`/maps/${draft.id}`}
              className="whitespace-nowrap inline-flex items-center justify-center gap-1.5 rounded-2xl border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 dark:border-white/12 dark:bg-white/[0.06] dark:text-white/85 dark:hover:bg-white/10"
            >
              <Icon icon="mdi:open-in-new" className="h-4 w-4" />
              열기
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
