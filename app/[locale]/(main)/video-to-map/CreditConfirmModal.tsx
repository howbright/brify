"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";

type Props = {
  credits: number;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function CreditConfirmModal({
  credits,
  onCancel,
  onConfirm,
}: Props) {
  const t = useTranslations("CreditConfirmModal");
  return (
    <div
      className="
        fixed inset-0 z-50 flex items-center justify-center
        bg-black/50
      "
      role="dialog"
      aria-modal="true"
      aria-label={t("dialogAria")}
      onMouseDown={(e) => {
        // 바깥 클릭은 '취소'와 동일하게 처리
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        className="
          relative overflow-hidden
          w-full max-w-md rounded-3xl
          bg-white border border-slate-400
          shadow-[0_28px_90px_-40px_rgba(15,23,42,0.85)]
          p-5 md:p-6

          /* ✅ dark: 배경보다 한 톤 밝게 + ring으로 경계 확실히 */
          dark:bg-[#0F172A]
          dark:border-white/20
          dark:ring-1 dark:ring-white/16
          dark:shadow-[0_34px_120px_-60px_rgba(0,0,0,0.95)]
        "
      >
        <button
          type="button"
          onClick={onCancel}
          aria-label={t("cancel")}
          className="
            absolute right-4 top-4 z-10
            inline-flex items-center justify-center
            text-neutral-500 hover:text-neutral-800
            dark:text-white/60 dark:hover:text-white
          "
        >
          <Icon icon="mdi:close" className="h-6 w-6" />
        </button>

        {/* ✅ 상단 하이라이트 + 가장자리 그라데이션(카드 표면감) */}
        <div
          className="
            pointer-events-none absolute inset-0
            bg-[radial-gradient(800px_260px_at_20%_0%,rgba(59,130,246,0.18),transparent_55%)]
            dark:bg-[radial-gradient(800px_260px_at_20%_0%,rgba(56,189,248,0.18),transparent_55%)]
          "
        />
        <div className="pointer-events-none absolute inset-0 dark:bg-white/[0.03]" />

        {/* ✅ 아주 얇은 하단 경계(카드가 떠 보이게) */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-slate-400 dark:bg-white/20" />

        <h2 className="relative text-lg md:text-xl font-bold text-blue-700 dark:text-[rgb(var(--hero-b))] mb-3">
          {t("title")}
        </h2>

        <div
          className="
            relative mb-2
            text-base md:text-lg font-semibold text-neutral-900
            dark:text-white
          "
        >
          {t("usage", { credits })}
        </div>

        <div
          className="
            relative mb-4
            text-base md:text-lg font-semibold text-neutral-900
            dark:text-white
          "
          role="note"
        >
          {t("notice")}
        </div>

        <div className="relative flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="
              rounded-2xl px-3 py-1.5 text-xs md:text-sm text-neutral-700
              border border-slate-400 bg-white
              hover:bg-neutral-100

              dark:text-white/90
              dark:border-white/20
              dark:bg-white/[0.08]
              dark:hover:bg-white/[0.12]
              focus:outline-none focus-visible:ring-2 focus-visible:ring-white/25
            "
          >
            {t("cancel")}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="
              rounded-2xl px-3.5 py-1.5 text-xs md:text-sm font-semibold text-white
              bg-blue-600 hover:bg-blue-700
              dark:bg-[rgb(var(--hero-b))] dark:text-neutral-950
              dark:hover:bg-[rgb(var(--hero-a))]
              shadow-sm hover:shadow-md
              focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--hero-b))]/35
            "
          >
            {t("confirm", { credits })}
          </button>
        </div>
      </div>
    </div>
  );
}
