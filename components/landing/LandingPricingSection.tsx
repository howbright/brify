// components/landing/LandingPricingSection.tsx
"use client";

import PricingGrid, { Pack } from "@/components/pricing/PricingGrid";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { useState } from "react";

type Props = {
  isAuthed: boolean;
  packs?: Pack[]; // 안 넘기면 locale + paymentMode 기준 기본 팩 사용
};

type PaymentMode = "krw" | "usd";

const KRW_PACKS: Pack[] = [
  {
    id: "50_kr",
    credits: 50,
    priceUSD: 3500, // 4,000원
    starter: true,
  },
  {
    id: "150_kr",
    credits: 150,
    priceUSD: 9000, // 9,000원
    popular: true,
  },
  {
    id: "300_kr",
    credits: 300,
    priceUSD: 15000, // 15,000원
  },
];

const USD_PACKS: Pack[] = [
  {
    id: "50_us",
    credits: 50,
    priceUSD: 3, // $3
    starter: true,
  },
  {
    id: "150_us",
    credits: 150,
    priceUSD: 7, // $7
    popular: true,
  },
  {
    id: "300_us",
    credits: 300,
    priceUSD: 12, // $12
  },
];

export default function LandingPricingSection({ isAuthed, packs }: Props) {
  const t = useTranslations("LandingPricingSection");
  const locale = useLocale();
  const isKorean = locale === "ko";

  // 한국어면 기본 KRW, 나머지는 USD
  const [paymentMode, setPaymentMode] = useState<PaymentMode>(
    isKorean ? "krw" : "usd"
  );

  // packs prop이 넘어오면 그대로 사용, 아니면 locale + paymentMode 기반 기본팩
  const effectivePacks: Pack[] =
    packs ??
    (isKorean ? (paymentMode === "krw" ? KRW_PACKS : USD_PACKS) : USD_PACKS);

  // 결제 페이지로 넘겨줄 링크 (쿼리로 currency 넘겨두면 나중에 billing에서 분기하기 편함)
  const signedInHref =
    paymentMode === "krw" && isKorean
      ? "/billing?currency=krw"
      : "/billing?currency=usd";

  const signedOutHref =
    paymentMode === "krw" && isKorean
      ? "/login?currency=krw"
      : "/login?currency=usd";

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

        {/* 🔁 한국어일 때만 KRW / USD 토글 */}
        {isKorean && !packs && (
          <div className="mt-5 flex justify-center">
            <div className="inline-flex rounded-full border border-[var(--color-border)] bg-[var(--color-card)] p-1 text-xs shadow-sm">
              <button
                type="button"
                onClick={() => setPaymentMode("krw")}
                className={[
                  "px-3 py-1.5 rounded-full transition-all",
                  paymentMode === "krw"
                    ? "bg-[var(--color-primary-500)] text-white shadow"
                    : "text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]",
                ].join(" ")}
              >
                {t("paymentToggle.krw")}
              </button>
              <button
                type="button"
                onClick={() => setPaymentMode("usd")}
                className={[
                  "px-3 py-1.5 rounded-full transition-all",
                  paymentMode === "usd"
                    ? "bg-[var(--color-primary-500)] text-white shadow"
                    : "text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]",
                ].join(" ")}
              >
                {t("paymentToggle.usd")}
              </button>
            </div>
          </div>
        )}

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
              signedInHref={signedInHref}
              signedOutHref={signedOutHref}
              variant="compact"
              showFooterNote={false}
              showPositioning
              positioningText={t("positioningText")}
              showRefundBadge
              refundText={t("refundText")}
              billingCurrency={paymentMode === "usd" ? "USD" : "KRW"}
              creditRule={{
                items: [
                  {
                    threshold: t("creditRule.items.small.threshold"),
                    credits: 1,
                  },
                  {
                    threshold: t("creditRule.items.medium.threshold"),
                    credits: 2,
                  },
                  {
                    threshold: t("creditRule.items.large.threshold"),
                    credits: 3,
                  },
                ],
              }}
            />
          </div>
        </div>

        {/* CTA under cards */}
        {/* <div className="mt-6 flex justify-center">
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
        </div> */}
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
