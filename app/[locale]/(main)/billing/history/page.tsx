// app/[locale]/billing/history/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { useSession } from "@/components/SessionProvider";
import { useLocale, useTranslations } from "next-intl";

type Currency = "krw" | "usd";

type PaymentStatus = "success" | "pending" | "failed" | "refunded";

type PaymentRecord = {
  id: string;
  createdAt: string; // ISO string
  currency: Currency;
  amount: number;
  credits: number;
  status: PaymentStatus;
  provider: "Toss" | "LemonSqueezy";
  method: string;
  packLabel: string;
  receiptUrl?: string;
};

// 가데이터 (실제 구현 시 API 연동으로 교체)
const MOCK_PAYMENTS: PaymentRecord[] = [
  {
    id: "PAY-2025-02-10-001",
    createdAt: "2025-02-10T09:32:00+09:00",
    currency: "krw",
    amount: 9000,
    credits: 150,
    status: "success",
    provider: "Toss",
    method: "신용/체크카드",
    packLabel: "150 크레딧 팩",
    receiptUrl: "/billing/receipt/PAY-2025-02-10-001",
  },
  {
    id: "PAY-2025-02-03-002",
    createdAt: "2025-02-03T21:14:00+09:00",
    currency: "krw",
    amount: 3500,
    credits: 50,
    status: "success",
    provider: "Toss",
    method: "토스페이",
    packLabel: "50 크레딧 팩",
    receiptUrl: "/billing/receipt/PAY-2025-02-03-002",
  },
  {
    id: "PAY-2025-01-20-003",
    createdAt: "2025-01-20T14:08:00+09:00",
    currency: "usd",
    amount: 7,
    credits: 150,
    status: "success",
    provider: "LemonSqueezy",
    method: "카드 (해외결제)",
    packLabel: "150 credits pack",
    receiptUrl: "/billing/receipt/PAY-2025-01-20-003",
  },
  {
    id: "PAY-2025-01-05-004",
    createdAt: "2025-01-05T11:45:00+09:00",
    currency: "usd",
    amount: 3,
    credits: 50,
    status: "refunded",
    provider: "LemonSqueezy",
    method: "카드 (해외결제)",
    packLabel: "50 credits pack",
    receiptUrl: "/billing/receipt/PAY-2025-01-05-004",
  },
  {
    id: "PAY-2024-12-28-005",
    createdAt: "2024-12-28T19:22:00+09:00",
    currency: "krw",
    amount: 15000,
    credits: 300,
    status: "failed",
    provider: "Toss",
    method: "신용/체크카드",
    packLabel: "300 크레딧 팩",
  },
  {
    id: "PAY-2024-12-15-006",
    createdAt: "2024-12-15T16:05:00+09:00",
    currency: "krw",
    amount: 9000,
    credits: 150,
    status: "success",
    provider: "Toss",
    method: "간편결제",
    packLabel: "150 크레딧 팩",
    receiptUrl: "/billing/receipt/PAY-2024-12-15-006",
  },
  {
    id: "PAY-2024-12-01-007",
    createdAt: "2024-12-01T10:18:00+09:00",
    currency: "usd",
    amount: 12,
    credits: 300,
    status: "success",
    provider: "LemonSqueezy",
    method: "카드 (해외결제)",
    packLabel: "300 credits pack",
    receiptUrl: "/billing/receipt/PAY-2024-12-01-007",
  },
  {
    id: "PAY-2024-11-21-008",
    createdAt: "2024-11-21T22:40:00+09:00",
    currency: "krw",
    amount: 3500,
    credits: 50,
    status: "pending",
    provider: "Toss",
    method: "신용/체크카드",
    packLabel: "50 크레딧 팩",
  },
  {
    id: "PAY-2024-11-10-009",
    createdAt: "2024-11-10T13:27:00+09:00",
    currency: "usd",
    amount: 7,
    credits: 150,
    status: "success",
    provider: "LemonSqueezy",
    method: "카드 (해외결제)",
    packLabel: "150 credits pack",
    receiptUrl: "/billing/receipt/PAY-2024-11-10-009",
  },
  {
    id: "PAY-2024-11-01-010",
    createdAt: "2024-11-01T09:05:00+09:00",
    currency: "krw",
    amount: 3500,
    credits: 50,
    status: "success",
    provider: "Toss",
    method: "토스페이",
    packLabel: "50 크레딧 팩",
    receiptUrl: "/billing/receipt/PAY-2024-11-01-010",
  },
];

