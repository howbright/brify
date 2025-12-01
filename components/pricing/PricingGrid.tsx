// components/pricing/PricingGrid.tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import * as Tooltip from "@radix-ui/react-tooltip";
import { useTranslations, useLocale } from "next-intl";

export type Pack = {
  id: string;
  credits: number; // 기본 지급 크레딧
  priceUSD: number; // ⚠️ 이제 "통화 상관 없는 price"로 사용 (locale로 포맷 분기)
  unitUSD?: number; // 주어지면 사용, 없으면 price/credits
  popular?: boolean;

  // 가격경쟁력 옵션
  bonusPercent?: number; // 예: 10 → 10% 보너스
  bonusCredits?: number; // 정량 보너스
  badgeText?: string; // 배지 커스텀 텍스트
  tagline?: string; // 카드 보조 카피
  starter?: boolean; // 스타터 티어 표시
};

type CreditRule = {
  label?: string;
  items: { threshold: string; credits: number }[];
};

type Props = {
  packs: Pack[];
  isAuthed: boolean;
  signedInHref?: string; // 기본: /billing
  signedOutHref?: string; // 기본: /login
  signedInLabel?: string; // 기본: i18n("PricingGrid.cta.signedIn")
  signedOutLabel?: string; // 기본: i18n("PricingGrid.cta.signedOut")
  showFooterNote?: boolean;
  variant?: "default" | "compact";
  className?: string;

  // 포지셔닝/환불 배지
  showPositioning?: boolean;
  positioningText?: string; // 기본: i18n("PricingGrid.positioningText")
  showRefundBadge?: boolean;
  refundText?: string; // 기본: i18n("PricingGrid.refund.text")

  // ✅ 환불 정책 링크 + 툴팁 라인
  refundPolicyHref?: string; // 기본: "/refund-policy"
  refundTooltipLines?: string[]; // 기본: i18n("PricingGrid.refundTooltip.*")

  // 장문 멀티크레딧 규칙(토글로 펼침)
  creditRule?: CreditRule;
  detailsLabel?: string; // 기본: i18n("PricingGrid.toggles.details")
  showCreditRuleByDefault?: boolean; // 기본: false

  // 안심 카피(“대부분 1 크레딧이면 충분”)
  showReassurance?: boolean; // 기본: true
  reassuranceLines?: string[]; // 기본: i18n("PricingGrid.reassurance.*")
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
}: Props) {
  const t = useTranslations("PricingGrid");
  const locale = useLocale();
  const isKorean = locale === "ko";

  const isCompact = variant === "compact";
  const [openDetails, setOpenDetails] = useState(showCreditRuleByDefault);

  // 통화/포맷터 설정
  const currency = isKorean ? "KRW" : "USD";
  const currencyLocale = isKorean ? "ko-KR" : "en-US";

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat(currencyLocale, {
      style: "currency",
      currency,
      maximumFractionDigits: isKorean ? 0 : 2,
    }).format(n);

  // i18n fallback들
  const labelSignedIn = signedInLabel ?? t("cta.signedIn");
  const labelSignedOut = signedOutLabel ?? t("cta.signedOut");
  const labelPositioning = positioningText ?? t("positioningText");
  const textRefund = refundText ?? t("refund.text");

  const tooltipLines =
    refundTooltipLines ??
    [
      t("refundTooltip.line1"),
      t("refundTooltip.line2"),
      t("refundTooltip.line3"),
    ];

  const labelDetails = detailsLabel ?? t("toggles.details");

  const reassurance =
    reassuranceLines ?? [t("reassurance.line1"), t("reassurance.line2")];

  const ctaBtn =
    "block w-full rounded-[var(--radius-lg)] px-4 py-2.5 text-center text-sm font-medium shadow-sm " +
    "bg-[var(--color-primary-500,#2563eb)] text-[var(--color-primary-foreground,#ffffff)] " +
    "hover:bg-[var(--color-primary-hover,#1d4ed8)] hover:text-[var(--color-primary-foreground,#ffffff)] " +
    "dark:bg-[var(--color-primary-500,#3758f9)] dark:hover:bg-[var(--color-primary-hover,#2f49d1)] dark:text-white " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring,#93c5fd)]";

  return (
    <div className={className}>
      {/* 상단 포지셔닝/환불 배지 */}
      {(showPositioning || showRefundBadge) && (
        <div
          className={cx(
            "mb-4 flex flex-wrap items-center gap-2",
            isCompact && "justify-center text-center"
          )}
        >
          {showPositioning && (
            <span className="inline-flex items-center rounded-full border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-1 text-xs text-[var(--color-muted-foreground)]">
              {labelPositioning}
            </span>
          )}

          {showRefundBadge && (
            <Tooltip.Provider delayDuration={80}>
              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-1 text-xs text-[var(--color-muted-foreground)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
                    aria-label={t("refundTooltip.ariaLabel")}
                  >
                    {textRefund}
                    <span
                      className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-muted-foreground)]"
                      aria-hidden
                    >
                      i
                    </span>
                  </button>
                </Tooltip.Trigger>

                <Tooltip.Content
                  side="bottom"
                  align="center"
                  className="
                    z-50 max-w-[300px] rounded-md
                    border border-[var(--color-border,#e5e7eb)] dark:border-[var(--color-border,#1f2937)]
                    bg-[var(--color-card,#ffffff)] dark:bg-[var(--color-card,#0b1224)]
                    text-[var(--color-muted-foreground,#334155)] dark:text-[var(--color-muted-foreground,#cbd5e1)]
                    px-3 py-2 text-xs shadow-md
                    supports-[backdrop-filter]:backdrop-blur-[2px]
                  "
                >
                  <div className="font-medium text-[var(--color-foreground)] mb-1">
                    {t("refundTooltip.title")}
                  </div>
                  <ul className="list-disc pl-4 space-y-1">
                    {tooltipLines.map((line, i) => (
                      <li key={i}>{line}</li>
                    ))}
                  </ul>
                  <Link
                    href={refundPolicyHref}
                    className="mt-2 inline-block underline text-[var(--color-primary-600)] hover:text-[var(--color-primary-700)]"
                  >
                    {t("refundTooltip.linkLabel")}
                  </Link>
                  <Tooltip.Arrow className="fill-[var(--color-card)]" />
                </Tooltip.Content>
              </Tooltip.Root>
            </Tooltip.Provider>
          )}
        </div>
      )}

      {/* 안심 카피 배너 */}
      {showReassurance && (
        <div className={cx("mb-4", isCompact && "mx-auto max-w-3xl")}>
          <div className="flex flex-col items-center gap-2 text-center">
            {/* 강조 1줄 */}
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

            {/* 서브 1줄 */}
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

      <div className="grid gap-4 sm:grid-cols-3 items-stretch">
        {packs.map((p) => {
          const bonusFromPercent = p.bonusPercent
            ? Math.floor(p.credits * (p.bonusPercent / 100))
            : 0;
          const totalBonus = (p.bonusCredits ?? 0) + bonusFromPercent;
          const totalCredits = p.credits + totalBonus;

          const unit = p.unitUSD ?? p.priceUSD / p.credits; // 표기 단가(숫자)
          const effectiveUnit = p.priceUSD / totalCredits; // 보너스 반영 실효 단가

          const badge =
            p.badgeText ??
            (p.popular
              ? t("badge.mostPopular")
              : p.starter
              ? t("badge.starter")
              : "");

          return (
            <div
              key={p.id}
              className={cx(
                "flex h-full flex-col rounded-2xl border bg-[var(--color-card)] text-[var(--color-card-foreground)] shadow-sm",
                isCompact ? "p-4" : "p-5",
                p.popular
                  ? "border-[var(--color-primary-500)]"
                  : "border-[var(--color-border)]"
              )}
            >
              {/* 배지 슬롯 */}
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

              {/* 태그라인(선택) */}
              {p.tagline && (
                <div className="mb-1 text-xs text-[var(--color-muted-foreground)]">
                  {p.tagline}
                </div>
              )}

              {/* 가격 영역 */}
              <div
                className={cx(
                  isCompact ? "text-xl" : "text-2xl",
                  "font-bold text-[var(--color-text)]"
                )}
              >
                {p.credits.toLocaleString()}{" "}
                <span className="text-base font-medium text-[color-mix(in_oklab,var(--color-foreground),transparent_40%)]">
                  {t("units.credits")}
                </span>
                {(p.bonusPercent || p.bonusCredits) && (
                  <span className="ml-2 align-middle text-xs font-semibold text-[var(--color-primary-700)]">
                    +{totalBonus.toLocaleString()} {t("bonus.tag")}
                  </span>
                )}
              </div>

              {/* 총액 */}
              <div className="mt-1 text-[color-mix(in_oklab,var(--color-foreground),transparent_20%)]">
                {formatCurrency(p.priceUSD)}
              </div>

              {/* 단가 표기(기본 + 실효) */}
              <div className="mt-1 text-xs text-[var(--color-muted-foreground)]">
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

              {/* 스페이서 */}
              <div className="mt-5 flex-1" />

              {/* CTA */}
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
                    "text-xs text-[var(--color-muted-foreground)]"
                  )}
                >
                  {t("footer.note")}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 장문 멀티크레딧 규칙(토글) */}
      {creditRule?.items?.length ? (
        <div className="mt-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-[var(--color-text)]">
              {creditRule.label ?? t("creditRule.label")}
            </div>
            <button
              type="button"
              onClick={() => setOpenDetails((v) => !v)}
              className="text-xs px-2 py-1 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-muted)] text-[var(--color-foreground)]"
            >
              {openDetails ? t("toggles.hide") : labelDetails}
            </button>
          </div>

          {openDetails && (
            <ul className="mt-2 grid gap-1 text-xs text-[color-mix(in_oklab,var(--color-foreground),transparent_20%)] sm:grid-cols-3">
              {creditRule.items.map((it, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-primary-500)]" />
                  <span>
                    <span className="text-[var(--color-foreground)]">
                      {it.threshold}
                    </span>{" "}
                    {t("creditRule.itemSuffix", { credits: it.credits })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
