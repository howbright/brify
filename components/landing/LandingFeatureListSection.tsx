"use client";

import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";

export default function LandingFeatureListSection() {
  const t = useTranslations("LandingFeatureListSection");
  const items = t.raw("items");
  const featureItems = Array.isArray(items) ? (items as string[]) : [];

  return (
    <section className="relative overflow-hidden bg-[linear-gradient(180deg,#f5f3ff_0%,#edf2ff_58%,#f8fafc_100%)] px-6 py-12 md:px-10 md:py-16 dark:bg-[linear-gradient(180deg,#140f2e_0%,#0b1224_100%)]">
      <div
        className="pointer-events-none absolute inset-0 opacity-30 dark:hidden"
        style={{
          backgroundImage: "url('/images/noise-texture.png')",
          backgroundSize: "280px 280px",
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(139,92,246,0.2),transparent_44%),radial-gradient(circle_at_bottom,rgba(59,130,246,0.12),transparent_48%)] dark:hidden" />
      <div
        className="pointer-events-none absolute inset-0 hidden dark:block opacity-24"
        style={{
          backgroundImage: "url('/images/noise-texture.png')",
          backgroundSize: "300px 300px",
        }}
      />
      <div className="pointer-events-none absolute inset-0 hidden dark:block dark:bg-[radial-gradient(circle_at_top,rgba(129,140,248,0.22),transparent_42%),radial-gradient(circle_at_bottom,rgba(56,189,248,0.12),transparent_48%)]" />
      <div className="relative mx-auto max-w-3xl rounded-3xl border border-[#d8e1ec] bg-white/94 p-6 shadow-[0_22px_50px_-30px_rgba(51,65,85,0.26)] dark:border-slate-600 dark:bg-slate-900/88 dark:shadow-[0_26px_60px_-28px_rgba(0,0,0,0.74)] md:p-9">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-600 dark:text-blue-300">
          {t("eyebrow")}
        </p>
        <h2 className="mt-2 text-xl font-extrabold leading-tight text-slate-900 dark:text-white md:text-2xl">
          {t("title")}
        </h2>
        <p className="mt-2 text-sm font-medium text-slate-600 dark:text-slate-300 md:text-base">
          {t("subtitle")}
        </p>

        <div className="mt-5 flex flex-col">
          {featureItems.map((label, index) => (
            <div
              key={`${label}-${index}`}
              className="inline-flex items-center gap-3 border-b border-slate-100 py-3 last:border-b-0 dark:border-slate-700/80"
            >
              <Icon
                icon="mdi:check-circle"
                className="h-5 w-5 shrink-0 text-blue-600 dark:text-blue-300"
              />
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 md:text-base">
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
