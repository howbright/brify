"use client";

import type { Variants } from "framer-motion";
import { AnimatePresence, motion } from "framer-motion";
import { Icon } from "@iconify/react";
import { Link } from "@/i18n/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";

/* ---------------- animations ---------------- */

const listV: Variants = {
  hidden: {},
  show: {
    transition: {
      delayChildren: 0.2,
      staggerChildren: 0.18,
    },
  },
};

const itemV: Variants = {
  hidden: { opacity: 0, y: 10, x: -6, filter: "blur(6px)" },
  show: {
    opacity: 1,
    y: 0,
    x: 0,
    filter: "blur(0px)",
    transition: { type: "spring", stiffness: 520, damping: 30 },
  },
};

/* ---------------- small parts ---------------- */

function Highlight({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="
        whitespace-nowrap
        bg-gradient-to-r from-blue-700 via-indigo-600 to-sky-600
        dark:from-indigo-400 dark:via-sky-400 dark:to-cyan-300
        bg-clip-text text-transparent
        drop-shadow-[0_2px_10px_rgba(0,0,0,0.18)]
      "
    >
      {children}
    </span>
  );
}

/* ---------------- image block ---------------- */

function HeroDiagramImage({ alt }: { alt: string }) {
  return (
    <div
      className="
        relative overflow-hidden
        rounded-3xl
        bg-white/40 dark:bg-black/40
        shadow-[0_20px_60px_-25px_rgba(15,23,42,0.35)]
        dark:shadow-[0_20px_60px_-25px_rgba(56,189,248,0.35)]
      "
    >
      <div className="relative w-full aspect-[16/10]">
        <Image
          src="/images/hero.png"
          alt={alt}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 520px"
          className="object-cover"
        />
      </div>
    </div>
  );
}

/* ---------------- main ---------------- */

