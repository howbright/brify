"use client";

import { Icon } from "@iconify/react";

export default function ShareDialog({
  open,
  onClose,
  loading,
  shareEnabled,
  shareUrl,
  onEnable,
  onDisable,
  onCopy,
}: {
  open: boolean;
  onClose: () => void;
  loading: boolean;
  shareEnabled: boolean;
  shareUrl: string | null;
  onEnable: () => void;
  onDisable: () => void;
  onCopy: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[230]">
      <div
        className="absolute inset-0 bg-black/45"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="
          absolute left-1/2 top-1/2 w-[92vw] max-w-[480px] -translate-x-1/2 -translate-y-1/2
          rounded-3xl border border-slate-400 bg-white p-5
          shadow-[0_28px_90px_-40px_rgba(15,23,42,0.85)]
          dark:border-white/20 dark:bg-[#0F172A]
          dark:ring-1 dark:ring-white/16
          dark:shadow-[0_34px_120px_-60px_rgba(0,0,0,0.95)]
        "
      >
        <div
          className="
            pointer-events-none absolute inset-0
            bg-[radial-gradient(800px_260px_at_20%_0%,rgba(59,130,246,0.18),transparent_55%)]
            dark:bg-[radial-gradient(800px_260px_at_20%_0%,rgba(56,189,248,0.18),transparent_55%)]
          "
        />
        <div className="pointer-events-none absolute inset-0 dark:bg-white/[0.03]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-slate-400 dark:bg-white/20" />

        <div className="flex items-start justify-between gap-3">
          <div className="relative">
            <h3 className="text-lg md:text-xl font-bold text-blue-700 dark:text-[rgb(var(--hero-b))]">
              공유 링크
            </h3>
            <p className="mt-3 text-base md:text-lg font-semibold text-neutral-900 dark:text-white">
              링크를 가진 누구나 읽기 전용으로 볼 수 있습니다.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="
              relative inline-flex items-center justify-center
              text-neutral-500 hover:text-neutral-800
              dark:text-white/60 dark:hover:text-white
            "
          >
            <Icon icon="mdi:close" className="h-6 w-6" />
          </button>
        </div>

        <div className="relative mt-4 space-y-3">
          {shareEnabled && shareUrl ? (
            <div className="rounded-2xl border border-slate-400 bg-white px-3 py-2 text-sm text-neutral-700 dark:border-white/20 dark:bg-white/[0.08] dark:text-white/85">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate">{shareUrl}</span>
                <button
                  type="button"
                  onClick={onCopy}
                  className="inline-flex shrink-0 items-center gap-1 rounded-2xl border border-slate-400 bg-white px-2.5 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 dark:border-white/20 dark:bg-white/[0.08] dark:text-white/85 dark:hover:bg-white/[0.12]"
                >
                  <Icon icon="mdi:content-copy" className="h-3.5 w-3.5" />
                  복사
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-400 bg-white px-3 py-3 text-sm text-neutral-600 dark:border-white/20 dark:bg-white/[0.08] dark:text-white/75">
              공유 링크를 생성하면 여기서 복사할 수 있습니다.
            </div>
          )}
        </div>

        <div className="relative mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="
              rounded-2xl border border-slate-400 bg-white px-3 py-1.5
              text-xs md:text-sm font-semibold text-neutral-700 hover:bg-neutral-100
              dark:border-white/20 dark:bg-white/[0.08] dark:text-white/90 dark:hover:bg-white/[0.12]
            "
          >
            취소
          </button>
          {shareEnabled ? (
            <button
              type="button"
              onClick={onDisable}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-2xl bg-rose-600 px-3.5 py-1.5 text-xs md:text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60 dark:bg-rose-500 dark:hover:bg-rose-400"
            >
              링크 끄기
            </button>
          ) : (
            <button
              type="button"
              onClick={onEnable}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-2xl bg-blue-600 px-3.5 py-1.5 text-xs md:text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 dark:bg-[rgb(var(--hero-b))] dark:hover:bg-[rgb(var(--hero-a))] dark:text-neutral-950"
            >
              링크 생성
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
