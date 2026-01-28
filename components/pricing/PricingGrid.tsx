// components/pricing/PricingGrid.tsx
"use client";

import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useState } from "react";

export type Pack = {
  id: string;
  credits: number;
  priceUSD: number;
  unitUSD?: number;
  popular?: boolean;
  bonusPercent?: number;
  bonusCredits?: number;
  badgeText?: string;
  tagline?: string;
  starter?: boolean;
};

type CreditRule = {
  label?: string;
  items: { threshold: string; credits: number }[];
};

type PaymentMode = "krw" | "usd";

type Props = {
  packs: Pack[];
  isAuthed: boolean;
  signedInHref?: string;
  signedOutHref?: string;
  signedInLabel?: string;
  signedOutLabel?: string;
  showFooterNote?: boolean;
  variant?: "default" | "compact";
  className?: string;

  showPositioning?: boolean;
  positioningText?: string;
  showRefundBadge?: boolean;
  refundText?: string;

  refundPolicyHref?: string;
  refundTooltipLines?: string[];

  creditRule?: CreditRule;
  detailsLabel?: string;
  showCreditRuleByDefault?: boolean;

  showReassurance?: boolean;
  reassuranceLines?: string[];

  billingCurrency?: "KRW" | "USD";

  // ✅ 추가: 통화 토글(재사용 목적)
  showCurrencyToggle?: boolean;
  paymentMode?: PaymentMode; // controlled
  onPaymentModeChange?: (mode: PaymentMode) => void;
  currencyLabels?: { krw: string; usd: string };
};

function cx(...xs: (string | false | null | undefined)[]) {
  return xs.filter(Boolean).join(" ");
}

