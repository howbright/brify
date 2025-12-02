// components/billing/BillingPage.tsx
"use client";

import { Link } from "@/i18n/navigation";
import PricingGrid, { Pack } from "@/components/pricing/PricingGrid";

const CREDIT_PACKS: Pack[] = [
  {
    id: "pack-50",
    credits: 50,
    priceUSD: 9,
    unitUSD: 9 / 50,
    starter: true,
  },
  {
    id: "pack-150",
    credits: 150,
    priceUSD: 24,
    unitUSD: 24 / 150,
    popular: true,
  },
  {
    id: "pack-300",
    credits: 300,
    priceUSD: 39,
    unitUSD: 39 / 300,
  },
];

type Props = {
  currentCredits?: number;
  isAuthed?: boolean;
};

export default function BillingPage({
  currentCredits = 0,
  isAuthed = true,
}: Props) {
  return (
    <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12">
      {/* ───────────────── 상단: 나의 크레딧 + 빠른 충전 ───────────────── */}
      <section
        className="
          rounded-3xl border border-[var(--color-border,#e2e8f0)]
          bg-[radial-gradient(circle_at_0%_0%,rgba(59,130,246,0.16),transparent_55%),radial-gradient(circle_at_100%_0%,rgba(129,140,248,0.2),transparent_55%),linear-gradient(135deg,#ffffff,#f3f4ff)]
          dark:bg-[#020617]
          dark:bg-[radial-gradient(circle_at_0%_0%,rgba(56,189,248,0.40),transparent_60%),radial-gradient(circle_at_100%_0%,rgba(129,140,248,0.55),transparent_60%),linear-gradient(135deg,#020617,#020617)]
          shadow-[0_18px_40px_-24px_rgba(15,23,42,0.65)]
          px-4 sm:px-6 py-5 sm:py-6
        "
      >
        <div className="flex flex-col gap-5 sm:gap-6 md:flex-row md:items-center md:justify-between">
          {/* 왼쪽: 잔액 */}
          <div>
            <p className="text-xs font-semibold tracking-[0.14em] uppercase text-slate-500 dark:text-slate-400">
              나의 크레딧
            </p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-semibold text-slate-900 dark:text-white">
                {currentCredits.toLocaleString()}
              </span>
              <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-300">
                크레딧
              </span>
            </div>
            <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              대부분의 구조맵은 1크레딧이면 충분해요.
            </p>
          </div>

          {/* 오른쪽: 빠른 충전 카드들 */}
          <div className="w-full md:w-auto">
            <p className="mb-2 text-xs font-medium text-slate-700 dark:text-slate-200">
              바로 충전하기
            </p>
            <div className="grid grid-cols-3 gap-2">
              {CREDIT_PACKS.map((pack) => (
                <Link
                  key={pack.id}
                  href={`/billing/checkout?pack=${pack.id}`}
                  className="
                    group flex flex-col items-center justify-center
                    rounded-2xl border border-white/70 dark:border-white/15
                    bg-white/80 dark:bg-white/5
                    px-2.5 py-2.5
                    shadow-sm hover:shadow-md
                    hover:-translate-y-0.5
                    transition-all
                    text-center
                  "
                >
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">
                    {pack.credits.toLocaleString()}
                  </span>
                  <span className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-300">
                    크레딧
                  </span>
                </Link>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
              상세 요금은 아래 팩 표를 참고해주세요.
            </p>
          </div>
        </div>
      </section>

      {/* ───────────────── 크레딧 사용 기준 ───────────────── */}
      <section className="mt-6">
        <div className="rounded-2xl border border-[var(--color-border,#e2e8f0)] bg-[var(--color-card,#ffffff)] dark:bg-[rgba(15,23,42,0.96)] shadow-sm px-4 sm:px-5 py-4">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
            크레딧 사용 기준 (참고용)
          </h2>
          <ul className="mt-2 space-y-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
            <li>• 구조맵 1건 정리 → 기본 1크레딧</li>
            <li>• 2시간 이내 영상 스크립트 → 1크레딧</li>
            <li>• 2~3시간 분량 영상 → 2크레딧</li>
            <li>• 3시간 이상 초장편 영상 → 3크레딧</li>
          </ul>
        </div>
      </section>

      {/* ───────────────── 상세 크레딧 팩 ───────────────── */}
      <section className="mt-6">
        <div className="mb-3 flex items-baseline justify-between gap-2">
          <h2 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-50">
            크레딧 팩 상세 요금
          </h2>
          <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
            한 번 충전한 크레딧은 사용기한 없이 계정에 남아 있어요.
          </p>
        </div>

        <PricingGrid
          packs={CREDIT_PACKS}
          isAuthed={isAuthed}
          signedInHref="/billing/checkout"
          signedOutHref="/login"
          signedInLabel="이 팩으로 결제하기"
          signedOutLabel="로그인 후 결제하기"
          showFooterNote={false}
          variant="compact"
          showPositioning={false}
          showRefundBadge={false}
          showReassurance={false}
        />
      </section>
    </main>
  );
}
