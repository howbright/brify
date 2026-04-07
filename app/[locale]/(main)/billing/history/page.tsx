// app/[locale]/billing/history/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "@/components/SessionProvider";
import { useLocale, useTranslations } from "next-intl";

type Currency = "krw" | "usd";

type PaymentStatus = "paid" | "pending" | "failed" | "refunded" | "part_refunded" | "canceled";

type PaymentRecord = {
  id: string;
  createdAt: string;
  currency: Currency;
  amount: number;
  credits: number;
  status: PaymentStatus;
  provider: "toss" | "lemon_squeezy";
  providerOrderId: string;
  receiptUrl?: string;
};

type HistoryResponse = {
  summary: {
    totalChargedCredits: number;
    currentBalance: number;
    currentPaidBalance: number;
    usedCredits: number;
  };
  payments: Array<{
    id: string;
    created_at: string;
    currency: Currency;
    amount: number;
    credits: number;
    status: PaymentStatus;
    provider: "toss" | "lemon_squeezy";
    provider_order_id: string;
    receipt_url: string | null;
  }>;
};

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

  if (status === "paid") {
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
  if (status === "refunded" || status === "part_refunded") {
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
  const [history, setHistory] = useState<HistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const t = useTranslations("BillingHistoryPage");
  const locale = useLocale();

  useEffect(() => {
    if (!session) {
      router.push(`/${locale}/login?next=${encodeURIComponent(`/${locale}/billing/history`)}`);
    }
  }, [session, router, locale]);

  useEffect(() => {
    if (!session) return;

    let cancelled = false;

    const fetchHistory = async () => {
      try {
        const res = await fetch("/api/billing/history", {
          method: "GET",
          cache: "no-store",
        });

        if (res.status === 401) {
          router.push(`/${locale}/login?next=${encodeURIComponent(`/${locale}/billing/history`)}`);
          return;
        }

        if (!res.ok) {
          throw new Error("Failed to load billing history");
        }

        const data = (await res.json()) as HistoryResponse;
        if (!cancelled) {
          setHistory(data);
        }
      } catch (error) {
        console.error(error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void fetchHistory();

    return () => {
      cancelled = true;
    };
  }, [session, router, locale]);

  const sortedPayments = useMemo(
    () =>
      [...(history?.payments ?? [])]
        .map(
          (payment): PaymentRecord => ({
            id: payment.id,
            createdAt: payment.created_at,
            currency: payment.currency,
            amount: payment.amount,
            credits: payment.credits,
            status: payment.status,
            provider: payment.provider,
            providerOrderId: payment.provider_order_id,
            receiptUrl: payment.receipt_url ?? undefined,
          })
        )
        .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [history]
  );

  const visiblePayments = useMemo(
    () => sortedPayments.slice(0, visibleCount),
    [sortedPayments, visibleCount]
  );

  const totalChargedCredits = history?.summary.totalChargedCredits ?? 0;
  const currentBalance = history?.summary.currentPaidBalance ?? 0;
  const usedCredits = history?.summary.usedCredits ?? 0;

  return (
    <>
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
        <header className="mx-auto max-w-5xl px-6 md:px-10 pt-24 md:pt-28">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-400 bg-white px-3 py-1.5 text-[11px] font-semibold tracking-[0.02em] text-slate-800 shadow-[0_10px_24px_-18px_rgba(15,23,42,0.28)] dark:border-slate-400/55 dark:bg-slate-900 dark:text-slate-100 dark:shadow-[0_16px_34px_-24px_rgba(0,0,0,0.7)]">
            <span className="inline-block h-2 w-2 rounded-full bg-blue-500 dark:bg-blue-400" />
            {t("badge")}
          </div>

          <div className="mt-1.5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-[20px] sm:text-[24px] md:text-[28px] font-extrabold tracking-tight text-neutral-900 dark:text-white dark:[text-shadow:0_1px_12px_rgba(0,0,0,0.45)]">
                {t("title")}
              </h1>
              <p className="mt-1.5 text-sm md:text-base text-neutral-700 dark:text-neutral-300 max-w-xl">
                {t("subtitle")}
              </p>
            </div>

            <div className="mt-3 md:mt-0 flex justify-start md:justify-end">
              <Link
                href={`/${locale}/billing`}
                className="
                  inline-flex items-center justify-center rounded-2xl
                  border border-slate-700 bg-slate-800 px-4 py-2 text-xs sm:text-sm font-medium
                  text-white
                  hover:-translate-y-0.5 hover:bg-slate-700 hover:shadow-md
                  transition-all
                  dark:bg-slate-800 dark:border-slate-700 dark:text-white
                "
              >
                {t("button.goToBilling")}
              </Link>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-5xl px-6 md:px-10 pb-24">
          {/* ✅ 상단 구조화 카드: 총 충전 크레딧 vs 남은 크레딧 */}
	          <section className="mt-8">
	            <div className="mb-5">
	              <h2 className="flex items-center gap-3 text-[18px] md:text-[22px] font-extrabold tracking-tight text-neutral-900 dark:text-neutral-50">
	                <span className="inline-block h-3 w-3 rounded-full bg-blue-600 shadow-[0_0_0_5px_rgba(59,130,246,0.12)] dark:bg-blue-300 dark:shadow-[0_0_0_5px_rgba(96,165,250,0.16)]" />
	                {t("summary.title")}
	              </h2>
	            </div>
	            <div
	              className="
                rounded-3xl border border-slate-400 dark:border-slate-400/55
                bg-white/90 dark:bg-[#050816]
                px-5 py-4 sm:px-6 sm:py-5
                dark:ring-1 dark:ring-white/5
              "
            >
	              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
	                <div className="flex flex-wrap gap-2 text-xs sm:text-sm">
                  {/* 총 충전 크레딧 */}
                  <div className="inline-flex flex-col rounded-2xl border border-slate-400 bg-white px-3 py-2 dark:border-slate-400/55 dark:bg-black/70">
                    <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                      {t("summary.totalCharged")}
                    </span>
                    <span className="mt-0.5 text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                      {totalChargedCredits.toLocaleString()}{" "}
                      {t("summary.unit")}
                    </span>
                  </div>

                  {/* 현재 남은 크레딧 */}
                  <div className="inline-flex flex-col rounded-2xl border border-slate-400 bg-blue-50/80 px-3 py-2 text-blue-800 dark:border-slate-400/55 dark:bg-[rgb(var(--hero-b))]/22 dark:text-[rgb(var(--hero-b))]">
                    <span className="text-[11px]">
                      {t("summary.currentBalance")}
                    </span>
                    <span className="mt-0.5 text-sm font-semibold">
                      {currentBalance.toLocaleString()} {t("summary.unit")}
                    </span>
                  </div>

                  {/* (옵션) 사용된 크레딧 표시 */}
                  <div className="inline-flex flex-col rounded-2xl border border-slate-400 bg-white px-3 py-2 dark:border-slate-400/55 dark:bg-black/70">
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
	            <div className="mb-5">
	              <h2 className="flex items-center gap-3 text-[18px] md:text-[22px] font-extrabold tracking-tight text-neutral-900 dark:text-neutral-50">
	                <span className="inline-block h-3 w-3 rounded-full bg-blue-600 shadow-[0_0_0_5px_rgba(59,130,246,0.12)] dark:bg-blue-300 dark:shadow-[0_0_0_5px_rgba(96,165,250,0.16)]" />
	                {t("list.title")}
	              </h2>
	            </div>
	            <div
	              className="
                rounded-3xl border border-slate-400 dark:border-slate-400/55
                bg-white/95 dark:bg-[#050816]
                px-4 py-4 sm:px-5 sm:py-5
                dark:ring-1 dark:ring-white/5
              "
	            >
	              {/* 헤더 라인 */}
	              <div className="flex items-center justify-between gap-2">
	                <p className="text-[11px] sm:text-xs text-neutral-500 dark:text-neutral-400">
	                  {t("list.caption", {
                    total: sortedPayments.length,
                    visible: visiblePayments.length,
                  })}
                </p>
              </div>

              <div className="mt-4 border-t border-slate-400 dark:border-slate-400/55" />

              {loading ? (
                <div className="py-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
                  {locale === "ko" ? "결제 내역을 불러오는 중이에요." : "Loading your billing history."}
                </div>
              ) : visiblePayments.length === 0 ? (
                <div className="py-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
                  {t("list.empty")}
                </div>
              ) : (
                <div className="mt-1 divide-y divide-slate-400 dark:divide-slate-400/35">
                  {visiblePayments.map((p) => {
                    const providerName =
                      p.provider === "toss"
                        ? locale === "ko"
                          ? "토스페이먼츠"
                          : "Toss Payments"
                        : "LemonSqueezy";

                    const packLabel =
                      locale === "ko"
                        ? `${p.credits.toLocaleString()} 크레딧 팩`
                        : `${p.credits.toLocaleString()} credits pack`;

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
                              {packLabel}
                            </span>
                            <StatusBadge status={p.status} />
                          </div>
                          <div className="text-[11px] sm:text-xs text-neutral-500 dark:text-neutral-400">
                            {t("list.meta", {
                              date: formatDate(p.createdAt, locale),
                              id: p.providerOrderId,
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
                            {p.receiptUrl && p.status !== "failed" && p.status !== "canceled" && (
                              <a
                                href={p.receiptUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="
                                  inline-flex items-center justify-center rounded-xl
                                  border border-slate-400 bg-white px-3 py-1.5
                                  text-[11px] sm:text-xs font-medium text-neutral-700
                                  hover:bg-neutral-50
                                  dark:border-slate-400/55 dark:bg-black/80 dark:text-neutral-100 dark:hover:bg-white/5
                                "
                              >
                                {t("button.viewReceipt")}
                              </a>
                            )}
                            {p.status === "failed" && (
                              <Link
                                href={`/${locale}/billing`}
                                className="
                                  inline-flex items-center justify-center rounded-xl
                                  border border-rose-400/60 bg-rose-50/60 px-3 py-1.5
                                  text-[11px] sm:text-xs font-medium text-rose-700
                                  hover:bg-rose-100
                                  dark:border-rose-400/70 dark:bg-rose-950/40 dark:text-rose-100
                                "
                              >
                                {t("button.retryPayment")}
                              </Link>
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
                      border border-slate-400 bg-white px-4 py-2
                      text-xs sm:text-sm font-medium text-neutral-700
                      hover:bg-neutral-50
                      dark:border-slate-400/55 dark:bg-black/80 dark:text-neutral-100 dark:hover:bg-white/5
                    "
                  >
                    {t("button.loadMore")}
                  </button>
                </div>
              )}
            </div>
          </section>

        </main>
      </div>
    </>
  );
}
