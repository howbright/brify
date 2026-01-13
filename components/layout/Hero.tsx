"use client";

import type { Variants } from "framer-motion";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "@/i18n/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";

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

function Highlight({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="
        whitespace-nowrap
        bg-gradient-to-r from-blue-700 via-indigo-600 to-sky-600
        dark:from-[rgb(var(--hero-b))] dark:via-indigo-400 dark:to-sky-300
        bg-clip-text text-transparent
        drop-shadow-[0_2px_10px_rgba(0,0,0,0.18)]
      "
    >
      {children}
    </span>
  );
}

/**
 * ✅ 브라우저 프레임/패딩 전부 제거
 * - 이미지가 카드 전체를 꽉 채움
 * - 라이트/다크 이미지 스위치 유지
 * - 테두리/그림자만 "이쁘게" 정리
 */
function HeroDiagramImage({ alt }: { alt: string }) {
  return (
    <div
      className="
        relative overflow-hidden
        rounded-3xl
        border border-black/5 dark:border-white/10
        bg-white/40 dark:bg-white/5
        shadow-[0_18px_55px_-26px_rgba(15,23,42,0.40)]
      "
    >
      <div className="relative w-full aspect-[16/10]">
        {/* 🌞 Light image */}
        <Image
          src="/images/hero/mindmap-preview-light.png"
          alt={alt}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 520px"
          className="object-cover dark:hidden"
        />

        {/* 🌙 Dark image */}
        <Image
          src="/images/hero/mindmap-preview-dark.png"
          alt={alt}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 520px"
          className="object-cover hidden dark:block"
        />
      </div>

      {/* ✅ 아주 얇은 하이라이트 링 (선택, 깔끔하게만) */}
      <div
        aria-hidden
        className="
          pointer-events-none absolute inset-0
          ring-1 ring-white/40 dark:ring-white/10
        "
      />
    </div>
  );
}

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
      {/* ☀️ Light BG (라이트 전용) */}
      <div
        className="
          pointer-events-none absolute inset-0 -z-10
          bg-[radial-gradient(1200px_800px_at_80%_-10%,rgb(var(--hero-a)_/_0.22),transparent_60%),radial-gradient(900px_600px_at_10%_10%,rgb(var(--hero-b)_/_0.20),transparent_60%)]
          bg-blend-normal
          dark:hidden
        "
      />
      <div
        className="
          pointer-events-none absolute inset-0 -z-10
          bg-gradient-to-br from-[rgb(var(--hero-b))] via-[rgb(var(--hero-a))] to-[rgb(var(--hero-c))]
          opacity-[0.18]
          dark:hidden
        "
      />
      <div
        className="
          pointer-events-none absolute inset-0 -z-10
          [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]
          bg-[linear-gradient(to_right,rgb(var(--hero-grid)_/_0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgb(var(--hero-grid)_/_0.05)_1px,transparent_1px)]
          bg-[size:24px_24px]
          dark:hidden
        "
      />

      {/* 🌙 Dark BG */}
      <div
        className="
          pointer-events-none absolute inset-0 -z-10 hidden dark:block
          bg-[linear-gradient(180deg,#0a0f1c_0%,#05070e_55%,#030408_100%)]
        "
      />
      <div
        className="
          pointer-events-none absolute inset-0 -z-10 hidden dark:block
          bg-[radial-gradient(900px_420px_at_50%_-10%,rgba(0,0,0,0.55),transparent_65%)]
        "
      />
      <div
        className="
          pointer-events-none absolute inset-0 -z-10 hidden dark:block
          bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)]
          bg-[size:28px_28px]
          opacity-[0.6]
        "
      />

      {/* Hero */}
      <section className="px-6 md:px-10 grid md:grid-cols-2 gap-10 md:gap-14 items-start md:items-center max-w-7xl mx-auto py-10 md:py-18 lg:py-24">
        {/* Left */}
        <div className="text-neutral-900">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-sm md:text-base font-semibold text-neutral-600 dark:text-neutral-300 tracking-tight">
              {t("eyebrow")}
            </div>

            <div className="mt-3 flex items-start gap-4">
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
                      font-extrabold leading-[1.1] tracking-tight
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
                whileHover={{ scale: 1.06, y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIdx((v) => (v + 1) % titles.length)}
                className="
                  shrink-0
                  w-14 h-14 md:w-16 md:h-16
                  relative
                  rounded-full
                  border border-white/60 dark:border-white/12
                  backdrop-blur
                  shadow-[0_10px_30px_-14px_rgba(15,23,42,0.45)]
                  hover:shadow-[0_18px_42px_-18px_rgba(15,23,42,0.55)]
                  transition-all
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--hero-b))]/50
                  overflow-hidden
                "
              >
                <span
                  className="
                    absolute inset-0
                    bg-[radial-gradient(120%_120%_at_30%_20%,rgba(59,130,246,0.26),transparent_58%),radial-gradient(120%_120%_at_70%_80%,rgba(99,102,241,0.24),transparent_55%),linear-gradient(135deg,rgba(255,255,255,0.85),rgba(239,246,255,0.70))]
                    dark:bg-[radial-gradient(120%_120%_at_30%_20%,rgba(56,189,248,0.18),transparent_60%),radial-gradient(120%_120%_at_70%_80%,rgba(99,102,241,0.20),transparent_58%),linear-gradient(135deg,rgba(255,255,255,0.10),rgba(0,0,0,0.15))]
                  "
                />
                <span className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-white/40 dark:ring-white/10" />
                <span
                  className="
                    absolute inset-0 m-auto
                    w-6 h-6 md:w-7 md:h-7
                    [clip-path:polygon(22%_12%,90%_50%,22%_88%)]
                    bg-gradient-to-b from-blue-700 via-indigo-600 to-sky-600
                    dark:from-[rgb(var(--hero-b))] dark:via-indigo-400 dark:to-sky-300
                    drop-shadow-[0_8px_16px_rgba(0,0,0,0.25)]
                  "
                />
              </motion.button>
            </div>
          </motion.div>

          {/* ✅ 모바일: 타이틀 아래 이미지만 꽉 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.99, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.12, duration: 0.45 }}
            className="mt-6 md:hidden"
          >
            <HeroDiagramImage alt={t("visualAlt")} />
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18, duration: 0.45 }}
            className="mt-7 flex flex-row items-start sm:items-center gap-3"
          >
            <Link
              href="/video-to-map"
              className="
                px-6 py-3 rounded-2xl
                bg-blue-600 text-white font-semibold
                dark:bg-[rgb(var(--hero-a))] dark:text-white
                shadow-sm hover:shadow-lg
                transition-transform hover:scale-[1.03] active:scale-100
                focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--hero-a))]/60
              "
            >
              {t("ctaPrimary")}
            </Link>

            <Link
              href="/demo"
              className="
                group relative px-5 py-3 rounded-2xl font-semibold
                text-neutral-900 dark:text-neutral-100
                overflow-hidden
                border border-white/70 dark:border-white/12
                shadow-[0_10px_30px_-18px_rgba(15,23,42,0.45)]
                backdrop-blur
                transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_46px_-22px_rgba(15,23,42,0.55)]
                focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--hero-b))]/45
              "
            >
              <span
                className="
                  absolute inset-0 -z-10
                  bg-[radial-gradient(120%_120%_at_30%_20%,rgba(59,130,246,0.20),transparent_60%),radial-gradient(120%_120%_at_75%_80%,rgba(99,102,241,0.18),transparent_58%),linear-gradient(135deg,rgba(255,255,255,0.85),rgba(239,246,255,0.70))]
                  dark:bg-[radial-gradient(120%_120%_at_30%_20%,rgba(56,189,248,0.14),transparent_62%),radial-gradient(120%_120%_at_75%_80%,rgba(99,102,241,0.16),transparent_60%),linear-gradient(135deg,rgba(255,255,255,0.10),rgba(0,0,0,0.16))]
                  transition-transform duration-500 group-hover:scale-[1.03]
                "
              />
              <span className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-white/40 dark:ring-white/10" />

              <span className="inline-flex items-center gap-2">
                <span>{t("ctaSecondary")}</span>
                <span
                  className="
                    inline-block h-4 w-4
                    [clip-path:polygon(25%_15%,85%_50%,25%_85%)]
                    bg-gradient-to-b from-blue-700 via-indigo-600 to-sky-600
                    dark:from-[rgb(var(--hero-b))] dark:via-indigo-400 dark:to-sky-300
                    transition-transform duration-300 group-hover:translate-x-0.5
                    drop-shadow-[0_6px_14px_rgba(0,0,0,0.22)]
                  "
                />
              </span>
            </Link>
          </motion.div>

          {/* Feature bullets */}
          <div className="mt-6 flex flex-col gap-2.5">
            <motion.div variants={listV} initial="hidden" animate="show" className="mt-6 flex flex-col gap-2.5">
              {features.map((text, i) => (
                <motion.div
                  key={i}
                  variants={itemV}
                  className="
                    flex items-center gap-3
                    rounded-full px-2 py-1
                    border border-black/5 dark:border-white/12
                    bg-white/65 dark:bg-white/5
                    backdrop-blur
                  "
                >
                  <span
                    className="
                      mt-0.5 shrink-0
                      h-7 w-7 rounded-full
                      bg-emerald-500/12 dark:bg-emerald-400/10
                      border border-emerald-600/20 dark:border-emerald-300/15
                      flex items-center justify-center
                    "
                    aria-hidden="true"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="h-4 w-4 text-emerald-700 dark:text-emerald-300"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </span>

                  <div className="min-w-0">
                    <div className="text-[13px] md:text-sm font-semibold text-neutral-900 dark:text-neutral-100 leading-snug">
                      {text}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* ✅ 데스크탑에서만 오른쪽 비주얼 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative hidden md:block"
        >
          <HeroDiagramImage alt={t("visualAlt")} />

          <div className="pointer-events-none absolute -inset-8 -z-10 blur-3xl opacity-40 bg-[radial-gradient(400px_200px_at_60%_20%,rgba(59,130,246,0.35),transparent),radial-gradient(300px_200px_at_40%_80%,rgba(99,102,241,0.35),transparent)]" />
        </motion.div>
      </section>
    </main>
  );
}
