// components/pricing/PricingGrid.tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import * as Tooltip from "@radix-ui/react-tooltip";

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
  refundText?: string; // 기본: "7일 이내 전액 환불 · 이후 WAPR 비례 환불"

  // ✅ 환불 정책 링크 + 툴팁 라인
  refundPolicyHref?: string; // 기본: "/refund-policy"
  refundTooltipLines?: string[]; // 기본 아래 참고

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
  refundText = "7일 이내 전액 환불 · 이후 WAPR 비례 환불",
  refundPolicyHref = "/refund-policy",
  refundTooltipLines = [
    "7일 이내: 전액 환불",
    "7일 이후: 미사용 ‘유상’ × min(WAPR, $0.10)",
    "보너스 제외, LOT별 과환불 방지 cap 적용",
  ],
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

  const ctaBtn =
    "block w-full rounded-[var(--radius-lg)] px-4 py-2.5 text-center text-sm font-medium shadow-sm " +
    // 기본 배경/텍스트 + 폴백 (화이트로 붕 뜨는 거 방지)
    "bg-[var(--color-primary-500,#2563eb)] text-[var(--color-primary-foreground,#ffffff)] " +
    // hover 시 배경을 더 진하게, 글자색은 항상 대비 확실히 유지
    "hover:bg-[var(--color-primary-hover,#1d4ed8)] hover:text-[var(--color-primary-foreground,#ffffff)] " +
    // 다크에서도 대비 유지(원하는 톤에 맞게 조정 가능)
    "dark:bg-[var(--color-primary-500,#3758f9)] dark:hover:bg-[var(--color-primary-hover,#2f49d1)] dark:text-white " +
    // 포커스 링
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
              {positioningText}
            </span>
          )}

          {showRefundBadge && (
            <Tooltip.Provider delayDuration={80}>
              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-1 text-xs text-[var(--color-muted-foreground)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
                    aria-label="환불 정책 자세히 보기"
                  >
                    {refundText}
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
    /* ✅ border: var() 폴백 + 라이트/다크 보강 */
    border border-[var(--color-border,#e5e7eb)] dark:border-[var(--color-border,#1f2937)]
    /* ✅ bg: var() 폴백 + 라이트/다크 보강 */
    bg-[var(--color-card,#ffffff)] dark:bg-[var(--color-card,#0b1224)]
    /* 텍스트도 폴백 */
    text-[var(--color-muted-foreground,#334155)] dark:text-[var(--color-muted-foreground,#cbd5e1)]
    px-3 py-2 text-xs shadow-md
    supports-[backdrop-filter]:backdrop-blur-[2px]
  "
                >
                  <div className="font-medium text-[var(--color-foreground)] mb-1">
                    환불 정책
                  </div>
                  <ul className="list-disc pl-4 space-y-1">
                    {refundTooltipLines.map((line, i) => (
                      <li key={i}>{line}</li>
                    ))}
                  </ul>
                  <Link
                    href={refundPolicyHref}
                    className="mt-2 inline-block underline text-[var(--color-primary-600)] hover:text-[var(--color-primary-700)]"
                  >
                    자세히 보기
                  </Link>
                  <Tooltip.Arrow className="fill-[var(--color-card)]" />
                </Tooltip.Content>
              </Tooltip.Root>
            </Tooltip.Provider>
          )}
        </div>
      )}

      {/* 안심 카피 배너 (토큰 수치 없이 안내) */}
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
              <strong className="font-extrabold">
                요약 정리 1건당 1 크레딧이면 충분해요.
              </strong>
            </p>

            {/* 서브 1줄 */}
            <p
              className={cx(
                "text-xs sm:text-sm leading-relaxed",
                "text-[var(--color-muted-foreground)]",
                "dark:text-neutral-200"
              )}
            >
              아주 긴 스크립트만 2–3 크레딧이 필요할 수 있어요.
            </p>
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
                <Link href={signedInHref} className={ctaBtn}>
                  {signedInLabel}
                </Link>
              ) : (
                <Link href={signedOutHref} className={ctaBtn}>
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
