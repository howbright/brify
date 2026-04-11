"use client";

import type { Variants } from "framer-motion";
import { AnimatePresence, motion } from "framer-motion";
import { Icon } from "@iconify/react";
import { Link } from "@/i18n/navigation";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
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
        break-words md:whitespace-nowrap
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
  videoLoadingLabel,
}: {
  alt: string;
  videoLabel: string;
  videoLoadingLabel: string;
}) {
  const [isInlineVideoOpen, setIsInlineVideoOpen] = useState(false);
  const [isMobileVideoOpen, setIsMobileVideoOpen] = useState(false);
  const [isOpeningVideo, setIsOpeningVideo] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const locale = useLocale();
  const heroVideoSrc =
    locale.toLowerCase().startsWith("ko")
      ? "https://www.youtube.com/embed/IvC8y0eY5bE?autoplay=1&rel=0"
      : "https://www.youtube.com/embed/HMKChsqujos?autoplay=1&rel=0";

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const sync = () => setIsMobile(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  const openVideo = () => {
    setIsOpeningVideo(true);
    if (isMobile) {
      setIsMobileVideoOpen(true);
      return;
    }
    setIsInlineVideoOpen(true);
  };

  const closeMobileVideo = () => {
    setIsMobileVideoOpen(false);
    setIsOpeningVideo(false);
  };

  return (
    <>
      <div className="group relative">
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
        <div className="relative w-full overflow-hidden rounded-3xl">
          <div className="relative aspect-video overflow-hidden rounded-3xl">
            {isInlineVideoOpen && !isMobile ? (
              <iframe
                src={heroVideoSrc}
                title={alt}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
                onLoad={() => setIsOpeningVideo(false)}
                className="absolute inset-0 z-20 h-full w-full border-0"
              />
            ) : (
              <button
                type="button"
                onClick={openVideo}
                className="relative block h-full w-full cursor-pointer"
                aria-label={videoLabel}
              >
                <Image
                  src="/images/hero/hero5.png"
                  alt={alt}
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, 520px"
                  className="object-cover"
                />
                <span className="absolute inset-0 bg-gradient-to-t from-slate-950/20 via-transparent to-transparent" />
              </button>
            )}
            {isOpeningVideo && (!isMobile || !isMobileVideoOpen) ? (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/18 backdrop-blur-[2px]">
                <div className="inline-flex items-center gap-2 rounded-full bg-slate-950/72 px-4 py-2 text-sm font-semibold text-white shadow-lg">
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />
                  {videoLoadingLabel}
                </div>
              </div>
            ) : null}
          </div>
          <div className="flex justify-end px-1 pt-3">
            <button
              type="button"
              onClick={openVideo}
              disabled={isOpeningVideo}
              className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-700 bg-slate-800 px-3.5 py-2 text-sm font-bold tracking-[0.04em] text-white transition-transform duration-200 hover:scale-[1.03] hover:bg-slate-900 dark:border-white/18 dark:bg-white/[0.14] dark:text-white dark:hover:bg-white/[0.2] md:text-[15px]"
            >
              {isOpeningVideo ? (
                <>
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />
                  {videoLoadingLabel}
                </>
              ) : (
                <>
                  <span className="inline-flex items-center justify-center">
                    <Icon icon="lucide:clapperboard" className="h-[18px] w-[18px]" />
                  </span>
                  {videoLabel}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      {isMobileVideoOpen ? (
        <div className="fixed inset-0 z-[250] bg-black sm:hidden">
          <button
            type="button"
            onClick={closeMobileVideo}
            className="absolute right-4 top-4 z-[260] inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur hover:bg-white/16"
            aria-label="Close video"
          >
            <Icon icon="mdi:close" className="h-5 w-5" />
          </button>

          <div className="flex h-full w-full items-center justify-center px-0">
            <div className="relative w-full">
              <div className="relative aspect-video w-full bg-black">
                <iframe
                  src={isMobileVideoOpen ? heroVideoSrc : undefined}
                  title={alt}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                  onLoad={() => setIsOpeningVideo(false)}
                  className="absolute inset-0 h-full w-full border-0"
                />
                {isOpeningVideo ? (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/38">
                    <div className="inline-flex items-center gap-2 rounded-full bg-black/78 px-4 py-2 text-sm font-semibold text-white shadow-lg">
                      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />
                      {videoLoadingLabel}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

/* ---------------- main ---------------- */

export default function LandingBlueHero({ isAuthed = false }: { isAuthed?: boolean }) {
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
          "구조맵끼리 비교하며 차이를 한눈에",
      ];
  })();

  const safeIdx = titles.length ? idx % titles.length : 0;
  const renderFeatures = (
    className?: string,
    gridClassName = "grid gap-x-5 gap-y-3 sm:grid-cols-2",
  ) => (
    <div className={className}>
      <motion.div
        className={gridClassName}
        variants={listV}
        initial="hidden"
        animate="show"
      >
        {features.map((text, i) => (
          <motion.div key={i} variants={itemV} className="flex min-w-0 items-center gap-3">
            <span
              aria-hidden
              className="h-2.5 w-2.5 shrink-0 self-center rounded-full bg-gradient-to-br from-blue-600 via-sky-500 to-cyan-400 shadow-[0_0_0_5px_rgba(59,130,246,0.10)] dark:from-sky-300 dark:via-blue-300 dark:to-cyan-200 dark:shadow-[0_0_0_5px_rgba(125,211,252,0.10)]"
            />
            <span className="min-w-0 text-[15px] font-normal leading-6 text-neutral-900 [overflow-wrap:anywhere] dark:text-neutral-100 md:text-[17px] md:leading-7">
              {text}
            </span>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );

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
        <div className="min-w-0">
          <div className="max-w-full text-sm font-normal text-neutral-700 [overflow-wrap:anywhere] dark:text-neutral-200 md:text-base">
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
                    text-neutral-900 [overflow-wrap:anywhere] dark:text-white
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

          <p className="mt-4 max-w-2xl text-[17px] font-normal leading-7 text-slate-700 [overflow-wrap:anywhere] dark:text-slate-200 md:text-[19px] md:leading-8">
            {t("helper")}
          </p>

          {/* mobile image */}
          <div className="mt-6 md:hidden">
            <HeroDiagramImage
              alt={t("visualAlt")}
              videoLabel={t("videoLabel")}
              videoLoadingLabel={t("videoLoadingLabel")}
            />
          </div>

          {/* CTA */}
          <div className="mt-7 flex gap-4">
            <Link
              href={isAuthed ? "/video-to-map" : "/signup?next=%2Fvideo-to-map"}
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
          {renderFeatures("mt-6 md:hidden")}
          {renderFeatures("mt-6 hidden min-[1126px]:block")}

        </div>

        {/* RIGHT */}
        <div className="relative hidden md:block">
          <HeroDiagramImage
            alt={t("visualAlt")}
            videoLabel={t("videoLabel")}
            videoLoadingLabel={t("videoLoadingLabel")}
          />
        </div>

        {renderFeatures(
          "hidden md:max-[1125px]:col-span-2 md:max-[1125px]:mt-1 md:max-[1125px]:block",
          "grid gap-x-6 gap-y-3 md:grid-cols-2 min-[980px]:grid-cols-4",
        )}
      </section>
    </main>
  );
}
