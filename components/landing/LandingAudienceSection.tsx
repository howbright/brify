"use client";

import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";

const audienceIcons = [
  "mdi:flask-outline",
  "mdi:scale-balance",
  "mdi:briefcase-search-outline",
  "mdi:file-document-multiple-outline",
] as const;

export default function LandingAudienceSection() {
  const t = useTranslations("LandingAudienceSection");
  const rawItems = t.raw("items");
  const items = Array.isArray(rawItems)
    ? (rawItems as Array<{ title: string; description: string }>)
    : [];

  return (
    <section className="relative bg-[#edf4fd] px-6 py-8 md:px-10 md:py-10 dark:bg-[#08101d]">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-600 dark:text-blue-300">
            {t("eyebrow")}
          </p>
          <h2 className="mt-2 text-xl font-extrabold leading-tight text-slate-950 dark:text-white md:text-[1.65rem]">
            {t("title")}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300 md:text-[14px]">
            {t("subtitle")}
          </p>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {items.map((item, index) => (
            <article
              key={`${item.title}-${index}`}
              className="rounded-[22px] border border-slate-200 bg-white/88 p-4 shadow-[0_18px_36px_-30px_rgba(15,23,42,0.16)] backdrop-blur dark:border-white/10 dark:bg-white/[0.04] md:p-5"
            >
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 shadow-sm dark:bg-blue-500/10 dark:text-blue-200">
                <Icon
                  icon={audienceIcons[index] ?? "mdi:account-outline"}
                  className="h-4.5 w-4.5"
                />
              </div>
              <h3 className="mt-3 text-[15px] font-bold leading-tight text-slate-900 dark:text-white md:text-[16px]">
                {item.title}
              </h3>
              <p className="mt-2 text-[13px] leading-6 text-slate-600 dark:text-slate-300 md:text-[14px]">
                {item.description}
              </p>
            </article>
          ))}
        </div>

        <p className="mt-4 text-[13px] font-medium leading-6 text-slate-600 dark:text-slate-300 md:text-[14px]">
          {t("footnote")}
        </p>
      </div>
    </section>
  );
}
