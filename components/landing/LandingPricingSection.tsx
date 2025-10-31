// components/landing/LandingPricingSection.tsx
"use client";

import PricingGrid, { Pack } from "@/components/pricing/PricingGrid";
import Link from "next/link";

type Props = {
  isAuthed: boolean;
  packs?: Pack[]; // 안 넘기면 기본 팩 사용
};

const DEFAULT_PACKS: Pack[] = [
  { id: "50", credits: 50, priceUSD: 5, starter: true, badgeText: "Starter", tagline: "Try & keep" },
  { id: "300", credits: 300, priceUSD: 25, popular: true, bonusPercent: 10, badgeText: "Best value" },
  { id: "1000", credits: 1000, priceUSD: 70 },
];

export default function LandingPricingSection({ isAuthed, packs = DEFAULT_PACKS }: Props) {
  return (
    <section className="relative overflow-hidden">
      {/* ==== BG (Light) ==== */}
      <div
        aria-hidden
        className="
          pointer-events-none absolute inset-0 -z-10
          bg-[radial-gradient(1200px_700px_at_85%_-10%,rgb(var(--hero-a)_/_0.28),transparent_60%),radial-gradient(900px_600px_at_10%_30%,rgb(var(--hero-b)_/_0.22),transparent_60%)]
          bg-blend-normal
          dark:hidden
        "
      />
      <div
        aria-hidden
        className="
          pointer-events-none absolute inset-0 -z-10
          [mask-image:radial-gradient(ellipse_at_center,black,transparent_72%)]
          bg-[linear-gradient(to_right,rgb(var(--hero-grid)_/_0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgb(var(--hero-grid)_/_0.05)_1px,transparent_1px)]
          bg-[size:24px_24px]
          dark:hidden
        "
      />
      {/* subtle glass veil */}
      <div
        aria-hidden
        className="
          pointer-events-none absolute inset-0 -z-10
          bg-gradient-to-b from-white/10 via-white/30 to-white/10
          dark:hidden
        "
      />

      {/* ==== BG (Dark) ==== */}
      <div
        aria-hidden
        className="
          pointer-events-none absolute inset-0 -z-10 hidden dark:block
          bg-[linear-gradient(180deg,#071124_0%,#050a17_55%,#04070f_100%)]
        "
      />
      <div
        aria-hidden
        className="
          pointer-events-none absolute inset-0 -z-10 hidden dark:block
          bg-[radial-gradient(900px_420px_at_70%_-10%,rgba(0,0,0,0.55),transparent_65%)]
        "
      />
      <div
        aria-hidden
        className="
          pointer-events-none absolute inset-0 -z-10 hidden dark:block
          bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)]
          bg-[size:28px_28px] opacity-60
        "
      />

      {/* Section content */}
      <div className="mx-auto w-full max-w-6xl px-4 py-14 md:py-18">
        <div className="text-center">
          <h2 className="text-2xl md:text-3xl font-semibold text-[var(--color-text)]">
            Simple, fair pricing
          </h2>
          <p className="mt-2 text-[color-mix(in_oklab,var(--color-foreground),transparent_35%)]">
            Pay-as-you-go credits. No subscriptions.
          </p>
        </div>

        {/* Glass wrapper to lift cards from colored bg */}
        <div
          className="
            mt-8 rounded-3xl border
            border-white/60 bg-white/70 backdrop-blur
            shadow-[0_20px_60px_-20px_rgba(15,23,42,0.35)]
            dark:border-white/10 dark:bg-white/8
          "
        >
          <div className="p-4 md:p-6">
            <PricingGrid
              packs={packs}
              isAuthed={isAuthed}
              signedInHref="/billing"
              signedOutHref="/login"
              variant="compact"
              showFooterNote={false}
              showPositioning
              positioningText="No subscription — pay only what you use."
              showRefundBadge
              refundText="Refunds on unused credits (7 days)."
              creditRule={{
                items: [
                  { threshold: "≤ 15k tokens", credits: 1 },
                  { threshold: "≤ 50k tokens", credits: 2 },
                  { threshold: "≤ 100k tokens", credits: 3 },
                ],
              }}
            />
          </div>
        </div>

        {/* CTA under cards */}
        <div className="mt-6 flex justify-center">
          <Link
            href="/pricing"
            className="
              rounded-[var(--radius-lg)] border border-[var(--color-border)] px-4 py-2 text-sm
              text-[var(--color-foreground)]
              hover:-translate-y-0.5 hover:shadow-md transition-all
              hover:bg-[var(--color-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]
            "
          >
            See all pricing details
          </Link>
        </div>
      </div>

      {/* soft glow accents */}
      <div
        aria-hidden
        className="
          pointer-events-none absolute -z-10 blur-3xl opacity-35
          left-[-10%] top-[40%] h-[360px] w-[360px]
          bg-[radial-gradient(180px_180px_at_center,rgba(59,130,246,0.28),transparent)]
        "
      />
      <div
        aria-hidden
        className="
          pointer-events-none absolute -z-10 blur-3xl opacity-35
          right-[-6%] bottom-[10%] h-[300px] w-[300px]
          bg-[radial-gradient(150px_150px_at_center,rgba(99,102,241,0.28),transparent)]
        "
      />
    </section>
  );
}
