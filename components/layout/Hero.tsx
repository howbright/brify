"use client";

import type { Variants } from "framer-motion";
import { AnimatePresence, motion } from "framer-motion";
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
        {/* light */}
        <Image
          src="/images/hero/mindmap-preview-light.png"
          alt={alt}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 520px"
          className="object-cover dark:hidden"
        />
        {/* dark */}
        <Image
          src="/images/hero/mindmap-preview-dark.png"
          alt={alt}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 520px"
          className="object-cover hidden dark:block"
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
    return Array.isArray(raw) ? (raw as string[]) : ["유튜브 스크립트를", "어떤 긴 글도"];
  })();

  const features = (() => {
    const raw = t.raw("featureItems");
    return Array.isArray(raw)
      ? (raw as string[])
      : [
          "세부내용도 놓치지 않고 정리",
          "모르는 용어는 자동 정리",
          "외국어는 내 언어로 변환",
          "미션 수행으로 무료 크레딧 반복 지급",
        ];
  })();

  const safeIdx = titles.length ? idx % titles.length : 0;

  return (
    <main className="pt-14 min-h-screen w-full relative overflow-hidden">
      {/* background */}
      <div
        className="
          pointer-events-none absolute inset-0 -z-10
          bg-[radial-gradient(1200px_800px_at_80%_-10%,rgb(var(--hero-a)_/_0.22),transparent_60%),radial-gradient(900px_600px_at_10%_10%,rgb(var(--hero-b)_/_0.20),transparent_60%)]
          dark:hidden
        "
      />
      <div
        className="
          pointer-events-none absolute inset-0 -z-10 hidden dark:block
          bg-[linear-gradient(180deg,#0a0f1c_0%,#05070e_55%,#030408_100%)]
        "
      />

      <section className="px-6 md:px-10 grid md:grid-cols-2 gap-10 md:gap-14 items-start md:items-center max-w-7xl mx-auto py-10 md:py-20">
        {/* LEFT */}
        <div>
          <div className="text-sm md:text-base font-semibold text-neutral-600 dark:text-neutral-300">
            {t("eyebrow")}
          </div>

          {/* title + slide handle */}
          <div className="mt-3 relative flex items-start">
            <div className="min-w-0 flex-1 pr-8">
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

            {/* 🔥 new slide handle */}
            <motion.button
              type="button"
              aria-label={t("switchTitleAria")}
              onClick={() => setIdx((v) => (v + 1) % titles.length)}
              whileHover={{ x: 3 }}
              whileTap={{ scale: 0.96 }}
              className="
                absolute right-0 top-1/2 -translate-y-1/2
                h-24 md:h-28
                w-[18px]
                rounded-full
                overflow-hidden
                bg-gradient-to-b
                  from-blue-500/70
                  via-indigo-500/80
                  to-sky-400/70
                dark:from-indigo-400/80
                dark:via-sky-400/80
                dark:to-cyan-300/80
                shadow-[0_8px_30px_-10px_rgba(59,130,246,0.8)]
                transition-all
                group
                focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/50
              "
            >
              <span
                aria-hidden
                className="
                  absolute inset-0
                  bg-[radial-gradient(80%_40%_at_50%_50%,rgba(255,255,255,0.45),transparent_70%)]
                  opacity-60
                "
              />
              <span
                className="
                  relative z-10 mx-auto block
                  w-3 h-3
                  [clip-path:polygon(25%_15%,85%_50%,25%_85%)]
                  bg-white dark:bg-slate-900
                  drop-shadow-[0_2px_6px_rgba(0,0,0,0.35)]
                  group-hover:translate-x-[1px]
                  transition-transform
                "
              />
            </motion.button>
          </div>

          {/* mobile image */}
          <div className="mt-6 md:hidden">
            <HeroDiagramImage alt={t("visualAlt")} />
          </div>

          {/* CTA */}
          <div className="mt-7 flex gap-3">
            <Link
              href="/video-to-map"
              className="
                px-6 py-3 rounded-2xl
                bg-blue-600 text-white font-semibold
                shadow-sm hover:shadow-lg
                transition-transform hover:scale-[1.03]
              "
            >
              {t("ctaPrimary")}
            </Link>

            <Link
              href="/demo"
              className="
                px-5 py-3 rounded-2xl font-semibold
                text-neutral-900 dark:text-sky-100
                bg-white/70 dark:bg-slate-900/60
                shadow-[0_10px_30px_-18px_rgba(15,23,42,0.45)]
                dark:shadow-[0_0_0_1px_rgba(56,189,248,0.25),0_10px_30px_-20px_rgba(56,189,248,0.6)]
              "
            >
              {t("ctaSecondary")}
            </Link>
          </div>

          {/* features */}
          <div className="mt-6 flex flex-col gap-2.5">
            <motion.div variants={listV} initial="hidden" animate="show">
              {features.map((text, i) => (
                <motion.div
                  key={i}
                  variants={itemV}
                  className="
                    flex items-center gap-3
                    rounded-full px-2 py-1
                    bg-white/65 dark:bg-white/5
                    backdrop-blur
                  "
                >
                  <span className="h-7 w-7 rounded-full bg-emerald-500/15 flex items-center justify-center">
                    ✓
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
