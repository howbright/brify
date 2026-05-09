"use client";

import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";

export default function LandingFeatureListSection() {
  const t = useTranslations("LandingFeatureListSection");
  const items = t.raw("items");
  const featureItems = Array.isArray(items) ? (items as string[]) : [];

  return (
    <section className="relative bg-[#f1f6fd] px-6 py-12 md:px-10 md:py-16 dark:bg-[#070d18]">
      <div className="mx-auto max-w-3xl rounded-3xl border border-[#cfdced] bg-white p-6 shadow-[0_22px_50px_-30px_rgba(37,99,235,0.35)] dark:border-[#233149] dark:bg-[#152238] dark:shadow-[0_26px_60px_-28px_rgba(0,0,0,0.7)] md:p-9">
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
              className="inline-flex items-center gap-3 border-b border-slate-100 py-3 last:border-b-0 dark:border-white/10"
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
