"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import Footer from "./Footer";

export default function LandingBlueHero() {
  return (
    <main
      className="
      pt-14 min-h-screen w-full relative overflow-hidden
      /* 큰 라디얼 두 장 */
      bg-[radial-gradient(1200px_800px_at_80%_-10%,rgb(var(--hero-a)_/_0.22),transparent_60%),radial-gradient(900px_600px_at_10%_10%,rgb(var(--hero-b)_/_0.20),transparent_60%)]
    "
    >
      {/* Background gradient */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-[rgb(var(--hero-b))] via-[rgb(var(--hero-a))] to-[rgb(var(--hero-c))] opacity-[0.18] dark:opacity-[0.22]" />

      {/* 🔥 다크용 비네트(블랙 오버레이) 추가 */}
      <div
        className="
      pointer-events-none absolute inset-0 -z-10
      bg-[radial-gradient(1200px_800px_at_50%_-20%,transparent,rgba(0,0,0,0.45))]
      hidden dark:block
    "
      />

      {/* Subtle grid */}
      <div
        className="
      pointer-events-none absolute inset-0 -z-10
      [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]
      bg-[linear-gradient(to_right,rgb(var(--hero-grid)_/_0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgb(var(--hero-grid)_/_0.05)_1px,transparent_1px)]
      bg-[size:24px_24px]
    "
      />

      {/* Hero */}
      <section className="px-6 md:px-10 grid md:grid-cols-2 gap-10 md:gap-14 items-center max-w-7xl mx-auto py-10 md:py-18 lg:py-24">
        <div className="text-neutral-900">
          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight tracking-tight
             text-neutral-900 dark:text-white dark:[text-shadow:0_1px_12px_rgba(0,0,0,0.45)]"
          >
            관심 유튜브,{" "}
            <span className="text-blue-700 dark:text-[rgb(var(--hero-b))] dark:[text-shadow:0_1px_12px_rgba(0,0,0,0.45)]">
              나중에 볼래?
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, duration: 0.45 }}
            className="mt-3 text-lg md:text-xl font-semibold text-neutral-900"
          >
            아니! 지금 바로 빨리{" "}
            <span className="underline decoration-blue-300 decoration-4 underline-offset-4">
              내 걸로
            </span>{" "}
            만들자.
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.45 }}
            className="mt-4 text-base md:text-lg max-w-3xl flex items-center text-[var(--color-muted-foreground)]"
          >
            <span
              className="font-semibold"
              style={{ color: "var(--color-foreground)" }}
            >
              스크립트 자동 구조화로{" "}
              <span
                className="font-extrabold"
                style={{ color: "hsl(var(--primary))" }}
              >
                핵심만
              </span>
              <span aria-hidden>, </span>
              <span
                className="font-extrabold"
                style={{ color: "hsl(var(--accent))" }}
              >
                빠르게
              </span>
              .
            </span>

            {/* thin divider */}
            <span className="mx-3 inline-block h-[1.1em] w-px bg-current/20 align-middle" />

            {/* compact categories with dot separators */}
            <span className="inline-flex items-center text-sm md:text-base">
              <span className="after:content-['•'] after:mx-2">강의</span>
              <span className="after:content-['•'] after:mx-2">뉴스</span>
              <span className="after:content-['•'] after:mx-2">리뷰</span>
              <span>인터뷰</span>
              <span className="ml-2 opacity-60">OK</span>
            </span>
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.45 }}
            className="mt-7 flex flex-col sm:flex-row items-start sm:items-center gap-3"
          >
            <Link
              href="/summarize"
              className="px-6 py-3 rounded-2xl bg-blue-600 text-white font-semibold shadow-sm hover:shadow-lg transition-transform hover:scale-[1.03] active:scale-100"
            >
              지금 요약해보기
            </Link>
            <Link
              href="/demo"
              className="px-5 py-3 rounded-2xl bg-white/70 border border-white/60 backdrop-blur text-neutral-900 hover:-translate-y-0.5 hover:shadow-md transition-all"
            >
              데모 보기
            </Link>
          </motion.div>

          {/* Social proof / badges */}
          <div className="mt-6 flex flex-wrap items-center gap-2 text-xs text-neutral-600">
            <span className="px-2.5 py-1 rounded-full bg-white/70 border border-white/60">
              타임스탬프 제거
            </span>
            <span className="px-2.5 py-1 rounded-full bg-white/70 border border-white/60">
              핵심 트리 생성
            </span>
            <span className="px-2.5 py-1 rounded-full bg-white/70 border border-white/60">
              다이어그램 보기
            </span>
            <span className="px-2.5 py-1 rounded-full bg-white/70 border border-white/60">
              다국어 지원
            </span>
          </div>
        </div>

        {/* Right visual */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative"
        >
          {/* Glass card */}
          <div
            className="relative rounded-3xl p-5 md:p-6 lg:p-7
                bg-white/70 dark:bg-black/40
                backdrop-blur
                border border-white/60 dark:border-white/10
                shadow-[0_20px_60px_-20px_rgba(15,23,42,0.35)]"
          >
            {/* window dots */}
            <div className="flex items-center gap-3">
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-400/90 dark:bg-emerald-300/80" />
              <div className="h-2.5 w-2.5 rounded-full bg-amber-400/90 dark:bg-amber-300/80" />
              <div className="h-2.5 w-2.5 rounded-full bg-rose-400/90 dark:bg-rose-300/80" />
            </div>

            {/* title lines */}
            <div className="mt-4 space-y-3">
              <div
                className="h-4 w-5/6 rounded-md bg-gradient-to-r
                    from-[rgb(var(--hero-a)_/_0.20)] to-[rgb(var(--hero-c)_/_0.30)]
                    dark:from-[rgb(var(--hero-a)_/_0.12)] dark:to-[rgb(var(--hero-c)_/_0.18)]"
              />
              <div
                className="h-4 w-4/6 rounded-md bg-gradient-to-r
                    from-[rgb(var(--hero-a)_/_0.20)] to-[rgb(var(--hero-c)_/_0.30)]
                    dark:from-[rgb(var(--hero-a)_/_0.12)] dark:to-[rgb(var(--hero-c)_/_0.18)]"
              />
              <div
                className="h-4 w-2/3 rounded-md bg-gradient-to-r
                    from-[rgb(var(--hero-a)_/_0.20)] to-[rgb(var(--hero-c)_/_0.30)]
                    dark:from-[rgb(var(--hero-a)_/_0.12)] dark:to-[rgb(var(--hero-c)_/_0.18)]"
              />
            </div>

            {/* Mock diagram */}
            <div
              className="mt-6 rounded-2xl border border-blue-200/60 dark:border-white/10
                  bg-white/80 dark:bg-black/30 p-4"
            >
              <div className="text-xs font-semibold text-neutral-700 dark:text-neutral-200">
                자동 구조화 다이어그램
              </div>

              <div className="mt-3 grid grid-cols-3 gap-3">
                <div
                  className="rounded-xl border border-blue-200/60 dark:border-white/10
                      bg-gradient-to-br from-blue-50 to-indigo-50
                      dark:from-[rgb(var(--hero-a)_/_0.10)]
                      dark:to-[rgb(var(--hero-c)_/_0.12)]
                      p-3 shadow-sm"
                >
                  <div className="text-[10px] text-neutral-600 dark:text-neutral-300">
                    핵심1
                  </div>
                  <div className="mt-1 h-2 rounded bg-blue-200/60 dark:bg-white/20" />
                </div>

                <div
                  className="rounded-xl border border-blue-200/60 dark:border-white/10
                      bg-gradient-to-br from-blue-50 to-indigo-50
                      dark:from-[rgb(var(--hero-a)_/_0.10)]
                      dark:to-[rgb(var(--hero-c)_/_0.12)]
                      p-3 shadow-sm"
                >
                  <div className="text-[10px] text-neutral-600 dark:text-neutral-300">
                    핵심2
                  </div>
                  <div className="mt-1 h-2 rounded bg-blue-200/60 dark:bg-white/20" />
                </div>

                <div
                  className="rounded-xl border border-blue-200/60 dark:border-white/10
                      bg-gradient-to-br from-blue-50 to-indigo-50
                      dark:from-[rgb(var(--hero-a)_/_0.10)]
                      dark:to-[rgb(var(--hero-c)_/_0.12)]
                      p-3 shadow-sm"
                >
                  <div className="text-[10px] text-neutral-600 dark:text-neutral-300">
                    핵심3
                  </div>
                  <div className="mt-1 h-2 rounded bg-blue-200/60 dark:bg-white/20" />
                </div>
              </div>
            </div>

            {/* Bottom CTA mini */}
            <div
              className="mt-5 flex items-center justify-between rounded-2xl
                  border border-white/60 dark:border-white/10
                  bg-white/70 dark:bg-black/40 p-3"
            >
              <div className="text-sm">
                <div className="font-semibold text-neutral-900 dark:text-white">
                  1분 컷 요약
                </div>
                <div className="text-xs text-neutral-600 dark:text-neutral-300">
                  강의·설교·인터뷰 영상 스크립트 → 핵심
                </div>
              </div>
              <Link
                href="/summarize"
                className="px-3 py-2 text-sm rounded-xl
                 bg-blue-600 text-white font-semibold
                 dark:bg-[rgb(var(--hero-a))]
                 transition-transform hover:scale-[1.03] active:scale-100"
              >
                시작하기
              </Link>
            </div>
          </div>

          {/* Glow */}
          <div className="pointer-events-none absolute -inset-8 -z-10 blur-3xl opacity-40 bg-[radial-gradient(400px_200px_at_60%_20%,rgba(59,130,246,0.35),transparent),radial-gradient(300px_200px_at_40%_80%,rgba(99,102,241,0.35),transparent)]" />
        </motion.div>
      </section>

      {/* Feature strip */}
      <section className="max-w-7xl mx-auto px-6 md:px-10 pb-16">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { title: "긴 영상도 1분 컷", desc: "핵심만 트리로 정리" },
            { title: "붙여넣기 즉시 시작", desc: "URL·자막·텍스트 OK" },
            { title: "다이어그램 뷰", desc: "구조를 한눈에" },
            { title: "다국어 지원", desc: "영/한/일/중 가능" },
          ].map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-2xl border border-white/60 bg-white/70 backdrop-blur p-4 hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >
              <div className="text-sm font-semibold text-blue-700">
                {f.title}
              </div>
              <div className="mt-1.5 text-sm text-neutral-700">{f.desc}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </main>
  );
}
