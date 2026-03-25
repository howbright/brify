"use client";

import { useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify/react";
import { useLocale, useTranslations } from "next-intl";
import { MapDraft } from "./types";

const MS_PER_CHAR = 112610 / 8460;
const PROGRESS_CAP = 97;

function isActiveStatus(status: MapDraft["status"]) {
  return status === "idle" || status === "queued" || status === "processing";
}

function formatDraftTimestamp(value: number, locale: string) {
  return new Intl.DateTimeFormat(locale === "ko" ? "ko-KR" : "en-US", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(value));
}

export default function DraftMapCard({
  draft,
  onEditMetadata,
  isSavingMetadata = false,
  onOpen,
  highlighted = false,
}: {
  draft: MapDraft;
  onEditMetadata?: (draft: MapDraft) => void;
  isSavingMetadata?: boolean;
  onOpen?: (draft: MapDraft) => void;
  highlighted?: boolean;
}) {
  const t = useTranslations("DraftMapCard");
  const locale = useLocale();
  const processingMessages = useMemo(
    () => [
      t("processingMessages.1"),
      t("processingMessages.2"),
      t("processingMessages.3"),
      t("processingMessages.4"),
      t("processingMessages.5"),
    ],
    [t]
  );
  const [processingIndex, setProcessingIndex] = useState(0);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!isActiveStatus(draft.status)) return;
    const timer = window.setInterval(() => {
      setProcessingIndex((i) => (i + 1) % processingMessages.length);
    }, 2500);
    return () => window.clearInterval(timer);
  }, [draft.status, processingMessages.length]);

  useEffect(() => {
    if (!isActiveStatus(draft.status)) return;
    const tick = window.setInterval(() => setNow(Date.now()), 800);
    return () => window.clearInterval(tick);
  }, [draft.status]);

  const expectedMs =
    draft.sourceCharCount && draft.sourceCharCount > 0
      ? Math.max(1, Math.round(draft.sourceCharCount * MS_PER_CHAR))
      : null;
  const elapsedMs = Math.max(0, now - draft.createdAt);
  const progressPercent =
    isActiveStatus(draft.status) && expectedMs
      ? Math.min(
          PROGRESS_CAP,
          Math.max(1, Math.floor((elapsedMs / expectedMs) * 100))
        )
      : null;

  const badge =
    draft.status === "done"
      ? {
          text: t("status.done"),
          cls: "bg-emerald-100 text-emerald-700 border-emerald-200",
          darkCls:
            "dark:bg-emerald-500/12 dark:text-emerald-200 dark:border-emerald-400/25",
        }
      : draft.status === "failed"
      ? {
          text: t("status.failed"),
          cls: "bg-rose-100 text-rose-700 border-rose-200",
          darkCls:
            "dark:bg-rose-500/12 dark:text-rose-200 dark:border-rose-400/25",
        }
      : {
          text: processingMessages[processingIndex],
          cls: "border-transparent text-white",
          darkCls: "border-transparent text-white",
        };

  return (
    <>
      <div
        className="
        relative overflow-hidden
        rounded-3xl border border-neutral-400 bg-white
        shadow-[0_18px_40px_-28px_rgba(15,23,42,0.45)]
        p-3.5 sm:p-4 flex gap-3 sm:gap-4
        transition-all duration-500

        dark:bg-[#111C2E]
        dark:border-white/30
        dark:ring-1 dark:ring-white/10
        dark:shadow-[0_34px_120px_-70px_rgba(0,0,0,0.95)]
        "
        data-highlighted={highlighted ? "true" : "false"}
        style={
          highlighted
            ? {
                borderColor: "#38bdf8",
                boxShadow:
                  "0 0 0 4px rgba(56,189,248,0.16), 0 24px 60px -30px rgba(14,165,233,0.45)",
              }
            : undefined
        }
      >
      {/* highlight */}
      <div
        className="
          pointer-events-none absolute inset-0
          bg-[radial-gradient(900px_240px_at_10%_0%,rgba(59,130,246,0.12),transparent_60%)]
          dark:bg-[radial-gradient(900px_240px_at_10%_0%,rgba(56,189,248,0.16),transparent_60%)]
        "
      />
      <div className="pointer-events-none absolute inset-0 dark:bg-white/[0.03]" />

      {/* thumb */}
      <div
        className="
          relative
          h-14 w-24 sm:h-16 sm:w-28 rounded-2xl overflow-hidden
          border border-neutral-400 bg-neutral-50
          flex-shrink-0
          dark:border-white/30
          dark:bg-white/[0.06]
        "
      >
        {draft.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={draft.thumbnailUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-[12px] text-neutral-400 dark:text-white/45">
            {t("thumbnailAlt")}
          </div>
        )}
      </div>

      {/* content */}
      <div className="relative flex-1 min-w-0">
        {/* ✅ 상단: 모바일 2줄 안정 레이아웃 */}
        <div className="flex items-start justify-between gap-2">
          {/* text block */}
          <div className="min-w-0 pr-1">
            {/* ✅ 모바일: 2줄까지 보여주고 그 이상은 ... */}
            <p className="text-[14px] sm:text-base font-semibold text-neutral-900 dark:text-white line-clamp-2">
              {draft.title}
            </p>
          </div>

          {/* ✅ 뱃지는 절대 구겨지지 않게 */}
          <span
            className={`
              shrink-0 whitespace-nowrap
              rounded-full border px-2 py-1 sm:px-2.5 text-[11px] sm:text-[12px] font-semibold
              inline-flex items-center gap-1.5
              ${badge.cls} ${badge.darkCls}
              ${
                isActiveStatus(draft.status)
                  ? "bg-[linear-gradient(90deg,#3b82f6,#22c55e,#a855f7)]"
                  : ""
              }
            `}
          >
            {isActiveStatus(draft.status) && (
              <span className="relative flex h-2 w-2 sm:h-2.5 sm:w-2.5">
                <span className="relative inline-flex h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-white" />
              </span>
            )}
            <span>{badge.text}</span>
            {isActiveStatus(draft.status) && progressPercent !== null && (
              <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] sm:text-[11px] font-semibold tabular-nums">
                {progressPercent}%
                <span className="h-1.5 w-12 sm:w-16 overflow-hidden rounded-full bg-white/30">
                  <span
                    className="block h-full rounded-full bg-white transition-[width] duration-500 ease-out"
                    style={{ width: `${progressPercent}%` }}
                  />
                </span>
              </span>
            )}
          </span>
        </div>

        {/* ✅ 출처 라인(따로 분리해서 폭 싸움 방지) */}
        <p className="mt-1 text-[12px] sm:text-sm text-neutral-500 dark:text-white/60 truncate">
          {draft.channelName ? draft.channelName : t("noSource")}
          {draft.sourceUrl ? ` · ${t("hasUrl")}` : ""}
        </p>

        

        {draft.tags?.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {draft.tags.slice(0, 6).map((tag) => (
              <span
                key={tag}
                className="
                  rounded-full border border-neutral-400 bg-neutral-100
                  px-2 py-1 sm:px-2.5 text-[11px] sm:text-[12px] font-semibold text-neutral-700
                  dark:border-white/30
                  dark:bg-white/[0.08]
                  dark:text-white/85
                "
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* ✅ 하단: 모바일에서 날짜/버튼이 '각자 자리' 갖도록 */}
        <div className="mt-3 flex flex-col items-stretch gap-2.5 sm:flex-row sm:items-center sm:justify-between">
          {/* 날짜는 줄바꿈보단 한 줄 + ...가 더 보기 좋음 */}
          <div className="min-w-0 text-[12px] sm:text-[13px] font-medium text-neutral-500 dark:text-white/60 truncate">
            {formatDraftTimestamp(draft.createdAt, locale)}
          </div>

          <div className="flex items-center gap-2 shrink-0 sm:self-auto">
            {onEditMetadata && (
              <button
                type="button"
                onClick={() => onEditMetadata(draft)}
                disabled={isSavingMetadata}
                className="
                  whitespace-nowrap
                  inline-flex items-center justify-center gap-1.5 rounded-2xl
                  border border-neutral-400 bg-white px-3 py-2 sm:px-3.5
                  text-[13px] sm:text-sm font-semibold text-neutral-800 hover:bg-neutral-50
                  disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-white
                  dark:border-white/30
                  dark:bg-white/[0.06]
                  dark:text-white/85
                  dark:hover:bg-white/10
                  dark:disabled:hover:bg-white/[0.06]
                "
              >
                {isSavingMetadata ? (
                  <>
                    <Icon icon="mdi:loading" className="h-4 w-4 animate-spin" />
                    {t("saving")}
                  </>
                ) : (
                  <>
                    <Icon icon="mdi:pencil-outline" className="h-4 w-4" />
                    {t("editMetadata")}
                  </>
                )}
              </button>
            )}

            {draft.status === "done" && (
              <button
                type="button"
                onClick={() => onOpen?.(draft)}
                className="
                  flex-1 sm:flex-none
                  whitespace-nowrap
                  inline-flex items-center justify-center gap-2 rounded-[18px] sm:rounded-[20px]
                  border border-sky-300 bg-[linear-gradient(135deg,#0f172a_0%,#2563eb_18%,#06b6d4_48%,#7c3aed_78%,#38bdf8_100%)] px-4 py-2.5 sm:px-5 sm:py-3
                  text-[15px] sm:text-[17px] font-extrabold tracking-[-0.01em] text-white
                  shadow-[0_20px_46px_-18px_rgba(37,99,235,0.9)]
                  transition-all duration-200
                  hover:-translate-y-0.5 hover:brightness-[1.1] hover:saturate-[1.08]
                  hover:shadow-[0_26px_54px_-18px_rgba(56,189,248,0.95)]
                  dark:border-sky-300/80
                  dark:bg-[linear-gradient(135deg,#111827_0%,#1d4ed8_16%,#0891b2_44%,#6d28d9_74%,#38bdf8_100%)]
                  dark:text-white
                  dark:shadow-[0_24px_52px_-20px_rgba(37,99,235,0.95)]
                  dark:hover:shadow-[0_30px_62px_-20px_rgba(34,211,238,0.95)]
                "
              >
                <Icon icon="mdi:shape-outline" className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
                {t("viewMap")}
                <Icon icon="mdi:arrow-right" className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
              </button>
            )}
          </div>
        </div>
      </div>
      </div>
    </>
  );
}
