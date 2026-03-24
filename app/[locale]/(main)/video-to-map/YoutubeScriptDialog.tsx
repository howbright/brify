"use client";

import { Icon } from "@iconify/react";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";

type Props = {
  open: boolean;
  onClose: () => void;
};

type GuideStep = {
  number: number;
  title: string;
  imageLabel: string;
  accent: "neutral" | "indigo";
  imageSrc: string;
  description?: string;
  keycap?: boolean;
};

export default function YoutubeScriptDialog({ open, onClose }: Props) {
  const t = useTranslations("YoutubeScriptDialog");
  const [openStep, setOpenStep] = useState<number>(5);
  const GUIDE_STEPS: GuideStep[] = [
    { number: 1, title: t("steps.1.title"), imageLabel: t("steps.1.imageLabel"), accent: "neutral", imageSrc: "/images/help/youtube-step1-watch-page.png" },
    { number: 2, title: t("steps.2.title"), imageLabel: t("steps.2.imageLabel"), accent: "neutral", imageSrc: "/images/help/youtube-step2-menu.png" },
    { number: 3, title: t("steps.3.title"), imageLabel: t("steps.3.imageLabel"), accent: "neutral", imageSrc: "/images/help/firstwordselected.png" },
    { number: 4, title: t("steps.4.title"), imageLabel: t("steps.4.imageLabel"), accent: "neutral", imageSrc: "/images/help/scroll.png" },
    { number: 5, title: t("steps.5.title"), description: t("steps.5.description"), imageLabel: t("steps.5.imageLabel"), accent: "indigo", imageSrc: "/images/help/shiftkey.jpg" },
    { number: 6, title: t("steps.6.title"), imageLabel: t("steps.6.imageLabel"), accent: "neutral", imageSrc: "/images/help/allselected.png" },
    { number: 7, title: t("steps.7.title"), imageLabel: t("steps.7.imageLabel"), accent: "neutral", keycap: true, imageSrc: "/images/help/copy.png" },
    { number: 8, title: t("steps.8.title"), imageLabel: t("steps.8.imageLabel"), accent: "neutral", keycap: true, imageSrc: "/images/help/paste.png" },
  ];

  // ✅ ESC 닫기
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      setOpenStep(5);
    }
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="
        fixed inset-0 z-50 flex items-center justify-center
        bg-black/55
      "
      role="dialog"
      aria-modal="true"
      aria-label={t("dialogAria")}
      onMouseDown={(e) => {
        // ✅ 바깥 클릭 닫기
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="
          w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-3xl
          bg-white border border-slate-400
          shadow-[0_24px_70px_-30px_rgba(15,23,42,0.85)]
          p-5 md:p-6

          dark:bg-[#0F172A]
          dark:border-white/20
          dark:ring-1 dark:ring-white/5
          dark:shadow-[0_28px_90px_-55px_rgba(0,0,0,0.85)]
          dark:bg-[linear-gradient(to_bottom,rgba(255,255,255,0.06),rgba(255,255,255,0.0))]
        "
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_240px_at_20%_0%,rgba(59,130,246,0.12),transparent_58%)] dark:bg-[radial-gradient(900px_240px_at_20%_0%,rgba(56,189,248,0.14),transparent_58%)]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-slate-300/90 to-transparent dark:via-white/18" />
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-xl md:text-2xl font-bold text-blue-700 dark:text-[rgb(var(--hero-b))] flex items-center gap-2">
              <Icon icon="mdi:youtube" className="h-6 w-6 text-blue-700 dark:text-[rgb(var(--hero-b))]" />
              {t("title")}
            </h2>
            <p className="text-base font-medium text-neutral-700 dark:text-neutral-200">
              {t("subtitle")}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="
              rounded-full p-1.5
              text-neutral-500 transition hover:text-neutral-900
              dark:text-neutral-300 dark:hover:text-white
            "
            aria-label={t("close")}
          >
            <Icon icon="mdi:close" className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 space-y-2">
          {GUIDE_STEPS.map((step) => {
            const expanded = openStep === step.number;
            const isAccent = step.accent === "indigo";

            return (
              <div
                key={step.number}
                className={[
                  "overflow-hidden rounded-2xl border transition-colors",
                  isAccent
                    ? "border-indigo-200 bg-indigo-50 dark:border-indigo-400/30 dark:bg-indigo-500/10"
                    : "border-slate-400 bg-neutral-50 dark:border-white/20 dark:bg-white/[0.04]",
                ].join(" ")}
              >
                <button
                  type="button"
                  onClick={() => setOpenStep(expanded ? 0 : step.number)}
                  className="flex w-full items-center gap-3 px-3 py-3 text-left"
                >
                  <div
                    className={[
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                      isAccent
                        ? "bg-indigo-600 text-white"
                        : "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900",
                    ].join(" ")}
                  >
                    {step.number}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p
                      className={[
                        "text-sm font-medium",
                        isAccent
                          ? "text-indigo-950 dark:text-indigo-100"
                          : "text-neutral-800 dark:text-neutral-100",
                      ].join(" ")}
                    >
                      {step.keycap ? (
                        step.number === 7 ? (
                          <span className="rounded-md bg-white px-2 py-1 text-xs font-bold text-neutral-800 shadow-sm dark:bg-slate-900 dark:text-neutral-100">
                            {step.title}
                          </span>
                        ) : (
                          <>
                            {t("pastePrefix")}{" "}
                            <span className="rounded-md bg-white px-2 py-1 text-xs font-bold text-neutral-800 shadow-sm dark:bg-slate-900 dark:text-neutral-100">
                              Ctrl + V
                            </span>
                          </>
                        )
                      ) : step.number === 5 ? (
                        <>
                          <span className="rounded-md bg-white px-2 py-1 text-xs font-bold text-indigo-700 shadow-sm dark:bg-indigo-950 dark:text-indigo-200">
                            Shift
                          </span>{" "}
                          {t("shiftHold")}
                        </>
                      ) : (
                        step.title
                      )}
                    </p>

                    {step.description ? (
                      <p
                        className={[
                          "mt-1 text-xs",
                          isAccent
                            ? "text-indigo-700 dark:text-indigo-200"
                            : "text-neutral-500 dark:text-neutral-400",
                        ].join(" ")}
                      >
                        {step.description}
                      </p>
                    ) : null}
                  </div>

                  <Icon
                    icon="mdi:chevron-down"
                    className={[
                      "h-5 w-5 shrink-0 transition-transform",
                      expanded ? "rotate-180" : "",
                      isAccent
                        ? "text-indigo-500 dark:text-indigo-200"
                        : "text-neutral-400 dark:text-neutral-500",
                    ].join(" ")}
                  />
                </button>

                {expanded ? (
                  <div className="px-3 pb-3">
                    <div
                      className={[
                        "flex min-h-[220px] items-center justify-center rounded-2xl border border-dashed",
                        isAccent
                          ? "border-indigo-300 bg-white/70 dark:border-indigo-400/30 dark:bg-black/10"
                          : "border-slate-400 bg-white dark:border-white/20 dark:bg-slate-950/70",
                      ].join(" ")}
                    >
                      <div className="flex flex-col items-center gap-2 text-center">
                        <Image
                          src={step.imageSrc}
                          alt={step.title}
                          width={1200}
                          height={800}
                          className="max-h-[320px] w-full rounded-xl object-contain"
                        />
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="
              rounded-2xl px-4 py-2.5 text-sm font-semibold text-neutral-800
              border border-slate-400 bg-white
              hover:bg-neutral-100

              dark:text-white
              dark:border-white/20
              dark:bg-white/[0.04]
              dark:hover:bg-white/10
            "
          >
            {t("close")}
          </button>
        </div>
      </div>
    </div>
  );
}
