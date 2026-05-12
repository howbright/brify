"use client";

import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import Image from "next/image";

type UsageStep = {
  title: string;
  description: string;
};

export default function LandingUsageGuideSection({ isAuthed = false }: { isAuthed?: boolean }) {
  const t = useTranslations("LandingUsageGuideSection");

  const steps = (() => {
    const raw = t.raw("steps");
    return Array.isArray(raw) ? (raw as UsageStep[]) : [];
  })();

  const stepVisuals = [
    "/images/desc/desc1.png",
    "/images/desc/desc2.png",
    "/images/example.png",
    "/images/desc/desc4.png",
    "/images/desc/desc5.png",
    "/images/desc/desc6.png",
  ] as const;

  return (
    <section className="relative px-6 py-10 md:px-10 md:py-12">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-3xl border border-slate-200/90 bg-white/86 p-5 shadow-[0_26px_66px_-46px_rgba(30,64,175,0.5)] backdrop-blur dark:border-white/12 dark:bg-slate-950/68 md:p-7">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700 dark:text-sky-300">
              {t("eyebrow")}
            </p>
            <h2 className="mt-2 text-xl font-extrabold leading-tight text-slate-900 dark:text-white md:text-2xl">
              {t("title")}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300 md:text-[15px]">
              {t("subtitle")}
            </p>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {steps.map((step, index) => (
              <article
                key={`${step.title}-${index}`}
                className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 transition-colors hover:border-blue-300 hover:bg-white dark:border-white/12 dark:bg-white/[0.04] dark:hover:border-sky-300/35 dark:hover:bg-white/[0.07] md:p-5"
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-lg bg-slate-900 text-sm font-extrabold text-white shadow-sm ring-1 ring-slate-900/10 dark:bg-white dark:text-slate-900 dark:ring-white/30">
                    {index + 1}
                  </span>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {step.title}
                  </p>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {step.description}
                </p>
                <div className="relative mt-3 aspect-[16/9] overflow-hidden rounded-xl border border-slate-200/90 bg-white dark:border-white/10 dark:bg-slate-900">
                  <Image
                    src={stepVisuals[index] ?? stepVisuals[0]}
                    alt={step.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className={`${index === 1 ? "object-contain bg-slate-50 dark:bg-slate-900" : "object-cover"} saturate-[0.78] contrast-[0.92] brightness-[0.96]`}
                  />
                  <div className="pointer-events-none absolute inset-0 bg-white/12 dark:bg-slate-950/18" />
                </div>
              </article>
            ))}
          </div>

          <div className="mt-5">
            <Link
              href={isAuthed ? "/video-to-map" : "/signup?next=%2Fvideo-to-map"}
              className="inline-flex items-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#1d4ed8_0%,#2563eb_45%,#3b82f6_100%)] px-5 py-3 text-sm font-bold text-white shadow-[0_20px_46px_-28px_rgba(37,99,235,0.78)] transition-transform hover:scale-[1.02]"
            >
              {t("cta")}
              <Icon icon="mdi:arrow-right" className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
