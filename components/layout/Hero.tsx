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

function HeroDiagramImage({
  alt,
  videoLabel,
}: {
  alt: string;
  videoLabel: string;
}) {
  const [isVideoOpen, setIsVideoOpen] = useState(false);

  return (
    <div className="group relative">
        <div
          aria-hidden
          className="
            pointer-events-none absolute inset-0 z-10
            rounded-3xl ring-1 ring-inset ring-white/50
            dark:ring-white/8
          "
        />
        <div
          aria-hidden
          className="
            pointer-events-none absolute inset-x-10 top-0 z-10 h-20
            bg-[radial-gradient(50%_100%_at_50%_0%,rgba(255,255,255,0.70),transparent_78%)]
            opacity-80
            dark:bg-[radial-gradient(50%_100%_at_50%_0%,rgba(255,255,255,0.10),transparent_78%)]
            dark:opacity-100
          "
        />
        <div
          aria-hidden
          className="
            pointer-events-none absolute -inset-6 -z-10 rounded-[36px]
            bg-[radial-gradient(60%_60%_at_50%_50%,rgba(59,130,246,0.16),transparent_72%)]
            blur-2xl
            dark:bg-[radial-gradient(60%_60%_at_50%_50%,rgba(99,102,241,0.16),transparent_72%)]
          "
        />
        <div className="relative w-full aspect-video overflow-hidden rounded-3xl">
        <button
          type="button"
          onClick={() => setIsVideoOpen(true)}
          className="absolute bottom-4 right-4 z-20 inline-flex cursor-pointer items-center rounded-full border border-white/70 bg-slate-950/70 px-3.5 py-2 text-sm font-bold tracking-[0.04em] text-white transition-transform duration-200 hover:scale-[1.03] dark:border-white/55 dark:bg-slate-950/72 md:text-[15px]"
        >
          {videoLabel}
        </button>
        {isVideoOpen ? (
          <iframe
            src="https://www.youtube.com/embed/Zr3y3y9_Jcg?autoplay=1&rel=0"
            title={alt}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
            className="absolute left-1/2 top-1/2 h-[118%] w-[118%] -translate-x-1/2 -translate-y-1/2 border-0"
          />
        ) : (
          <button
            type="button"
            aria-label={`${alt} 재생`}
            onClick={() => setIsVideoOpen(true)}
            className="relative block h-full w-full cursor-pointer"
          >
            <Image
              src="/images/hero.png"
              alt={alt}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 520px"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span
                className="
                  inline-flex h-20 w-20 items-center justify-center rounded-full
                  bg-[#ff0033] text-white shadow-[0_22px_50px_-18px_rgba(255,0,51,0.45)]
                  transition-transform duration-200 group-hover:scale-[1.04]
                  dark:bg-[#ff0033] dark:text-white
                "
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="ml-1.5 h-14 w-14 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:scale-110"
                >
                  <path d="M8 6.5v11l9-5.5-9-5.5Z" />
                </svg>
              </span>
            </div>
          </button>
        )}
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
          "어려운 용어도 자동으로 정리",
          "원하는 언어로 결과 생성",
          "구조맵으로 흐름까지 한눈에",
      ];
  })();

  const featureStyles = [
    {
      icon: "mdi:check-decagram",
      iconWrap:
        "border border-emerald-200/90 bg-emerald-50 text-emerald-700 shadow-[0_12px_28px_-18px_rgba(16,185,129,0.45)] dark:border-emerald-300/30 dark:bg-emerald-300/18 dark:text-emerald-100 dark:shadow-[0_16px_34px_-20px_rgba(16,185,129,0.45)]",
    },
    {
      icon: "mdi:book-open-variant",
      iconWrap:
        "border border-blue-200/90 bg-blue-50 text-blue-700 shadow-[0_12px_28px_-18px_rgba(37,99,235,0.42)] dark:border-blue-300/30 dark:bg-blue-300/16 dark:text-blue-100 dark:shadow-[0_16px_34px_-20px_rgba(37,99,235,0.48)]",
    },
    {
      icon: "mdi:translate",
      iconWrap:
        "border border-sky-200/90 bg-sky-50 text-sky-700 shadow-[0_12px_28px_-18px_rgba(14,165,233,0.4)] dark:border-sky-300/30 dark:bg-sky-300/18 dark:text-sky-100 dark:shadow-[0_16px_34px_-20px_rgba(14,165,233,0.46)]",
    },
    {
      icon: "mdi:sitemap-outline",
      iconWrap:
        "border border-cyan-200/90 bg-cyan-50 text-cyan-700 shadow-[0_12px_28px_-18px_rgba(6,182,212,0.42)] dark:border-cyan-300/30 dark:bg-cyan-300/18 dark:text-cyan-100 dark:shadow-[0_16px_34px_-20px_rgba(6,182,212,0.48)]",
    },
  ];

  const safeIdx = titles.length ? idx % titles.length : 0;

  return (
    <main className="relative w-full overflow-hidden pt-14">
      {/* background */}
      <div
        className="
          pointer-events-none absolute inset-0 -z-10
          bg-[linear-gradient(180deg,#e9eef5_0%,#e4ebf3_38%,#edf3f8_100%),radial-gradient(420px_210px_at_16%_46%,rgba(37,99,235,0.42),transparent_64%),radial-gradient(420px_210px_at_84%_44%,rgba(59,130,246,0.40),transparent_64%),radial-gradient(640px_220px_at_50%_78%,rgba(255,255,255,0.22),transparent_74%)]
          dark:hidden
        "
      />
      <div
        className="
          pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px]
          bg-[radial-gradient(42%_56%_at_50%_0%,rgba(255,255,255,0.56),rgba(255,255,255,0.12)_58%,transparent_78%)]
          dark:hidden
        "
      />
      <div
        className="
          pointer-events-none absolute left-[-8%] top-[34%] -z-10 h-[220px] w-[220px] rounded-full
          bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.44),rgba(59,130,246,0.16)_42%,transparent_72%)]
          blur-[46px]
          dark:hidden
        "
      />
      <div
        className="
          pointer-events-none absolute right-[-8%] top-[32%] -z-10 h-[220px] w-[220px] rounded-full
          bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.40),rgba(96,165,250,0.14)_42%,transparent_72%)]
          blur-[46px]
          dark:hidden
        "
      />
      <div
        className="
          pointer-events-none absolute inset-x-[20%] top-[18%] -z-10 h-[120px]
          bg-[radial-gradient(50%_100%_at_50%_50%,rgba(255,255,255,0.34),rgba(255,255,255,0.06)_72%,transparent_100%)]
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

      <section className="mx-auto grid max-w-7xl items-start gap-10 px-6 py-10 md:grid-cols-2 md:items-start md:gap-14 md:px-10 md:pt-[108px] md:pb-12 lg:pt-[116px] lg:pb-14">
        {/* LEFT */}
        <div>
          <div className="text-sm md:text-base font-semibold text-neutral-700 dark:text-neutral-200">
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
                rounded-full border border-slate-400 bg-white text-blue-700 shadow-sm
                transition-colors hover:border-blue-300 hover:bg-blue-50
                dark:border-white/20 dark:bg-white/[0.08] dark:text-blue-300
                dark:hover:border-white/30 dark:hover:bg-white/[0.12]
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

          <p className="mt-4 max-w-2xl text-[17px] font-semibold leading-7 text-slate-700 dark:text-slate-200 md:text-[19px] md:leading-8">
            {t("helper")}
          </p>

          {/* mobile image */}
          <div className="mt-6 md:hidden">
            <HeroDiagramImage alt={t("visualAlt")} videoLabel={t("videoLabel")} />
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
                rounded-2xl border border-slate-600 bg-white px-5 py-3 font-semibold
                text-slate-800 transition-all duration-200
                shadow-[0_10px_24px_-20px_rgba(15,23,42,0.18)]
                hover:-translate-y-0.5 hover:border-blue-500 hover:bg-blue-100/90
                hover:text-blue-800 hover:shadow-[0_18px_38px_-22px_rgba(37,99,235,0.32)]
                dark:border-white/25 dark:bg-white/[0.08] dark:text-sky-100
                dark:hover:border-blue-300/55 dark:hover:bg-blue-400/10
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
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${featureStyles[i % featureStyles.length].iconWrap}`}
                  >
                    <Icon
                      icon={featureStyles[i % featureStyles.length].icon}
                      className="h-5.5 w-5.5"
                    />
                  </span>
                  <span className="text-[15px] font-semibold leading-6 text-neutral-900 dark:text-neutral-100 md:text-[17px] md:leading-7">
                    {text}
                  </span>
                </motion.div>
              ))}
            </motion.div>
          </div>

        </div>

        {/* RIGHT */}
        <div className="relative hidden md:block">
          <HeroDiagramImage alt={t("visualAlt")} videoLabel={t("videoLabel")} />
        </div>
      </section>
    </main>
  );
}
