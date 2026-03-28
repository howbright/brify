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

  positioningText?: string;
  refundText?: string;

  refundPolicyHref?: string;
  refundTooltipLines?: string[];

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
  positioningText,
  refundText,
  refundPolicyHref: _refundPolicyHref = "/refund-policy",
  refundTooltipLines,
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
  const _labelPositioning = positioningText ?? t("positioningText");
  const _textRefund = refundText ?? t("refund.text");

  const _tooltipLines = refundTooltipLines ?? [
    t("refundTooltip.line1"),
    t("refundTooltip.line2"),
    t("refundTooltip.line3"),
  ];

  const _labelDetails = detailsLabel ?? t("toggles.details");

  const reassurance = reassuranceLines ?? [t("reassurance.line1")];

  const ctaBtn =
    "block w-full rounded-[var(--radius-lg)] px-4 py-3 text-center text-sm font-semibold shadow-sm " +
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
                "supports-[backdrop-filter]:",
                "dark:bg-[linear-gradient(90deg,rgba(59,130,246,0.20),rgba(99,102,241,0.18))] dark:border-white/20"
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
                  : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/[0.12]",
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
                  : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/[0.12]",
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

          return (
            <div key={p.id} className="group relative">
              <div
                className={cx(
                  "relative p-[3px] transition-all duration-300 ease-out will-change-transform",
                  "hover:-translate-y-1 hover:shadow-[0_24px_44px_-24px_rgba(15,23,42,0.34)] hover:rotate-[-0.4deg] dark:hover:shadow-[0_28px_52px_-28px_rgba(37,99,235,0.42)]",
                  isCompact
                    ? "rounded-[28px] bg-[linear-gradient(145deg,#2563eb_0%,#38bdf8_55%,#7dd3fc_100%)] shadow-[0_28px_52px_-34px_rgba(37,99,235,0.34)] dark:bg-[linear-gradient(145deg,#60a5fa_0%,#38bdf8_50%,#67e8f9_100%)]"
                    : p.popular
                      ? "rounded-2xl bg-[linear-gradient(145deg,#2563eb_0%,#60a5fa_100%)] shadow-[0_26px_60px_-34px_rgba(37,99,235,0.34)]"
                      : "rounded-2xl bg-[linear-gradient(145deg,#cbd5e1_0%,#e2e8f0_100%)] shadow-[0_24px_50px_-34px_rgba(15,23,42,0.24)]"
                )}
              >
                <div
                  className={cx(
                    "relative flex h-full flex-col text-neutral-900",
                    isCompact
                      ? "rounded-[25px] bg-[linear-gradient(180deg,#f9fcff_0%,#eef6ff_100%)] p-4 sm:p-5 dark:bg-[linear-gradient(180deg,#0c1729_0%,#0b1322_100%)] dark:text-slate-100"
                      : "rounded-[13px] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-5",
                    isCompact && "items-center text-center sm:items-stretch sm:text-left",
                    !isCompact && p.popular && "dark:bg-[linear-gradient(180deg,rgba(37,99,235,0.16),rgba(15,23,42,0.94))] dark:text-[var(--color-card-foreground,#e5e7eb)]",
                    !isCompact && !p.popular && "dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.10),rgba(15,23,42,0.94))] dark:text-[var(--color-card-foreground,#e5e7eb)]"
                  )}
                >
              <div
                aria-hidden
                className={cx(
                  "pointer-events-none absolute inset-x-6 top-0 h-px opacity-0 transition-opacity duration-300 group-hover:opacity-100",
                  isCompact || p.popular
                    ? "bg-gradient-to-r from-transparent via-blue-400 to-transparent"
                    : "bg-gradient-to-r from-transparent via-slate-300 to-transparent dark:via-slate-500"
                )}
              />
              <div
                aria-hidden
                className={cx(
                  "pointer-events-none absolute inset-x-4 top-0 h-20 rounded-t-[18px] opacity-90",
                  isCompact || p.popular
                    ? "bg-[radial-gradient(60%_100%_at_50%_0%,rgba(59,130,246,0.16),transparent_74%)] dark:bg-[radial-gradient(60%_100%_at_50%_0%,rgba(96,165,250,0.18),transparent_76%)]"
                    : "bg-[radial-gradient(60%_100%_at_50%_0%,rgba(148,163,184,0.10),transparent_74%)] dark:bg-[radial-gradient(60%_100%_at_50%_0%,rgba(255,255,255,0.08),transparent_76%)]"
                )}
              />
              <div
                className={cx(
                  isCompact ? "mb-2 flex min-h-6 w-full justify-center sm:mb-1 sm:h-6 sm:justify-start" : "mb-2 h-6"
                )}
              >
                {badge && !isCompact ? (
                  <div
                    className={cx(
                      "inline-flex items-center gap-1 rounded-full border px-3.5 py-1.5 text-[12px] font-extrabold tracking-[-0.01em] transition-all duration-300 group-hover:-translate-y-0.5 group-hover:scale-[1.04] sm:px-3 sm:py-1 sm:text-xs",
                      isCompact ? "self-center sm:self-start" : "self-start",
                      p.starter && !p.popular && "shadow-[0_14px_28px_-18px_rgba(59,130,246,0.35)]",
                      p.popular &&
                        "border-blue-500 bg-blue-600 text-white shadow-[0_16px_30px_-16px_rgba(37,99,235,0.72)] dark:border-blue-300 dark:bg-blue-500"
                    )}
                    style={
                      p.popular
                        ? undefined
                        : {
                            borderColor:
                              "color-mix(in_srgb,var(--color-primary-500),transparent 40%)",
                            background:
                              "linear-gradient(135deg,color-mix(in_srgb,var(--color-primary-500),white 78%),color-mix(in_srgb,var(--color-primary-500),white 90%))",
                            color: "var(--color-primary-800,#1d4ed8)",
                          }
                    }
                  >
                    {badge}
                  </div>
                ) : (
                  <div className="h-6 invisible" aria-hidden />
                )}
              </div>

              {isCompact ? (
                <div className="mb-3 w-full border-[3px] border-transparent bg-[linear-gradient(180deg,#dff2ff_0%,#bfe4ff_100%),linear-gradient(135deg,#1d4ed8_0%,#0ea5e9_52%,#67e8f9_100%)] bg-origin-border bg-clip-padding-border px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_16px_30px_-24px_rgba(37,99,235,0.7)] dark:bg-[linear-gradient(180deg,#16365a_0%,#0f2746_100%),linear-gradient(135deg,#60a5fa_0%,#38bdf8_55%,#67e8f9_100%)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_16px_32px_-22px_rgba(56,189,248,0.42)]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-900/80 dark:text-sky-200/90">
                        Credit Pack
                      </div>
                      <div className="mt-1 text-[30px] font-extrabold leading-none tracking-[-0.04em] text-slate-950 dark:text-white">
                        {p.credits.toLocaleString()}
                        <span className="ml-1.5 text-[13px] font-bold tracking-[0.03em] text-blue-900/80 dark:text-sky-200">
                          {t("units.credits")}
                        </span>
                      </div>
                      {(p.bonusPercent || p.bonusCredits) && (
                        <div className="mt-1 text-[11px] font-semibold text-blue-900/80 dark:text-sky-200">
                          +{totalBonus.toLocaleString()} {t("bonus.tag")}
                        </div>
                      )}
                    </div>
                    {badge ? (
                      <div className="border border-white/65 bg-white/80 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-blue-800 shadow-[0_8px_18px_-14px_rgba(15,23,42,0.45)] dark:border-sky-200/20 dark:bg-white/10 dark:text-sky-100 dark:shadow-none">
                        {badge}
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : (
                <div
                  className={cx(
                    "relative font-bold text-neutral-900 dark:text-[var(--color-foreground,#e5e7eb)]",
                    "text-2xl"
                  )}
                >
                  {p.credits.toLocaleString()}{" "}
                  <span className="text-[17px] font-semibold text-neutral-600 dark:text-[var(--color-muted-foreground,#cbd5e1)] sm:text-xl">
                    {t("units.credits")}
                  </span>
                  {(p.bonusPercent || p.bonusCredits) && (
                    <span className="mt-1 block text-[12px] font-semibold text-[var(--color-primary-700)] sm:ml-2 sm:mt-0 sm:inline-block sm:align-middle">
                      +{totalBonus.toLocaleString()} {t("bonus.tag")}
                    </span>
                  )}
                </div>
              )}

              <div className={cx("font-bold leading-tight text-neutral-900 dark:text-[var(--color-card-foreground,#e5e7eb)] sm:text-2xl md:text-[28px]", isCompact ? "mt-1 text-[29px]" : "mt-2 text-[27px]")}>
                {formatCurrency(p.priceUSD)}
              </div>

              <div
                className={cx(
                  "mt-3 flex flex-col items-stretch gap-2 sm:flex-row sm:flex-wrap sm:items-center",
                  isCompact && "justify-center sm:justify-start"
                )}
              >
                <div className="inline-flex items-center justify-center rounded-2xl border border-blue-200 bg-blue-50 px-3 py-2 text-[13px] font-semibold text-blue-700 transition-transform duration-300 group-hover:-translate-y-0.5 dark:border-blue-400/20 dark:bg-blue-500/10 dark:text-blue-200 sm:rounded-full sm:py-1.5 sm:text-sm">
                  ≈ {formatCurrency(unit)} {t("units.perCredit")}
                </div>
                {(p.bonusPercent || p.bonusCredits) && (
                  <div className="inline-flex items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[13px] font-semibold text-emerald-700 transition-transform duration-300 group-hover:translate-x-0.5 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-200 sm:rounded-full sm:py-1.5 sm:text-sm">
                    {t("unit.effective")} {formatCurrency(effectiveUnit)}{" "}
                    {t("units.perCredit")}
                  </div>
                )}
              </div>

              <div className="mt-4 flex-1" />

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
                    "text-xs text-neutral-500 dark:text-[var(--color-muted-foreground,#cbd5e1)]",
                    isCompact && "text-center sm:text-left"
                  )}
                >
                  {t("footer.note")}
                </div>
              )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {isCompact ? (
        <div className="mt-5 rounded-2xl border border-slate-400 bg-white p-4 shadow-sm dark:border-white/20 dark:bg-[#0f172a]">
          <div className="text-center text-sm font-semibold text-slate-900 dark:text-white">
            {tLanding("creditRule.title")}
          </div>
          <div className="mt-3 grid gap-2 text-center sm:grid-cols-3 sm:text-left">
            <div className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-800 dark:bg-white/8 dark:text-slate-100">
              {tLanding("creditRule.details.small")} · {tLanding("creditRule.result.one")}
            </div>
            <div className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-800 dark:bg-white/8 dark:text-slate-100">
              {tLanding("creditRule.details.medium")} · {tLanding("creditRule.result.two")}
            </div>
            <div className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-800 dark:bg-white/8 dark:text-slate-100">
              {tLanding("creditRule.details.large")} · {tLanding("creditRule.result.blocked")}
            </div>
          </div>
        </div>
      ) : (
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
      )}
    </div>
  );
}
