"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
// import { useSession } from "@/components/SessionProvider";

export default function LandingPage() {
  // const { session } = useSession();
  const session = null as any; // 데모
  const primaryHref = session ? "/summarize" : "/login?next=/summarize";

  return (
    <main
      className="text-[var(--ink)]"
      style={
        {
          // 🎨 통일 팔레트 (필요하면 globals.css :root로 이동)
          ["--primary" as any]: "#2A87FF",
          ["--primary-dark" as any]: "#1E6FE0",
          ["--ink" as any]: "#22324A",
          ["--muted" as any]: "#60708C",
          ["--bg" as any]: "#F6FAFE",       // 전체 바탕
          ["--bg-alt" as any]: "#F2F7FF",   // 대체 배경
          ["--panel" as any]: "#EEF5FF",    // 섹션 패널
          ["--card" as any]: "#FFFFFF",     // 카드
          ["--border" as any]: "#D9E7FF",   // 얇은 선
        } as React.CSSProperties
      }
    >
      {/* ===== Hero Section (더 뚜렷한 오묘 그라데이션) ===== */}
      <section
        className="relative mt-2 pt-10 flex flex-col items-center justify-center min-h-[50vh] text-center px-6"
        style={{
          backgroundImage: `
            radial-gradient(700px 380px at 50% 35%, rgba(255,255,255,0.65) 0%, rgba(255,255,255,0) 70%),
            radial-gradient(900px 520px at 12% 18%, #EAF3FF 0%, rgba(234,243,255,0) 60%),
            radial-gradient(720px 420px at 88% 22%, #F0ECFF 0%, rgba(240,236,255,0) 55%),
            linear-gradient(180deg, #F6FAFE 0%, #ECF4FF 38%, #E6EEFF 72%, #EAF3FF 100%)
          `,
          backgroundRepeat: "no-repeat",
        }}
      >
        <motion.h1
          className="text-3xl md:text-5xl font-bold mb-4 leading-snug"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          긴 영상과 글, 더 이상 미루지 마세요.
          <br />
          <span className="text-[var(--primary)]">한눈에 이해되는 다이어그램</span>으로 정리해드립니다.
        </motion.h1>

        <motion.p
          className="text-base md:text-lg text-[var(--muted)] max-w-2xl leading-relaxed mb-8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.6 }}
        >
          30분짜리 유튜브 강의, 논문, 기사… 다 봐야 할까요?
          <br />
          Brify는 긴 내용을 자동으로 요약해, 핵심을 다이어그램으로 보여줍니다.
          <br />
          이제는 ‘읽기’보다 ‘이해’가 빠릅니다.
        </motion.p>
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-10"
             style={{ background: "linear-gradient(180deg, rgba(0,0,0,0) 0%, var(--panel) 100%)" }} />
      </section>

      {/* ===== Visual Demo Section (산뜻한 패널 + 은은한 텍스처) ===== */}
      <section
        className="-mt-8 rounded-t-3xl py-16 px-6 shadow-[0_-6px_24px_rgba(0,0,0,0.06)]"
        style={{
          backgroundImage: `
            radial-gradient(600px 340px at 85% 10%, rgba(255,255,255,0.65) 0%, rgba(255,255,255,0) 70%),
            linear-gradient(180deg, var(--panel) 0%, #EAF3FF 100%)
          `,
        }}
      >
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-12">
          <motion.div
            className="flex-1"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6 }}
          >
            <Image
              src="/images/demo-before.png"
              alt="Before"
              width={500}
              height={400}
              className="rounded-xl"
              style={{ border: "1px solid var(--border)", background: "var(--card)" }}
            />
            <p className="text-center mt-4 text-sm" style={{ color: "var(--muted)" }}>
              Before: 긴 텍스트 원문
            </p>
          </motion.div>

          <motion.div
            className="flex-1"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6 }}
          >
            <Image
              src="/images/demo-after.png"
              alt="After"
              width={500}
              height={400}
              className="rounded-xl"
              style={{ border: "1px solid var(--border)", background: "var(--card)" }}
            />
            <p className="text-center mt-4 text-sm" style={{ color: "var(--muted)" }}>
              After: AI 다이어그램 요약
            </p>
          </motion.div>
        </div>
      </section>

      {/* ===== Final CTA (선명한 블루 그라데이션) ===== */}
      <section
        className="py-20 text-center px-6 text-white"
        style={{ background: "linear-gradient(180deg, var(--primary-dark) 0%, var(--primary) 100%)" }}
      >
        <h2 className="text-3xl md:text-4xl font-bold mb-6 leading-snug">
          AI가 긴 글의 구조를 그려드립니다.
        </h2>
        <p className="opacity-90 max-w-2xl mx-auto">
          유튜브 강의, 논문, 기사까지 — 핵심만 빠르게, 한 장의 다이어그램으로.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
          <Link
            href={primaryHref}
            className="px-8 py-4 rounded-xl font-semibold transition-transform hover:scale-105 active:scale-100"
            style={{ background: "white", color: "var(--primary)" }}
          >
            {session ? "지금 요약해보기" : "로그인하고 요약하기"}
          </Link>
        </div>
      </section>
    </main>
  );
}