// 가데이터: 현재 계정 남은 크레딧 (BillingPage와 나중에 동일 API로 통합)
const MOCK_CURRENT_BALANCE_CREDITS = 42;

// 통화 포맷터
function formatAmount(amount: number, currency: Currency) {
  if (currency === "krw") {
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
      maximumFractionDigits: 0,
    }).format(amount);
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

// 날짜 포맷터 (locale 기반)
function formatDate(iso: string, locale: string) {
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return iso;
  }
}

// 상태 뱃지 UI
function StatusBadge({ status }: { status: PaymentStatus }) {
  const t = useTranslations("BillingHistoryPage");
  const base =
    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium";

  if (status === "success") {
    return (
      <span
        className={
          base +
          " border-emerald-500/40 bg-emerald-50 text-emerald-700 dark:border-emerald-400/40 dark:bg-emerald-950/40 dark:text-emerald-200"
        }
      >
        {t("status.success")}
      </span>
    );
  }
  if (status === "pending") {
    return (
      <span
        className={
          base +
          " border-amber-500/40 bg-amber-50 text-amber-700 dark:border-amber-400/40 dark:bg-amber-950/40 dark:text-amber-200"
        }
      >
        {t("status.pending")}
      </span>
    );
  }
  if (status === "refunded") {
    return (
      <span
        className={
          base +
          " border-sky-500/40 bg-sky-50 text-sky-700 dark:border-sky-400/40 dark:bg-sky-950/40 dark:text-sky-200"
        }
      >
        {t("status.refunded")}
      </span>
    );
  }
  return (
    <span
      className={
        base +
        " border-rose-500/40 bg-rose-50 text-rose-700 dark:border-rose-400/40 dark:bg-rose-950/40 dark:text-rose-200"
      }
    >
      {t("status.failed")}
    </span>
  );
}

