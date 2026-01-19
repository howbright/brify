// components/landing/LandingPricingSection.tsx
"use client";

import PricingGrid, { Pack } from "@/components/pricing/PricingGrid";
import { useTranslations, useLocale } from "next-intl";
import { useMemo, useState } from "react";

type Props = {
  isAuthed: boolean;
  packs?: Pack[]; // 안 넘기면 locale + paymentMode 기준 기본 팩 사용
};

type PaymentMode = "krw" | "usd";

const KRW_PACKS: Pack[] = [
  { id: "50_kr", credits: 50, priceUSD: 3500, starter: true },
  { id: "150_kr", credits: 150, priceUSD: 9000, popular: true },
  { id: "300_kr", credits: 300, priceUSD: 15000 },
];

const USD_PACKS: Pack[] = [
  { id: "50_us", credits: 50, priceUSD: 3, starter: true },
  { id: "150_us", credits: 150, priceUSD: 7, popular: true },
  { id: "300_us", credits: 300, priceUSD: 12 },
];

export default function LandingPricingSection({ isAuthed, packs }: Props) {
  const t = useTranslations("LandingPricingSection");
  const locale = useLocale();
  const isKorean = locale === "ko";

  const [paymentMode, setPaymentMode] = useState<PaymentMode>(
    isKorean ? "krw" : "usd"
  );

  const effectivePacks: Pack[] = useMemo(() => {
    // packs를 외부에서 주면 토글 의미가 없으니 그대로 사용
    if (packs) return packs;
    if (!isKorean) return USD_PACKS;
    return paymentMode === "krw" ? KRW_PACKS : USD_PACKS;
  }, [packs, isKorean, paymentMode]);

  const currency = paymentMode === "usd" ? "usd" : "krw";

  const signedInHref = `/billing?currency=${currency}`;
  const signedOutHref = `/login?currency=${currency}`;

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

      <div className="mx-auto w-full max-w-6xl px-4 py-14 md:py-18">
        <div className="text-center">
          <h2 className="text-2xl md:text-3xl font-semibold text-[var(--color-text)]">
            {t("title")}
          </h2>
          <p className="mt-2 text-[color-mix(in_oklab,var(--color-foreground),transparent_35%)]">
            {t("subtitle")}
          </p>
        </div>

        {/* ✅ Wrapper */}
        <div
          className="
            rounded-3xl
            bg-transparent
            backdrop-blur-[2px]
            shadow-none
          "
        >
          <div className="p-2 md:p-3">
            <PricingGrid
              packs={effectivePacks}
              isAuthed={isAuthed}
              signedInHref={signedInHref}
              signedOutHref={signedOutHref}
              variant="compact"
              showFooterNote={false}
              showPositioning
              showRefundBadge
              billingCurrency={paymentMode === "usd" ? "USD" : "KRW"}
              creditRule={{
                items: [
                  { threshold: t("creditRule.items.small.threshold"), credits: 1 },
                  { threshold: t("creditRule.items.medium.threshold"), credits: 2 },
                  { threshold: t("creditRule.items.large.threshold"), credits: 3 },
                ],
              }}
              // ✅ 토글을 PricingGrid가 렌더하도록 넘겨줌
              showCurrencyToggle={isKorean && !packs}
              paymentMode={paymentMode}
              onPaymentModeChange={setPaymentMode}
              currencyLabels={{
                krw: t("paymentToggle.krw"),
                usd: t("paymentToggle.usd"),
              }}
            />
          </div>
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