export default function LandingBlueHero() {
  const t = useTranslations("LandingBlueHero");
  const [idx, setIdx] = useState(0);

  const titles = (() => {
    const raw = t.raw("titles");
    return Array.isArray(raw)
      ? (raw as string[])
      : ["유튜브 스크립트를", "어떤 긴 글도"];
  })();

  const features = (() => {
    const raw = t.raw("featureItems");
    return Array.isArray(raw)
      ? (raw as string[])
      : [
          "세부내용도 놓치지 않고 정리",
          "모르는 용어도 자동으로 정리",
          "원하는 언어로 결과 생성",
          "구조맵으로 흐름까지 한눈에",
      ];
  })();

  const featureStyles = [
    {
      icon: "mdi:check-decagram",
      iconWrap:
        "bg-emerald-400/14 text-slate-700 dark:bg-emerald-300/12 dark:text-slate-100",
      item:
        "border-blue-100/90 bg-white/82 dark:border-blue-400/15 dark:bg-white/6",
    },
    {
      icon: "mdi:book-open-variant",
      iconWrap:
        "bg-emerald-400/14 text-slate-700 dark:bg-emerald-300/12 dark:text-slate-100",
      item:
        "border-indigo-100/90 bg-white/78 dark:border-indigo-400/15 dark:bg-white/6",
    },
    {
      icon: "mdi:translate",
      iconWrap:
        "bg-emerald-400/14 text-slate-700 dark:bg-emerald-300/12 dark:text-slate-100",
      item:
        "border-sky-100/90 bg-white/78 dark:border-sky-400/15 dark:bg-white/6",
    },
    {
      icon: "mdi:sitemap-outline",
      iconWrap:
        "bg-emerald-400/14 text-slate-700 dark:bg-emerald-300/12 dark:text-slate-100",
      item:
        "border-emerald-100/90 bg-white/82 dark:border-emerald-400/15 dark:bg-white/6",
    },
  ];

  const safeIdx = titles.length ? idx % titles.length : 0;

  return (
    <main className="relative w-full overflow-hidden pt-14 md:min-h-[88vh]">
      {/* background */}
      <div
        className="
          pointer-events-none absolute inset-0 -z-10
          bg-[linear-gradient(180deg,#fbfdff_0%,#eef4ff_34%,#f8fbff_100%),radial-gradient(680px_380px_at_12%_10%,rgba(56,189,248,0.24),transparent_58%),radial-gradient(560px_320px_at_80%_8%,rgba(168,85,247,0.18),transparent_54%),radial-gradient(760px_360px_at_52%_100%,rgba(59,130,246,0.16),transparent_66%)]
          dark:hidden
        "
      />
      <div
        className="
          pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px]
          bg-[radial-gradient(48%_68%_at_50%_0%,rgba(255,255,255,0.92),rgba(255,255,255,0.18)_56%,transparent_74%)]
          dark:hidden
        "
      />
      <div
        className="
          pointer-events-none absolute left-[-8%] top-[10%] -z-10 h-[360px] w-[360px] rounded-full
          bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.30),rgba(56,189,248,0.10)_38%,transparent_70%)]
          blur-3xl
          dark:hidden
        "
      />
      <div
        className="
          pointer-events-none absolute right-[-10%] top-[2%] -z-10 h-[320px] w-[320px] rounded-full
          bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.24),rgba(168,85,247,0.08)_40%,transparent_72%)]
          blur-3xl
          dark:hidden
        "
      />
      <div
        className="
          pointer-events-none absolute inset-0 -z-10 hidden dark:block
          bg-[linear-gradient(180deg,#0a1020_0%,#07111e_38%,#050912_100%),radial-gradient(680px_360px_at_14%_12%,rgba(56,189,248,0.20),transparent_58%),radial-gradient(560px_320px_at_82%_10%,rgba(168,85,247,0.16),transparent_54%),radial-gradient(760px_340px_at_50%_100%,rgba(37,99,235,0.12),transparent_66%)]
        "
      />
      <div
        className="
          pointer-events-none absolute inset-x-0 top-0 -z-10 hidden h-[360px] dark:block
          bg-[radial-gradient(44%_64%_at_50%_0%,rgba(255,255,255,0.10),rgba(255,255,255,0.02)_56%,transparent_74%)]
        "
      />
      <div
        className="
          pointer-events-none absolute left-[-8%] top-[10%] -z-10 hidden h-[360px] w-[360px] rounded-full dark:block
          bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.20),rgba(56,189,248,0.07)_40%,transparent_72%)]
          blur-3xl
        "
      />
      <div
        className="
          pointer-events-none absolute right-[-10%] top-[2%] -z-10 hidden h-[320px] w-[320px] rounded-full dark:block
          bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.18),rgba(168,85,247,0.06)_42%,transparent_74%)]
          blur-3xl
        "
      />

      <section className="mx-auto grid max-w-7xl items-start gap-10 px-6 py-10 md:grid-cols-2 md:items-center md:gap-14 md:px-10 md:py-14 lg:py-16">
        {/* LEFT */}
        <div>
          <div className="text-sm md:text-base font-semibold text-neutral-600 dark:text-neutral-300">
            {t("eyebrow")}
          </div>

          {/* title + slide handle */}
          <div className="mt-3 flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <AnimatePresence mode="wait">
                <motion.h1
                  key={safeIdx}
                  initial={{ opacity: 0, x: 28 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -28 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className="
                    text-3xl sm:text-4xl md:text-5xl
                    font-extrabold leading-[1.1]
                    text-neutral-900 dark:text-white
                    dark:[text-shadow:0_1px_14px_rgba(0,0,0,0.55)]
                  "
                >
                  {titles[safeIdx]} <Highlight>{t("titleHighlight")}</Highlight>
                  {t("titleSuffix")}
                </motion.h1>
              </AnimatePresence>
            </div>

            <motion.button
              type="button"
              aria-label={t("switchTitleAria")}
              onClick={() => setIdx((v) => (v + 1) % titles.length)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="
                group mt-1 inline-flex h-12 w-12 shrink-0 items-center justify-center
                rounded-full border border-blue-100 bg-white/90 text-blue-700 shadow-sm
                transition-colors hover:border-blue-200 hover:bg-blue-50
                dark:border-blue-400/20 dark:bg-white/8 dark:text-blue-300
                dark:hover:border-blue-300/30 dark:hover:bg-white/12
              "
            >
              <span className="pointer-events-none flex items-center justify-center">
                <span className="h-5 w-5 transition-transform group-hover:translate-x-0.5">
                  <svg viewBox="0 0 24 24" fill="none" className="h-full w-full">
                    <path
                      d="M5 12h12"
                      stroke="currentColor"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M13 6l6 6-6 6"
                      stroke="currentColor"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </span>
            </motion.button>
          </div>

          <p className="mt-4 max-w-2xl text-sm font-semibold leading-6 text-slate-600 dark:text-slate-300">
            {t("helper")}
          </p>

          {/* mobile image */}
          <div className="mt-6 md:hidden">
            <HeroDiagramImage alt={t("visualAlt")} />
          </div>

          {/* CTA */}
          <div className="mt-7 flex gap-4">
            <Link
              href="/video-to-map"
              className="
                px-6 py-3 rounded-2xl
                bg-[linear-gradient(135deg,#1d4ed8_0%,#2563eb_45%,#3b82f6_100%)] text-white font-semibold
                shadow-[0_18px_40px_-18px_rgba(37,99,235,0.7)] hover:shadow-[0_22px_46px_-18px_rgba(37,99,235,0.82)]
                transition-transform hover:scale-[1.03]
              "
            >
              {t("ctaPrimary")}
            </Link>

            <Link
              href="/demo"
              className="
                group inline-flex items-center gap-2
                rounded-2xl border border-slate-300/90 px-5 py-3 font-semibold
                text-slate-800 transition-all duration-200
                shadow-[0_10px_24px_-20px_rgba(15,23,42,0.18)]
                hover:-translate-y-0.5 hover:border-blue-400 hover:bg-blue-100/90
                hover:text-blue-800 hover:shadow-[0_18px_38px_-22px_rgba(37,99,235,0.32)]
                dark:border-white/15 dark:bg-transparent dark:text-sky-100
                dark:hover:border-blue-300/40 dark:hover:bg-blue-400/10
                dark:hover:text-white dark:hover:shadow-[0_18px_38px_-22px_rgba(59,130,246,0.38)]
              "
            >
              {t("ctaSecondary")}
              <svg
                viewBox="0 0 20 20"
                fill="none"
                className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1"
              >
                <path
                  d="M4.5 10h9"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M10.5 6.5 14 10l-3.5 3.5"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          </div>

          {/* features */}
          <div className="mt-6">
            <motion.div
              className="grid gap-x-5 gap-y-3 sm:grid-cols-2"
              variants={listV}
              initial="hidden"
              animate="show"
            >
              {features.map((text, i) => (
                <motion.div
                  key={i}
                  variants={itemV}
                  className="flex items-center gap-3"
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${featureStyles[i % featureStyles.length].iconWrap}`}
                  >
                    <Icon
                      icon={featureStyles[i % featureStyles.length].icon}
                      className="h-5 w-5"
                    />
                  </span>
                  <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    {text}
                  </span>
                </motion.div>
              ))}
            </motion.div>
          </div>

        </div>

        {/* RIGHT */}
        <div className="relative hidden md:block">
          <HeroDiagramImage alt={t("visualAlt")} />
        </div>
      </section>
    </main>
  );
}
