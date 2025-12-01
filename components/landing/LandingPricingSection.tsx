// components/landing/LandingPricingSection.tsx
"use client";

import PricingGrid, { Pack } from "@/components/pricing/PricingGrid";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";

type Props = {
  isAuthed: boolean;
  packs?: Pack[]; // 안 넘기면 locale에 맞는 기본 팩 사용
};

export default function LandingPricingSection({ isAuthed, packs }: Props) {
  const t = useTranslations("LandingPricingSection");
  const locale = useLocale();
  const isKorean = locale === "ko";

  // 🎯 USD 기본 팩 (글로벌용)
  const defaultUsdPacks: Pack[] = [
    {
      id: "50",
      credits: 50,
      priceUSD: 3, // $3
      starter: true,
      badgeText: t("packs.50.badgeText"),
      tagline: t("packs.50.tagline"),
    },
    {
      id: "150",
      credits: 150,
      priceUSD: 7, // $7
      popular: true,
      badgeText: t("packs.150.badgeText"),
      tagline: t("packs.150.tagline"),
    },
    {
      id: "300",
      credits: 300,
      priceUSD: 12, // $12
      badgeText: t("packs.300.badgeText"),
      tagline: t("packs.300.tagline"),
    },
  ];

  // 🎯 KRW 기본 팩 (한국용) — priceUSD 자리에 일단 원화 숫자 넣어둠
  // 👉 이후 PricingGrid에서 currency 분리할 때 priceKRW 같은 필드로 빼는 걸 추천.
  const defaultKrwPacks: Pack[] = [
    {
      id: "50",
      credits: 50,
      priceUSD: 4000, // 4,000원
      starter: true,
      badgeText: t("packs.50.badgeText"),
      tagline: t("packs.50.tagline"),
    },
    {
      id: "150",
      credits: 150,
      priceUSD: 9000, // 9,000원
      popular: true,
      badgeText: t("packs.150.badgeText"),
      tagline: t("packs.150.tagline"),
    },
    {
      id: "300",
      credits: 300,
      priceUSD: 15000, // 15,000원
      badgeText: t("packs.300.badgeText"),
      tagline: t("packs.300.tagline"),
    },
  ];

  // props로 packs가 오면 그걸 우선 사용, 없으면 locale별 기본팩 선택
  const effectivePacks: Pack[] =
    packs ?? (isKorean ? defaultKrwPacks : defaultUsdPacks);

  const creditRule = {
    items: [
      { threshold: t("creditRule.items.small.threshold"), credits: 1 },
      { threshold: t("creditRule.items.medium.threshold"), credits: 2 },
      { threshold: t("creditRule.items.large.threshold"), credits: 3 },
    ],
  };

  return (
    <section id="pricing" className="relative overflow-hidden">
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
            {t("title")}
          </h2>
          <p className="mt-2 text-[color-mix(in_oklab,var(--color-foreground),transparent_35%)]">
            {t("subtitle")}
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
              packs={effectivePacks}
              isAuthed={isAuthed}
              signedInHref="/billing"
              signedOutHref="/login"
              variant="compact"
              showFooterNote={false}
              showPositioning
              positioningText={t("positioningText")}
              showRefundBadge
              refundText={t("refundText")}
              creditRule={creditRule}
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
            {t("seeDetails")}
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
