// components/pricing/PricingGrid.tsx
"use client";

import Link from "next/link";
import { useState } from "react";

export type Pack = {
  id: string;
  credits: number; // 기본 지급 크레딧
  priceUSD: number;
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
  signedInLabel?: string; // 기본: "Buy now"
  signedOutLabel?: string; // 기본: "Sign in to buy"
  showFooterNote?: boolean;
  variant?: "default" | "compact";
  className?: string;

  // 포지셔닝/환불 배지
  showPositioning?: boolean;
  positioningText?: string; // 기본: "No subscription — pay only what you use."
  showRefundBadge?: boolean;
  refundText?: string; // 기본: "Unused credits refundable within 7 days."

  // 장문 멀티크레딧 규칙(토글로 펼침)
  creditRule?: CreditRule;
  detailsLabel?: string; // 기본: "Details"
  showCreditRuleByDefault?: boolean; // 기본: false

  // 안심 카피(“대부분 1 크레딧이면 충분”)
  showReassurance?: boolean; // 기본: true
  reassuranceLines?: string[]; // 기본 문구 제공(아래 디폴트 참고)
};

function usd(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(n);
}
function cx(...xs: (string | false | null | undefined)[]) {
  return xs.filter(Boolean).join(" ");
}

export default function PricingGrid({
  packs,
  isAuthed,
  signedInHref = "/billing",
  signedOutHref = "/login",
  signedInLabel = "Buy now",
  signedOutLabel = "Sign in to buy",
  showFooterNote = true,
  variant = "default",
  className = "",
  showPositioning = true,
  positioningText = "No subscription — pay only what you use.",
  showRefundBadge = true,
  refundText = "Unused credits refundable within 7 days.",
  creditRule,
  detailsLabel = "Details",
  showCreditRuleByDefault = false,
  showReassurance = true,
  reassuranceLines = [
    "대부분의 스크립트는 1 크레딧이면 충분해요.",
    "아주 긴 스크립트만 2–3 크레딧이 필요할 수 있어요.",
  ],
}: Props) {
  const isCompact = variant === "compact";
  const [openDetails, setOpenDetails] = useState(showCreditRuleByDefault);

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
              {positioningText}
            </span>
          )}
          {showRefundBadge && (
            <span className="inline-flex items-center rounded-full border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-1 text-xs text-[var(--color-muted-foreground)]">
              {refundText}
            </span>
          )}
        </div>
      )}

      {/* 안심 카피 배너 (토큰 수치 없이 안내) */}
      {showReassurance && (
        <div className={cx("mb-4", isCompact && "mx-auto max-w-3xl")}>
          <div className="flex flex-col items-center gap-1.5 text-center">
            {reassuranceLines.map((line, idx) => (
              <span
                key={idx}
                className="
            px-3 py-1 rounded-full text-xs sm:text-sm
            text-[var(--color-foreground)]/90
            bg-[color-mix(in_oklab,var(--color-foreground),transparent_94%)]
            dark:bg-[color-mix(in_oklab,white,transparent_88%)]
            backdrop-blur-[2px]
          "
              >
                {line}
              </span>
            ))}
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

          const unit = p.unitUSD ?? p.priceUSD / p.credits; // 표기 단가
          const effectiveUnit = p.priceUSD / totalCredits; // 보너스 반영 실효 단가

          const badge =
            p.badgeText ??
            (p.popular ? "Most popular" : p.starter ? "Starter" : "");

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
                <span className="text-base font-medium text-[color-mix(in_oklab,var(--color-foreground),transparent 40%)]">
                  credits
                </span>
                {(p.bonusPercent || p.bonusCredits) && (
                  <span className="ml-2 align-middle text-xs font-semibold text-[var(--color-primary-700)]">
                    +{totalBonus.toLocaleString()} bonus
                  </span>
                )}
              </div>
              <div className="mt-1 text-[color-mix(in_oklab,var(--color-foreground),transparent 20%)]">
                {usd(p.priceUSD)}
              </div>

              {/* 단가 표기(기본 + 실효) */}
              <div className="mt-1 text-xs text-[var(--color-muted-foreground)]">
                ≈ {usd(unit)} / credit
                {(p.bonusPercent || p.bonusCredits) && (
                  <span className="ml-1">
                    <span className="opacity-70">·</span>{" "}
                    <span className="opacity-90">effective</span>{" "}
                    {usd(effectiveUnit)} / credit
                  </span>
                )}
              </div>

              {/* 스페이서 */}
              <div className="mt-5 flex-1" />

              {/* CTA */}
              {isAuthed ? (
                <Link
                  href={signedInHref}
                  className="block w-full rounded-[var(--radius-lg)]
                             bg-[var(--color-primary-500)] hover:bg-[var(--color-primary-hover)]
                             text-[var(--color-primary-foreground)] px-4 py-2.5 text-center text-sm font-medium shadow-sm
                             focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
                >
                  {signedInLabel}
                </Link>
              ) : (
                <Link
                  href={signedOutHref}
                  className="block w-full rounded-[var(--radius-lg)]
                             bg-[var(--color-primary-500)] hover:bg-[var(--color-primary-hover)]
                             text-[var(--color-primary-foreground)] px-4 py-2.5 text-center text-sm font-medium shadow-sm
                             focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
                >
                  {signedOutLabel}
                </Link>
              )}

              {showFooterNote && (
                <div
                  className={cx(
                    isCompact ? "mt-2" : "mt-3",
                    "text-xs text-[var(--color-muted-foreground)]"
                  )}
                >
                  Payments in USD via LemonSqueezy.
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
              {creditRule.label ?? "Long inputs may use extra credits"}
            </div>
            <button
              type="button"
              onClick={() => setOpenDetails((v) => !v)}
              className="text-xs px-2 py-1 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-muted)] text-[var(--color-foreground)]"
            >
              {openDetails ? "Hide" : detailsLabel}
            </button>
          </div>

          {openDetails && (
            <ul className="mt-2 grid gap-1 text-xs text-[color-mix(in_oklab,var(--color-foreground),transparent 20%)] sm:grid-cols-3">
              {creditRule.items.map((it, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-primary-500)]" />
                  <span>
                    <span className="text-[var(--color-foreground)]">
                      {it.threshold}
                    </span>{" "}
                    → {it.credits} credit
                    {it.credits > 1 ? "s" : ""}
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
