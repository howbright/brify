"use client";

import { useTranslations } from "next-intl";

function FlowStep({
  label,
  tone,
}: {
  label: string;
  tone: "blue" | "indigo" | "sky";
}) {
  const toneClass =
    tone === "blue"
      ? "bg-gradient-to-r from-blue-500 to-sky-500 text-white shadow-[0_14px_28px_-18px_rgba(59,130,246,0.44)]"
      : tone === "indigo"
        ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-[0_14px_28px_-18px_rgba(79,70,229,0.52)]"
        : "bg-gradient-to-r from-sky-500 to-cyan-500 text-white shadow-[0_14px_28px_-18px_rgba(14,165,233,0.5)]";

  return (
    <div
      className={`inline-flex h-11 items-center px-5 text-sm font-bold tracking-tight ${toneClass}`}
      style={{
        clipPath:
          "polygon(0 0, calc(100% - 16px) 0, 100% 50%, calc(100% - 16px) 100%, 0 100%, 10px 50%)",
        paddingLeft: "20px",
        paddingRight: "28px",
      }}
    >
      <span className="whitespace-nowrap">{label}</span>
    </div>
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
    <section className="relative -mt-[90px] px-6 pb-8 pt-2 md:px-10 md:pb-10">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-3 pl-6 md:pl-10">
          <FlowStep label={flowItems[0]} tone="blue" />
          <FlowStep label={flowItems[1]} tone="indigo" />
          <FlowStep label={flowItems[2]} tone="sky" />
        </div>
      </div>
    </section>
  );
}
