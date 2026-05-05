"use client";

import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";

function highlightKeywords(text: string, locale: string): ReactNode[] {
  const keywordMap: Record<string, string[]> = {
    ko: ["핵심 쟁점", "판단 기준", "판단의 기준", "더 빠르게", "설계하는 역할"],
    en: ["key issues", "decision criteria", "standards for judgment", "faster", "designs standards"],
    fr: ["enjeux clés", "critères de décision", "standards de jugement", "plus vite", "conception"],
  };

  const normalizedLocale = locale.startsWith("ko")
    ? "ko"
    : locale.startsWith("fr")
      ? "fr"
      : "en";
  const keywords = keywordMap[normalizedLocale] ?? [];
  if (!keywords.length) return [text];

  const escaped = keywords
    .map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .sort((a, b) => b.length - a.length);
  const regex = new RegExp(`(${escaped.join("|")})`, "gi");

  return text.split(regex).map((part, idx) => {
    const isMatch = keywords.some((k) => part.toLowerCase() === k.toLowerCase());
    if (!isMatch) return part;
    return (
      <span
        key={`${part}-${idx}`}
        className="font-semibold text-blue-700 underline decoration-blue-400/90 underline-offset-[3px] dark:text-blue-300 dark:decoration-blue-300/80"
      >
        {part}
      </span>
    );
  });
}

export default function LandingOutcomeSection() {
  const t = useTranslations("LandingOutcomeSection");
  const locale = useLocale();
  const items = t.raw("items") as string[];

  return (
    <section className="relative overflow-hidden px-6 py-12 md:px-10 md:py-14">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-full bg-[linear-gradient(180deg,#eef4ff_0%,#e7f1ff_35%,#edf6ff_100%)] dark:bg-[linear-gradient(180deg,#071326_0%,#08192d_40%,#071221_100%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-8 h-44 w-[42rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.24),rgba(59,130,246,0.08)_45%,transparent_75%)] blur-3xl dark:bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.16),rgba(56,189,248,0.06)_45%,transparent_75%)]"
      />

      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[34px] border border-blue-200/70 bg-[linear-gradient(145deg,#ffffff_0%,#f8fbff_46%,#eef5ff_100%)] p-8 shadow-[0_26px_75px_-38px_rgba(29,78,216,0.42)] dark:border-white/15 dark:bg-[linear-gradient(145deg,#0b1324_0%,#0f1c33_50%,#0c1729_100%)] dark:shadow-[0_26px_70px_-40px_rgba(2,6,23,0.92)] md:p-10">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-blue-300/30 blur-2xl dark:bg-blue-300/20"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-10 -left-10 h-44 w-44 rounded-full bg-indigo-300/25 blur-2xl dark:bg-indigo-300/20"
        />

        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-300">
          {t("eyebrow")}
        </p>
        <h2 className="mt-3 text-2xl font-extrabold tracking-[-0.02em] text-slate-900 dark:text-white md:text-3xl">
          {t("title")}
        </h2>
        <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600 dark:text-slate-300">
          {t("subtitle")}
        </p>

        <div className="mt-7 grid gap-4 md:grid-cols-3">
          {items.map((item, index) => (
            <motion.div
              key={item}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.38, delay: index * 0.08, ease: "easeOut" }}
              className="group rounded-2xl border border-white/70 bg-white/82 px-5 py-5 shadow-[0_16px_40px_-30px_rgba(37,99,235,0.45)] backdrop-blur-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_20px_44px_-28px_rgba(37,99,235,0.5)] dark:border-white/15 dark:bg-white/[0.06] dark:hover:border-blue-300/35"
            >
              <div className="flex items-start gap-3">
                <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-indigo-500 text-[12px] font-bold text-white shadow-sm dark:from-blue-500 dark:to-cyan-400">
                  {index + 1}
                </span>
                <p className="text-[15px] leading-7 text-slate-700 dark:text-slate-200">
                  {highlightKeywords(item, locale)}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-7 inline-flex items-center gap-2 rounded-full border border-blue-200/80 bg-blue-50/90 px-4 py-2 text-sm font-medium text-blue-800 dark:border-blue-300/25 dark:bg-blue-400/10 dark:text-blue-200">
          <Icon icon="mdi:compass-outline" className="h-4 w-4" />
          <span>{t("badge")}</span>
        </div>
      </div>
    </section>
  );
}
