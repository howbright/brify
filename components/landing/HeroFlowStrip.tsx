"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

function FlowStep({
  label,
  tone,
  index = 0,
}: {
  label: string;
  tone: "blue" | "indigo" | "sky";
  index?: number;
}) {
  const toneClass =
    tone === "blue"
      ? "bg-gradient-to-r from-blue-500 to-sky-500 text-white shadow-[0_14px_28px_-18px_rgba(59,130,246,0.44)]"
      : tone === "indigo"
        ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-[0_14px_28px_-18px_rgba(79,70,229,0.52)]"
        : "bg-gradient-to-r from-sky-500 to-cyan-500 text-white shadow-[0_14px_28px_-18px_rgba(14,165,233,0.5)]";

  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.65 }}
      transition={{ duration: 0.42, delay: index * 0.08, ease: "easeOut" }}
      whileHover={{ y: -2, scale: 1.02 }}
      className={`inline-flex h-12 items-center px-6 text-[15px] font-extrabold tracking-tight md:text-base ${toneClass}`}
      style={{
        clipPath:
          "polygon(0 0, calc(100% - 16px) 0, 100% 50%, calc(100% - 16px) 100%, 0 100%, 10px 50%)",
        paddingLeft: "22px",
        paddingRight: "30px",
      }}
    >
      <span className="whitespace-nowrap">{label}</span>
    </motion.div>
  );
}

export default function HeroFlowStrip() {
  const t = useTranslations("LandingBlueHero");
  const flowItems = (() => {
    const raw = t.raw("flowItems");
    return Array.isArray(raw)
      ? (raw as string[])
      : ["스크립트 입력", "구조맵 생성", "읽기 · 편집 · 공유"];
  })();

  return (
    <section className="relative isolate mt-0 overflow-hidden px-6 pb-10 pt-12 md:px-10 md:pt-[70px] md:pb-12 lg:pt-[70px]">
      <div
        aria-hidden
        className="
          pointer-events-none absolute inset-x-0 top-0 h-full
          bg-[linear-gradient(180deg,rgba(238,245,255,0)_0%,rgba(222,237,255,0.9)_20%,#edf5ff_52%,rgba(232,242,255,0.96)_100%)]
          dark:bg-[linear-gradient(180deg,rgba(5,17,30,0)_0%,rgba(10,24,46,0.88)_18%,rgba(10,23,42,0.96)_56%,rgba(8,17,31,0.98)_100%)]
        "
      />
      <div
        aria-hidden
        className="
          pointer-events-none absolute left-1/2 top-8 h-40 w-[36rem] -translate-x-1/2 rounded-full
          bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.18),rgba(59,130,246,0.06)_45%,transparent_72%)]
          blur-3xl
          dark:bg-[radial-gradient(circle_at_center,rgba(96,165,250,0.16),rgba(56,189,248,0.06)_42%,transparent_72%)]
        "
      />
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="
            relative mx-auto flex w-full max-w-4xl flex-wrap items-center justify-center gap-x-2 gap-y-3
            rounded-[30px] border border-white/70 px-5 py-5
            bg-white/72 shadow-[0_24px_70px_-40px_rgba(37,99,235,0.28)]
            backdrop-blur-md
            dark:border-white/10 dark:bg-white/[0.05]
            dark:shadow-[0_24px_70px_-42px_rgba(8,15,31,0.9)]
            md:gap-x-3 md:px-8 md:py-6
          "
        >
          <div
            aria-hidden
            className="
              pointer-events-none absolute inset-x-10 top-1/2 hidden h-px -translate-y-1/2
              bg-[linear-gradient(90deg,transparent,rgba(59,130,246,0.24),rgba(99,102,241,0.22),rgba(14,165,233,0.24),transparent)]
              md:block
            "
          />
          <FlowStep label={flowItems[0]} tone="blue" index={0} />
          <FlowStep label={flowItems[1]} tone="indigo" index={1} />
          <FlowStep label={flowItems[2]} tone="sky" index={2} />
        </motion.div>
      </div>
    </section>
  );
}
