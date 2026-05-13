// components/landing/FinalCTA.tsx
"use client";

import Image from "next/image";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { dispatchNavigationStart } from "@/app/lib/dispatchNavigationStart";

type Props = {
  isAuthed?: boolean;
  primaryHrefSignedOut?: string; // default: /signup
  primaryHrefSignedIn?: string; // default: /summarize
  showSecondary?: boolean;
  secondaryHref?: string; // default: /pricing
  className?: string;
};

export default function FinalCTA({
  isAuthed = false,
  primaryHrefSignedOut = "/signup",
  primaryHrefSignedIn = "/video-to-map",
  showSecondary = true,
  secondaryHref = "/pricing",
  className = "",
}: Props) {
  const t = useTranslations("FinalCTA");
  const router = useRouter();
  const pathname = usePathname();
  const [pendingCta, setPendingCta] = useState<"primary" | "secondary" | null>(null);

  const primaryHref = isAuthed ? primaryHrefSignedIn : primaryHrefSignedOut;
  const primaryLabel = isAuthed
    ? t("primary.signedIn")
    : t("primary.signedOut");
  const subLabel = showSecondary ? t("secondary.label") : "";

  useEffect(() => {
    setPendingCta(null);
  }, [pathname]);

  useEffect(() => {
    void router.prefetch(primaryHref);
    if (showSecondary) {
      void router.prefetch(secondaryHref);
    }
  }, [primaryHref, router, secondaryHref, showSecondary]);

  const startNavigationFeedback = (target: "primary" | "secondary") => {
    setPendingCta(target);
    dispatchNavigationStart(`final-cta-${target}`);
  };

  return (
    // ✅ 섹션 자체는 full-bleed (w-full) + no max-width + no rounding
    <section
      className={[
        "relative w-full overflow-hidden isolate", // isolate: 배경 레이어가 부모 영향 안받도록
        className,
      ].join(" ")}
    >
      <Image
        src="/images/ctabg.png"
        alt=""
        fill
        priority
        aria-hidden
        className="absolute inset-0 -z-20 object-cover"
      />
      <div
        aria-hidden
        className="
          absolute inset-0 -z-10
          bg-[linear-gradient(180deg,rgba(8,14,28,0.78)_0%,rgba(8,14,28,0.72)_48%,rgba(6,10,20,0.82)_100%)]
        "
      />
      <div
        aria-hidden
        className="
          absolute inset-0 -z-10
          [mask-image:radial-gradient(1200px_520px_at_50%_10%,black,transparent)]
          bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)]
          bg-[size:28px_28px]
          opacity-[0.16]
        "
      />
      <div
        aria-hidden
        className="
          absolute inset-0 -z-10
          bg-[radial-gradient(520px_260px_at_20%_0%,rgba(59,130,246,0.18),transparent_60%),radial-gradient(480px_260px_at_80%_100%,rgba(99,102,241,0.18),transparent_60%)]
          opacity-60
        "
      />

      {/* ✅ 콘텐츠는 내부 컨테이너에서만 max-w 적용 */}
      <div className="px-6 md:px-10 py-14 md:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <h2
              className="
                text-2xl md:text-3xl font-extrabold tracking-tight
                text-white
              "
            >
              {t("title")}
              <span className="block mt-1 text-white/90">
                {t.rich("subtitle", {
                  brand: (chunks) => (
                    <span className="font-extrabold text-[rgb(var(--hero-b))]">
                      {chunks}
                    </span>
                  ),
                })}
              </span>
            </h2>

            <p className="mt-4 text-base font-normal text-white/90">
              {t.rich("body", {
                highlight: (chunks) => (
                  <span className="font-bold text-[rgb(var(--hero-a))]">
                    {chunks}
                  </span>
                ),
              })}
            </p>

            <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
              {/* Primary */}
              <Link
                href={primaryHref}
                onClick={() => startNavigationFeedback("primary")}
                className={[
                  "px-6 py-3 rounded-2xl font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60",
                  "transition-all active:scale-100",
                  pendingCta === "primary"
                    ? "bg-white text-[#0b1224] shadow-[0_10px_24px_-18px_rgba(255,255,255,0.45)] opacity-95 cursor-progress"
                    : "bg-white text-[#0b1224] shadow-[0_18px_42px_-24px_rgba(255,255,255,0.55)] hover:shadow-[0_22px_48px_-24px_rgba(255,255,255,0.65)] hover:scale-[1.03]",
                ].join(" ")}
                aria-busy={pendingCta === "primary" ? "true" : "false"}
                style={
                  pendingCta === "primary"
                    ? {
                        transform: "translateY(1px) scale(0.985)",
                        filter: "brightness(0.93)",
                      }
                    : undefined
                }
              >
                {primaryLabel}
              </Link>

              {/* Secondary */}
              {showSecondary && (
                <Link
                  href={secondaryHref}
                  onClick={() => startNavigationFeedback("secondary")}
                  className={[
                    "px-5 py-3 rounded-2xl border text-white font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30",
                    "transition-all",
                    pendingCta === "secondary"
                      ? "bg-white/[0.22] border-white/45 shadow-[0_10px_24px_-18px_rgba(255,255,255,0.22)] cursor-progress"
                      : "bg-white/[0.12] border-white/30 hover:-translate-y-0.5 hover:bg-white/[0.16] hover:shadow-md",
                  ].join(" ")}
                  aria-busy={pendingCta === "secondary" ? "true" : "false"}
                  style={
                    pendingCta === "secondary"
                      ? {
                          transform: "translateY(1px) scale(0.985)",
                          filter: "brightness(0.94)",
                        }
                      : undefined
                  }
                >
                  {subLabel}
                </Link>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* soft bottom glow */}
      <div
        aria-hidden
        className="
          pointer-events-none absolute bottom-[-20%] left-1/2 -translate-x-1/2 -z-10
          h-[360px] w-[720px] blur-3xl opacity-40
          bg-[radial-gradient(320px_160px_at_center,rgba(59,130,246,0.35),transparent)]
        "
      />
    </section>
  );
}