export default function PricingGrid({
  packs,
  isAuthed,
  signedInHref = "/billing",
  signedOutHref = "/login",
  signedInLabel,
  signedOutLabel,
  showFooterNote = true,
  variant = "default",
  className = "",
  showPositioning = true,
  positioningText,
  showRefundBadge = true,
  refundText,
  refundPolicyHref = "/refund-policy",
  refundTooltipLines,
  creditRule,
  detailsLabel,
  showCreditRuleByDefault = false,
  showReassurance = true,
  reassuranceLines,
  billingCurrency,

  // ✅ currency toggle
  showCurrencyToggle = false,
  paymentMode = "krw",
  onPaymentModeChange,
  currencyLabels = { krw: "KRW", usd: "USD" },
}: Props) {
  const t = useTranslations("PricingGrid");
  const tLanding = useTranslations("LandingPricingSection");
  const locale = useLocale();

  const isCompact = variant === "compact";
  const [openDetails, setOpenDetails] = useState(showCreditRuleByDefault);

  const fallbackIsKorean = locale === "ko";
  const resolvedCurrency: "KRW" | "USD" =
    billingCurrency ?? (fallbackIsKorean ? "KRW" : "USD");

  const currencyLocale = resolvedCurrency === "KRW" ? "ko-KR" : "en-US";

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat(currencyLocale, {
      style: "currency",
      currency: resolvedCurrency,
      maximumFractionDigits: resolvedCurrency === "KRW" ? 0 : 2,
    }).format(n);

  const labelSignedIn = signedInLabel ?? t("cta.signedIn");
  const labelSignedOut = signedOutLabel ?? t("cta.signedOut");
  const labelPositioning = positioningText ?? t("positioningText");
  const textRefund = refundText ?? t("refund.text");

  const tooltipLines = refundTooltipLines ?? [
    t("refundTooltip.line1"),
    t("refundTooltip.line2"),
    t("refundTooltip.line3"),
  ];

  const labelDetails = detailsLabel ?? t("toggles.details");

  const reassurance = reassuranceLines ?? [t("reassurance.line1")];

  const ctaBtn =
    "block w-full rounded-[var(--radius-lg)] px-4 py-2.5 text-center text-sm font-medium shadow-sm " +
    "bg-[var(--color-primary-500,#2563eb)] text-[var(--color-primary-foreground,#ffffff)] " +
    "hover:bg-[var(--color-primary-hover,#1d4ed8)] hover:text-[var(--color-primary-foreground,#ffffff)] " +
    "dark:bg-[var(--color-primary-500,#3758f9)] dark:hover:bg-[var(--color-primary-hover,#2f49d1)] dark:text-white " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring,#93c5fd)]";

  return (
    <div className={className}>
      {showReassurance && (
        <div className={cx("mb-4", isCompact && "mx-auto max-w-3xl")}>
          <div className="flex flex-col items-center gap-2 text-center">
            <p
              className={cx(
                "inline-flex items-center gap-2",
                isCompact ? "px-3 py-1 rounded-lg" : "px-3 py-1.5 rounded-xl",
                "text-sm sm:text-base font-semibold",
                "text-[var(--color-foreground)]",
                "bg-[linear-gradient(90deg,rgba(59,130,246,0.14),rgba(99,102,241,0.12))] border border-[color:var(--color-border)]",
                "supports-[backdrop-filter]:backdrop-blur-[2px]",
                "dark:bg-[linear-gradient(90deg,rgba(59,130,246,0.20),rgba(99,102,241,0.18))] dark:border-white/10"
              )}
            >
              <strong className="font-extrabold">{reassurance[0]}</strong>
            </p>

            {reassurance[1] && (
              <p
                className={cx(
                  "text-xs sm:text-sm leading-relaxed",
                  "text-[var(--color-muted-foreground)]",
                  "dark:text-neutral-200"
                )}
              >
                {reassurance[1]}
              </p>
            )}
          </div>
        </div>
      )}

      {/* ✅ 여기! (Landing/Billing 공용) KRW/USD 토글을 PricingGrid 내부로 이동 */}
      {showCurrencyToggle && (
        <div className="mb-3 flex justify-center sm:justify-end">
          <div className="inline-flex rounded-full border border-[var(--color-border)] bg-[var(--color-card)] p-1 text-xs shadow-sm">
            <button
              type="button"
              onClick={() => onPaymentModeChange?.("krw")}
              className={[
                "px-3 py-1.5 rounded-full transition-all",
                paymentMode === "krw"
                  ? "bg-[var(--color-primary-500)] text-white shadow"
                  : "text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]",
              ].join(" ")}
            >
              {currencyLabels.krw}
            </button>
            <button
              type="button"
              onClick={() => onPaymentModeChange?.("usd")}
              className={[
                "px-3 py-1.5 rounded-full transition-all",
                paymentMode === "usd"
                  ? "bg-[var(--color-primary-500)] text-white shadow"
                  : "text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]",
              ].join(" ")}
            >
              {currencyLabels.usd}
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3 items-stretch">
        {packs.map((p) => {
          const bonusFromPercent = p.bonusPercent
            ? Math.floor(p.credits * (p.bonusPercent / 100))
            : 0;
          const totalBonus = (p.bonusCredits ?? 0) + bonusFromPercent;
          const totalCredits = p.credits + totalBonus;

          const unit = p.unitUSD ?? p.priceUSD / p.credits;
          const effectiveUnit = p.priceUSD / totalCredits;

          let badge = p.badgeText;

          if (!badge) {
            if (p.credits === 50) badge = tLanding("packs.50.badgeText");
            else if (p.credits === 150) badge = tLanding("packs.150.badgeText");
            else if (p.credits === 300) badge = tLanding("packs.300.badgeText");
            else if (p.popular) badge = t("badge.mostPopular");
            else if (p.starter) badge = t("badge.starter");
            else badge = "";
          }

          let tagline = p.tagline;
          if (!tagline) {
            if (p.credits === 50) tagline = tLanding("packs.50.tagline");
            else if (p.credits === 150) tagline = tLanding("packs.150.tagline");
            else if (p.credits === 300) tagline = tLanding("packs.300.tagline");
          }

          return (
            <div
              key={p.id}
              className={cx(
                "flex h-full flex-col rounded-2xl border shadow-sm",
                "bg-white text-neutral-900",
                "dark:bg-[var(--color-card,#0b1224)] dark:text-[var(--color-card-foreground,#e5e7eb)]",
                isCompact ? "p-4" : "p-5",
                p.popular
                  ? "border-[var(--color-primary-500)]"
                  : "border-[var(--color-border)]"
              )}
            >
              <div className={cx(isCompact ? "mb-1 h-6" : "mb-2 h-6")}>
                {badge ? (
                  <div
                    className={cx(
                      "inline-flex h-6 items-center gap-1 self-start rounded-full border px-2.5 text-xs",
                      p.starter && !p.popular && "opacity-80"
                    )}
                    style={{
                      borderColor:
                        "color-mix(in_srgb,var(--color-primary-500),transparent 70%)",
                      background:
                        "color-mix(in_srgb,var(--color-primary-500),white 85%)",
                      color: "var(--color-primary-700)",
                    }}
                  >
                    {badge}
                  </div>
                ) : (
                  <div className="h-6 invisible" aria-hidden />
                )}
              </div>

              {tagline && (
                <div className="mb-1 text-xs text-neutral-600 dark:text-[var(--color-muted-foreground,#cbd5e1)]">
                  {tagline}
                </div>
              )}

              <div
                className={cx(
                  isCompact ? "text-xl" : "text-2xl",
                  "font-bold text-neutral-900 dark:text-[var(--color-foreground,#e5e7eb)]"
                )}
              >
                {p.credits.toLocaleString()}{" "}
                <span className="text-base font-medium text-neutral-500 dark:text-[var(--color-muted-foreground,#cbd5e1)]">
                  {t("units.credits")}
                </span>
                {(p.bonusPercent || p.bonusCredits) && (
                  <span className="ml-2 align-middle text-xs font-semibold text-[var(--color-primary-700)]">
                    +{totalBonus.toLocaleString()} {t("bonus.tag")}
                  </span>
                )}
              </div>

              <div className="mt-1 text-neutral-800 dark:text-[var(--color-card-foreground,#e5e7eb)]">
                {formatCurrency(p.priceUSD)}
              </div>

              <div className="mt-1 text-xs text-neutral-600 dark:text-[var(--color-muted-foreground,#cbd5e1)]">
                ≈ {formatCurrency(unit)} {t("units.perCredit")}
                {(p.bonusPercent || p.bonusCredits) && (
                  <span className="ml-1">
                    <span className="opacity-70">·</span>{" "}
                    <span className="opacity-90">
                      {t("unit.effective")} {formatCurrency(effectiveUnit)}{" "}
                      {t("units.perCredit")}
                    </span>
                  </span>
                )}
              </div>

              <div className="mt-5 flex-1" />

              {isAuthed ? (
                <Link href={signedInHref} className={ctaBtn}>
                  {labelSignedIn}
                </Link>
              ) : (
                <Link href={signedOutHref} className={ctaBtn}>
                  {labelSignedOut}
                </Link>
              )}

              {showFooterNote && (
                <div
                  className={cx(
                    isCompact ? "mt-2" : "mt-3",
                    "text-xs text-neutral-500 dark:text-[var(--color-muted-foreground,#cbd5e1)]"
                  )}
                >
                  {t("footer.note")}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="text-sm font-medium text-[var(--color-text)]">
            {tLanding("creditRule.title")}
          </div>

          <button
            type="button"
            onClick={() => setOpenDetails((v) => !v)}
            className="text-xs px-2 py-1 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-muted)] text-[var(--color-foreground)]"
          >
            {openDetails
              ? tLanding("toggles.collapse")
              : tLanding("toggles.details")}
          </button>
        </div>

        <p className="mt-2 text-xs text-[color-mix(in_oklab,var(--color-foreground),transparent_25%)] leading-relaxed">
          {tLanding("creditRule.desc")}
        </p>

        {openDetails && (
          <ul className="mt-3 grid gap-1.5 text-xs text-[color-mix(in_oklab,var(--color-foreground),transparent_20%)] sm:grid-cols-3">
            <li className="flex items-center gap-2">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-primary-500)]" />
              <span>
                <span className="text-[var(--color-foreground)]">
                  {tLanding("creditRule.details.small")}
                </span>{" "}
                →{" "}
                <b className="text-[var(--color-foreground)]">
                  {tLanding("creditRule.result.one")}
                </b>
              </span>
            </li>

            <li className="flex items-center gap-2">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-primary-500)]" />
              <span>
                <span className="text-[var(--color-foreground)]">
                  {tLanding("creditRule.details.medium")}
                </span>{" "}
                →{" "}
                <b className="text-[var(--color-foreground)]">
                  {tLanding("creditRule.result.two")}
                </b>
              </span>
            </li>

            <li className="flex items-center gap-2">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-primary-500)]" />
              <span>
                <span className="text-[var(--color-foreground)]">
                  {tLanding("creditRule.details.large")}
                </span>{" "}
                →{" "}
                <b className="text-[var(--color-foreground)]">
                  {tLanding("creditRule.result.blocked")}
                </b>
              </span>
            </li>
          </ul>
        )}
      </div>
    </div>
  );
}
