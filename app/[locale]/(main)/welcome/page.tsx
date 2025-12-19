"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

export default function WelcomePage() {
  const t = useTranslations("WelcomePage");

  return (
    <main className="min-h-[calc(100vh-4rem)] w-full flex items-center justify-center bg-[radial-gradient(1200px_700px_at_85%_-10%,rgba(59,130,246,0.18),transparent_60%),radial-gradient(900px_600px_at_10%_30%,rgba(129,140,248,0.18),transparent_60%)] dark:bg-[#020617]">
      <div className="flex flex-col items-center gap-4 text-center px-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500 dark:text-neutral-400">
          {t("subtitle")}
        </p>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-neutral-900 dark:text-white">
          {t("title")}
        </h1>

        <Link
          href="/video-to-map"
          className="
            group mt-6 inline-flex items-center gap-2
            rounded-full px-6 py-2.5 text-sm font-semibold
            text-white
            bg-[radial-gradient(circle_at_0%_0%,rgba(248,250,252,0.2),transparent_55%),linear-gradient(90deg,rgb(37,99,235),rgb(129,140,248))]
            shadow-[0_18px_40px_-22px_rgba(15,23,42,0.9)]
            hover:shadow-[0_22px_55px_-25px_rgba(15,23,42,0.95)]
            hover:-translate-y-0.5 active:translate-y-0
            border border-white/20
            transition-all duration-200
          "
        >
          <span>{t("cta")}</span>
          <span
            className="
              text-xs translate-x-0 opacity-80
              group-hover:translate-x-0.5 group-hover:opacity-100
              transition-transform transition-opacity
            "
          >
            →
          </span>
        </Link>
      </div>
    </main>
  );
}
