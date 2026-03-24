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
      ? "bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow-[0_14px_28px_-18px_rgba(37,99,235,0.46)]"
      : tone === "indigo"
        ? "bg-gradient-to-r from-blue-700 to-blue-500 text-white shadow-[0_14px_28px_-18px_rgba(29,78,216,0.5)]"
        : "bg-gradient-to-r from-sky-500 to-cyan-400 text-white shadow-[0_14px_28px_-18px_rgba(8,145,178,0.48)]";

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
          bg-[linear-gradient(180deg,#e4f0ff_0%,#d7e9ff_18%,#cfe5ff_48%,#dbeeff_100%)]
          dark:bg-[linear-gradient(180deg,#06111f_0%,#08192d_16%,#0a2036_48%,#081727_100%)]
        "
      />
      <div
        aria-hidden
        className="
          pointer-events-none absolute inset-0
          bg-[radial-gradient(56%_80%_at_50%_14%,rgba(255,255,255,0.54),transparent_60%),radial-gradient(44%_52%_at_18%_58%,rgba(59,130,246,0.16),transparent_68%),radial-gradient(44%_52%_at_82%_58%,rgba(14,165,233,0.14),transparent_70%)]
          dark:bg-[radial-gradient(56%_80%_at_50%_14%,rgba(56,189,248,0.08),transparent_58%),radial-gradient(44%_52%_at_18%_58%,rgba(37,99,235,0.12),transparent_68%),radial-gradient(44%_52%_at_82%_58%,rgba(14,165,233,0.10),transparent_70%)]
        "
      />
      <div
        aria-hidden
        className="
          pointer-events-none absolute left-1/2 top-10 h-52 w-[44rem] -translate-x-1/2 rounded-full
          bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.24),rgba(37,99,235,0.12)_42%,transparent_72%)]
          blur-[72px]
          dark:bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.14),rgba(8,47,73,0.08)_42%,transparent_74%)]
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
            rounded-[32px] border border-blue-200/85 px-5 py-5
            bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(230,242,255,0.96))]
            shadow-[0_28px_80px_-40px_rgba(37,99,235,0.3)]
            dark:border-blue-200/14 dark:bg-[linear-gradient(180deg,rgba(11,28,46,0.84),rgba(9,23,40,0.92))]
            dark:shadow-[0_24px_70px_-42px_rgba(8,15,31,0.86)]
            md:gap-x-3 md:px-8 md:py-6
          "
        >
          <div
            aria-hidden
            className="
              pointer-events-none absolute inset-x-10 top-1/2 hidden h-px -translate-y-1/2
              bg-[linear-gradient(90deg,transparent,rgba(59,130,246,0.18),rgba(14,165,233,0.22),rgba(56,189,248,0.2),transparent)]
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
