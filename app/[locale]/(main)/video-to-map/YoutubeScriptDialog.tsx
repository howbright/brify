"use client";

import { Icon } from "@iconify/react";
import { useEffect } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function YoutubeScriptDialog({ open, onClose }: Props) {
  const t = useTranslations("YoutubeScriptDialog");

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55"
      role="dialog"
      aria-modal="true"
      aria-label={t("dialogAria")}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-2xl max-h-[88vh] overflow-y-auto rounded-3xl bg-white border border-slate-400 shadow-[0_24px_70px_-30px_rgba(15,23,42,0.85)] p-5 md:p-6 dark:bg-[#0F172A] dark:border-white/20 dark:ring-1 dark:ring-white/5 dark:shadow-[0_28px_90px_-55px_rgba(0,0,0,0.85)] dark:bg-[linear-gradient(to_bottom,rgba(255,255,255,0.06),rgba(255,255,255,0.0))]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_240px_at_20%_0%,rgba(59,130,246,0.12),transparent_58%)] dark:bg-[radial-gradient(900px_240px_at_20%_0%,rgba(56,189,248,0.14),transparent_58%)]" />

        <div className="relative flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl md:text-2xl font-bold text-blue-700 dark:text-[rgb(var(--hero-b))] flex items-center gap-2">
              <Icon icon="mdi:youtube" className="h-6 w-6 text-blue-700 dark:text-[rgb(var(--hero-b))]" />
              {t("title")}
            </h2>
            <p className="text-base font-medium text-neutral-700 dark:text-neutral-200">
              {t("subtitle")}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-neutral-500 transition hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white"
            aria-label={t("close")}
          >
            <Icon icon="mdi:close" className="h-5 w-5" />
          </button>
        </div>

        <div className="relative mt-5 overflow-hidden rounded-2xl border border-slate-300 bg-white dark:border-white/20 dark:bg-slate-950/70">
          <Image
            src="/images/blog/howtocopy.gif"
            alt={t("gifAlt")}
            width={1280}
            height={720}
            className="h-auto w-full object-contain"
            unoptimized
          />
        </div>

        <div className="relative mt-5 space-y-4 text-sm leading-6 text-neutral-800 dark:text-neutral-100">
          <p>{t("guide.intro")}</p>
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[13px] text-amber-900 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-100">
            {t("guide.desktopOnly")}
          </p>

          <div>
            <p className="font-semibold">{t("guide.stepsTitle")}</p>
            <ol className="mt-2 list-decimal pl-5">
              <li>{t("guide.step1")}</li>
              <li>{t("guide.step2")}</li>
              <li>{t("guide.step3")}</li>
              <li>{t("guide.step4")}</li>
            </ol>
          </div>

          <p>{t("guide.encourage")}</p>
        </div>

        <div className="relative mt-6 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl px-4 py-2.5 text-sm font-semibold text-neutral-800 border border-slate-400 bg-white hover:bg-neutral-100 dark:text-white dark:border-white/20 dark:bg-white/[0.04] dark:hover:bg-white/10"
          >
            {t("close")}
          </button>
        </div>
      </div>
    </div>
  );
}