export default function BillingHistoryPage() {
  const { session } = useSession();
  const router = useRouter();
  const [visibleCount, setVisibleCount] = useState(5);

  const t = useTranslations("BillingHistoryPage");
  const locale = useLocale();

  // 로그인 안되면 /login으로
  useEffect(() => {
    if (!session) {
      router.push("/login");
    }
  }, [session, router]);

  // 최신 결제 내역이 위로 오도록 정렬
  const sortedPayments = useMemo(
    () =>
      [...MOCK_PAYMENTS].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    []
  );

  const visiblePayments = useMemo(
    () => sortedPayments.slice(0, visibleCount),
    [sortedPayments, visibleCount]
  );

  // ✅ 총 충전 크레딧 (성공한 결제 기준)
  const totalChargedCredits = useMemo(
    () =>
      sortedPayments
        .filter((p) => p.status === "success")
        .reduce((sum, p) => sum + p.credits, 0),
    [sortedPayments]
  );

  const currentBalance = MOCK_CURRENT_BALANCE_CREDITS;
  const usedCredits = Math.max(totalChargedCredits - currentBalance, 0);

  return (
    <>
      {/* 레몬 스퀴지/PG사 스크립트 필요시 */}
      <Script
        src="https://assets.lemonsqueezy.com/lemon.js"
        strategy="afterInteractive"
      />

      <div className="relative min-h-[100dvh] bg-[#f4f6fb] dark:bg-[#020617] overflow-hidden">
        {/* 💡 Light BG (billing 페이지와 동일 톤) */}
        <div
          className="
            pointer-events-none absolute inset-0 -z-10
            bg-[radial-gradient(900px_500px_at_85%_-10%,rgb(var(--hero-a)_/_0.22),transparent_65%),radial-gradient(700px_420px_at_5%_0%,rgb(var(--hero-b)_/_0.20),transparent_60%)]
            bg-blend-normal
            dark:hidden
          "
        />
        <div
          className="
            pointer-events-none absolute inset-0 -z-10
            [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]
            bg-[linear-gradient(to_right,rgb(var(--hero-grid)_/_0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgb(var(--hero-grid)_/_0.04)_1px,transparent_1px)]
            bg-[size:24px_24px]
            dark:hidden
          "
        />

        {/* 🌙 Dark BG */}
        <div
          className="
            pointer-events-none absolute inset-0 -z-10 hidden dark:block
            bg-[linear-gradient(180deg,#0a0f1c_0%,#05070e_55%,#030408_100%)]
          "
        />
        <div
          className="
            pointer-events-none absolute inset-0 -z-10 hidden dark:block
            bg-[radial-gradient(900px_420px_at_50%_-10%,rgba(0,0,0,0.55),transparent_65%)]
          "
        />
        <div
          className="
            pointer-events-none absolute inset-0 -z-10 hidden dark:block
            bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)]
            bg-[size:28px_28px]
            opacity-[0.6]
          "
        />

        {/* 헤더 */}
        <header className="mx-auto max-w-5xl px-6 md:px-10 pt-20">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/70 px-3 py-1 text-[11px] font-medium text-neutral-700 shadow-sm dark:bg-black/40 dark:border-white/15 dark:text-neutral-200">
            {t("badge")}
          </div>

          <div className="mt-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white dark:[text-shadow:0_1px_12px_rgba(0,0,0,0.45)]">
                {t("title")}
              </h1>
              <p className="mt-2 text-sm md:text-base text-neutral-700 dark:text-neutral-300 max-w-xl">
                {t("subtitle")}
              </p>
            </div>

            <div className="mt-3 md:mt-0 flex justify-start md:justify-end">
              <Link
                href="/billing"
                className="
                  inline-flex items-center justify-center rounded-2xl
                  border border-neutral-200/80 bg-white/80 px-4 py-2 text-xs sm:text-sm font-medium
                  text-neutral-900
                  hover:-translate-y-0.5 hover:shadow-md
                  transition-all
                  dark:bg-black/40 dark:border-white/20 dark:text-neutral-100
                "
              >
                {t("button.goToBilling")}
              </Link>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-5xl px-6 md:px-10 pb-24">
          {/* ✅ 상단 요약 카드: 총 충전 크레딧 vs 남은 크레딧 */}
          <section className="mt-8">
            <div
              className="
                rounded-3xl border border-neutral-200/80 dark:border-white/18
                bg-white/90 dark:bg-[#050816]
                px-5 py-4 sm:px-6 sm:py-5
                dark:ring-1 dark:ring-white/5
              "
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-xs font-medium uppercase tracking-[0.12em] text-neutral-500 dark:text-neutral-400">
                    {t("summary.title")}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 text-xs sm:text-sm">
                  {/* 총 충전 크레딧 */}
                  <div className="inline-flex flex-col rounded-2xl border border-neutral-200/80 bg-white px-3 py-2 dark:border-white/15 dark:bg-black/70">
                    <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                      {t("summary.totalCharged")}
                    </span>
                    <span className="mt-0.5 text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                      {totalChargedCredits.toLocaleString()}{" "}
                      {t("summary.unit")}
                    </span>
                  </div>

                  {/* 현재 남은 크레딧 */}
                  <div className="inline-flex flex-col rounded-2xl border border-blue-500/40 bg-blue-50/80 px-3 py-2 text-blue-800 dark:border-[rgb(var(--hero-b))]/60 dark:bg-[rgb(var(--hero-b))]/22 dark:text-[rgb(var(--hero-b))]">
                    <span className="text-[11px]">
                      {t("summary.currentBalance")}
                    </span>
                    <span className="mt-0.5 text-sm font-semibold">
                      {currentBalance.toLocaleString()} {t("summary.unit")}
                    </span>
                  </div>

                  {/* (옵션) 사용된 크레딧 표시 */}
                  <div className="inline-flex flex-col rounded-2xl border border-neutral-200/80 bg-white px-3 py-2 dark:border-white/15 dark:bg-black/70">
                    <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                      {t("summary.used")}
                    </span>
                    <span className="mt-0.5 text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                      {usedCredits.toLocaleString()} {t("summary.unit")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 결제 내역 리스트 */}
          <section className="mt-8">
            <div
              className="
                rounded-3xl border border-neutral-200/80 dark:border-white/18
                bg-white/95 dark:bg-[#050816]
                px-4 py-4 sm:px-5 sm:py-5
                dark:ring-1 dark:ring-white/5
              "
            >
              {/* 헤더 라인 */}
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm sm:text-base font-semibold text-neutral-900 dark:text-neutral-50">
                  {t("list.title")}
                </h2>
                <p className="text-[11px] sm:text-xs text-neutral-500 dark:text-neutral-400">
                  {t("list.caption", {
                    total: sortedPayments.length,
                    visible: visiblePayments.length,
                  })}
                </p>
              </div>

              <div className="mt-4 border-t border-neutral-200/80 dark:border-white/12" />

              {visiblePayments.length === 0 ? (
                <div className="py-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
                  {t("list.empty")}
                </div>
              ) : (
                <div className="mt-1 divide-y divide-neutral-200/80 dark:divide-white/10">
                  {visiblePayments.map((p) => {
                    const providerName =
                      p.provider === "Toss"
                        ? locale === "ko"
                          ? "토스페이먼츠"
                          : "Toss Payments"
                        : "LemonSqueezy";

                    return (
                      <article
                        key={p.id}
                        className="
                          flex flex-col gap-3 py-4
                          sm:flex-row sm:items-center sm:justify-between
                          dark:bg-white/[0.01] dark:hover:bg-white/[0.03]
                          rounded-2xl sm:rounded-none
                        "
                      >
                        {/* 왼쪽: 패키지 & 날짜 */}
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                              {p.packLabel}
                            </span>
                            <StatusBadge status={p.status} />
                          </div>
                          <div className="text-[11px] sm:text-xs text-neutral-500 dark:text-neutral-400">
                            {t("list.meta", {
                              date: formatDate(p.createdAt, locale),
                              id: p.id,
                            })}
                          </div>
                        </div>

                        {/* 오른쪽: 금액/크레딧/버튼 */}
                        <div className="flex flex-col items-stretch gap-1 sm:w-[260px] sm:flex-row sm:items-center sm:justify-end sm:gap-3">
                          <div className="text-right text-xs sm:text-sm text-neutral-700 dark:text-neutral-200">
                            <div className="font-semibold">
                              {formatAmount(p.amount, p.currency)}
                            </div>
                            <div className="mt-0.5 text-[11px] text-neutral-500 dark:text-neutral-400">
                              {t("list.creditsAndProvider", {
                                credits: p.credits.toLocaleString(),
                                provider: providerName,
                              })}
                            </div>
                          </div>

                          <div className="flex justify-end gap-2">
                            {p.receiptUrl && p.status !== "failed" && (
                              <Link
                                href={p.receiptUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="
                                  inline-flex items-center justify-center rounded-xl
                                  border border-neutral-200/80 bg-white px-3 py-1.5
                                  text-[11px] sm:text-xs font-medium text-neutral-700
                                  hover:bg-neutral-50
                                  dark:border-white/25 dark:bg-black/80 dark:text-neutral-100 dark:hover:bg-white/5
                                "
                              >
                                {t("button.viewReceipt")}
                              </Link>
                            )}
                            {p.status === "failed" && (
                              <button
                                type="button"
                                className="
                                  inline-flex items-center justify-center rounded-xl
                                  border border-rose-400/60 bg-rose-50/60 px-3 py-1.5
                                  text-[11px] sm:text-xs font-medium text-rose-700
                                  hover:bg-rose-100
                                  dark:border-rose-400/70 dark:bg-rose-950/40 dark:text-rose-100
                                "
                              >
                                {t("button.retryPayment")}
                              </button>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}

              {/* 더보기 버튼 */}
              {visibleCount < sortedPayments.length && (
                <div className="mt-4 flex justify-center">
                  <button
                    type="button"
                    onClick={() =>
                      setVisibleCount((prev) =>
                        Math.min(prev + 5, sortedPayments.length)
                      )
                    }
                    className="
                      inline-flex items-center justify-center rounded-2xl
                      border border-neutral-200/80 bg-white px-4 py-2
                      text-xs sm:text-sm font-medium text-neutral-700
                      hover:bg-neutral-50
                      dark:border-white/20 dark:bg-black/80 dark:text-neutral-100 dark:hover:bg-white/5
                    "
                  >
                    {t("button.loadMore")}
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* 안내 섹션 (정책 설명) */}
          <section className="mt-10">
            <div
              className="
                rounded-3xl border border-neutral-200/80 bg-white/90 p-4 sm:p-5
                dark:bg-[#050816] dark:border-white/18 dark:ring-1 dark:ring-white/5
              "
            >
              <h3 className="text-sm sm:text-base font-semibold text-neutral-900 dark:text-neutral-50">
                {t("info.title")}
              </h3>
              <ul className="mt-2 space-y-1.5 text-xs sm:text-sm text-neutral-700 dark:text-neutral-200">
                <li>{t("info.item1")}</li>
                <li>{t("info.item2")}</li>
                <li>{t("info.item3")}</li>
                <li>{t("info.item4")}</li>
              </ul>
              <p className="mt-2 text-[11px] sm:text-xs text-neutral-500 dark:text-neutral-400">
                {t("info.note")}
              </p>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
