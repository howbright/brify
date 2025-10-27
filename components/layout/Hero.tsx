"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function LandingBlueHero() {
  return (
    <main className="min-h-screen w-full bg-[radial-gradient(1200px_800px_at_80%_-10%,rgba(59,130,246,0.25),transparent_60%),radial-gradient(900px_600px_at_10%_10%,rgba(56,189,248,0.25),transparent_60%)] relative overflow-hidden">
      {/* Background gradient */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-600 opacity-20" />

      {/* Subtle grid */}
      <div className="pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)] bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:24px_24px]"/>

      {/* Header */}
      <header className="flex items-center justify-between px-6 md:px-10 py-5">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-2xl bg-white/90 shadow-md flex items-center justify-center">
            <span className="text-blue-600 font-black">B</span>
          </div>
          <span className="font-semibold tracking-tight text-neutral-900">Brify</span>
        </div>
        <nav className="flex items-center gap-3">
          <Link href="/pricing" className="text-sm px-3 py-2 rounded-full bg-white/60 backdrop-blur border border-white/50 hover:shadow-md transition-all hover:-translate-y-0.5">
            가격
          </Link>
          <Link href="/login" className="text-sm px-4 py-2 rounded-full bg-neutral-900 text-white hover:shadow-lg transition-transform hover:scale-[1.03] active:scale-100">
            로그인
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="px-6 md:px-10 grid md:grid-cols-2 gap-10 md:gap-14 items-center max-w-7xl mx-auto py-10 md:py-18 lg:py-24">
        <div className="text-neutral-900">
          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight tracking-tight"
          >
            관심 유튜브, <span className="text-blue-700">나중에 볼래?</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, duration: 0.45 }}
            className="mt-3 text-lg md:text-xl font-semibold text-neutral-900"
          >
            아니! 지금 바로 빨리 <span className="underline decoration-blue-300 decoration-4 underline-offset-4">내 걸로</span> 만들자.
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.45 }}
            className="mt-4 text-base md:text-lg text-neutral-700 max-w-2xl"
          >
            스크립트 자동 구조화로 핵심만 빠르게 챙겨. 강의·뉴스·리뷰·인터뷰 OK.
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
            <span className="px-2.5 py-1 rounded-full bg-white/70 border border-white/60">타임스탬프 제거</span>
            <span className="px-2.5 py-1 rounded-full bg-white/70 border border-white/60">핵심 트리 생성</span>
            <span className="px-2.5 py-1 rounded-full bg-white/70 border border-white/60">다이어그램 보기</span>
            <span className="px-2.5 py-1 rounded-full bg-white/70 border border-white/60">다국어 지원</span>
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
          <div className="relative rounded-3xl p-5 md:p-6 lg:p-7 bg-white/70 backdrop-blur border border-white/60 shadow-[0_20px_60px_-20px_rgba(15,23,42,0.35)]">
            <div className="flex items-center gap-3">
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-400"/>
              <div className="h-2.5 w-2.5 rounded-full bg-amber-400"/>
              <div className="h-2.5 w-2.5 rounded-full bg-rose-400"/>
            </div>
            <div className="mt-4 space-y-3">
              <div className="h-4 w-5/6 rounded-md bg-gradient-to-r from-blue-500/20 to-indigo-500/30"/>
              <div className="h-4 w-4/6 rounded-md bg-gradient-to-r from-blue-500/20 to-indigo-500/30"/>
              <div className="h-4 w-2/3 rounded-md bg-gradient-to-r from-blue-500/20 to-indigo-500/30"/>
            </div>

            {/* Mock diagram */}
            <div className="mt-6 rounded-2xl border border-blue-200/60 bg-white/80 p-4">
              <div className="text-xs font-semibold text-neutral-700">자동 구조화 다이어그램</div>
              <div className="mt-3 grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-blue-200/60 bg-gradient-to-br from-blue-50 to-indigo-50 p-3 shadow-sm">
                  <div className="text-[10px] text-neutral-600">핵심1</div>
                  <div className="mt-1 h-2 rounded bg-blue-200/60"/>
                </div>
                <div className="rounded-xl border border-blue-200/60 bg-gradient-to-br from-blue-50 to-indigo-50 p-3 shadow-sm">
                  <div className="text-[10px] text-neutral-600">핵심2</div>
                  <div className="mt-1 h-2 rounded bg-blue-200/60"/>
                </div>
                <div className="rounded-xl border border-blue-200/60 bg-gradient-to-br from-blue-50 to-indigo-50 p-3 shadow-sm">
                  <div className="text-[10px] text-neutral-600">핵심3</div>
                  <div className="mt-1 h-2 rounded bg-blue-200/60"/>
                </div>
              </div>
            </div>

            {/* Bottom CTA mini */}
            <div className="mt-5 flex items-center justify-between rounded-2xl border border-white/60 bg-white/70 p-3">
              <div className="text-sm">
                <div className="font-semibold text-neutral-900">1분 컷 요약</div>
                <div className="text-xs text-neutral-600">강의·설교·인터뷰 영상 스크립트 → 핵심</div>
              </div>
              <Link href="/summarize" className="px-3 py-2 text-sm rounded-xl bg-blue-600 text-white font-semibold transition-transform hover:scale-[1.03] active:scale-100">
                시작하기
              </Link>
            </div>
          </div>

          {/* Glow */}
          <div className="pointer-events-none absolute -inset-8 -z-10 blur-3xl opacity-40 bg-[radial-gradient(400px_200px_at_60%_20%,rgba(59,130,246,0.35),transparent),radial-gradient(300px_200px_at_40%_80%,rgba(99,102,241,0.35),transparent)]"/>
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
              <div className="text-sm font-semibold text-blue-700">{f.title}</div>
              <div className="mt-1.5 text-sm text-neutral-700">{f.desc}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 md:px-10 py-10 border-t border-white/50 bg-white/50 backdrop-blur">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-sm text-neutral-600">
          <div>© {new Date().getFullYear()} Brify. All rights reserved.</div>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-neutral-800 transition-colors">개인정보처리방침</Link>
            <Link href="/terms" className="hover:text-neutral-800 transition-colors">이용약관</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
