// app/[locale]/billing/receipt/[id]/page.tsx
"use client";

import { useMemo, useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "@/components/SessionProvider";

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

// 🔹 history 페이지와 동일한 가데이터 (필요하면 공통 파일로 빼도 됨)
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
    receiptUrl: "#",
  },
  {
    id: "PAY-2025-02-03-002",
    createdAt: "2025-02-03T21:14:00+09:00",
    currency: "krw",
    amount: 4000,
    credits: 50,
    status: "success",
    provider: "Toss",
    method: "토스페이",
    packLabel: "50 크레딧 팩",
    receiptUrl: "#",
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
    receiptUrl: "#",
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
    receiptUrl: "#",
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
];

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

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat("ko-KR", {
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

function StatusBadge({ status }: { status: PaymentStatus }) {
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
        결제 완료
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
        진행 중
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
        환불 완료
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
      결제 실패
    </span>
  );
}

export default function BillingReceiptPage({
    params,
  }: {
    params: Promise<{ locale: string; id: string }>;
  }) {
    const { session } = useSession();
    const router = useRouter();
  
    // 🔹 여기서 params(프라미스)를 풀어서 사용
    const { id, locale } = use(params);

  // 로그인 안 되어 있으면 로그인 페이지로
  useEffect(() => {
    if (!session) {
      router.push("/login");
    }
  }, [session, router]);

  // id로 결제내역 찾기
  const payment = useMemo(
    () => MOCK_PAYMENTS.find((p) => p.id === id),
    [id]
  );

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className="relative min-h-[100dvh] bg-[#f4f6fb] dark:bg-[#020617] overflow-hidden">
      {/* 💡 Light BG */}
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
        <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
          <Link
            href="/billing/history"
            className="hover:underline hover:text-neutral-800 dark:hover:text-neutral-200"
          >
            결제 내역
          </Link>{" "}
          <span className="mx-1">/</span>
          <span className="text-neutral-700 dark:text-neutral-300">
            영수증
          </span>
        </div>

        <div className="mt-2 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white dark:[text-shadow:0_1px_12px_rgba(0,0,0,0.45)]">
              결제 영수증
            </h1>
            <p className="mt-2 text-sm md:text-base text-neutral-700 dark:text-neutral-300 max-w-xl">
              크레딧 충전 건에 대한 상세 내역을 확인할 수 있어요.
            </p>
          </div>

          <div className="mt-3 md:mt-0 flex gap-2 justify-start md:justify-end">
            <Link
              href="/billing/history"
              className="
                inline-flex items-center justify-center rounded-2xl
                border border-white/70 bg-white/80 px-4 py-2 text-xs sm:text-sm font-medium
                text-neutral-900
                hover:-translate-y-0.5 hover:shadow-md
                transition-all
                dark:bg-black/40 dark:border-white/20 dark:text-neutral-100
              "
            >
              결제 내역으로 돌아가기
            </Link>
            <button
              type="button"
              onClick={handlePrint}
              className="
                inline-flex items-center justify-center rounded-2xl
                border border-neutral-200/80 bg-white px-4 py-2 text-xs sm:text-sm font-medium
                text-neutral-700
                hover:bg-neutral-50
                dark:border-white/20 dark:bg-black/70 dark:text-neutral-100 dark:hover:bg-white/5
              "
            >
              인쇄 / PDF 저장
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 md:px-10 pb-24">
        {!payment ? (
          <section className="mt-10">
            <div className="rounded-3xl border border-white/80 bg-white/95 backdrop-blur p-5 sm:p-6 text-center dark:bg-black/50 dark:border-white/20">
              <h2 className="text-sm sm:text-base font-semibold text-neutral-900 dark:text-neutral-50">
                영수증을 찾을 수 없습니다.
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-neutral-600 dark:text-neutral-300">
                유효하지 않은 결제 ID이거나, 영수증 정보가 더 이상 보관되어 있지
                않을 수 있어요.
              </p>
              <div className="mt-4">
                <Link
                  href="/billing/history"
                  className="
                    inline-flex items-center justify-center rounded-2xl
                    border border-neutral-200/80 bg-white px-4 py-2 text-xs sm:text-sm font-medium
                    text-neutral-700
                    hover:bg-neutral-50
                    dark:border-white/20 dark:bg-black/70 dark:text-neutral-100 dark:hover:bg-white/5
                  "
                >
                  결제 내역으로 돌아가기
                </Link>
              </div>
            </div>
          </section>
        ) : (
          <>
            {/* 상단 요약 카드 */}
            <section className="mt-8">
              <div className="rounded-3xl border border-white/80 bg-white/95 backdrop-blur px-5 py-5 sm:px-6 sm:py-6 dark:bg-black/50 dark:border-white/20">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-2">
                      <h2 className="text-lg sm:text-xl font-semibold text-neutral-900 dark:text-neutral-50">
                        {payment.packLabel}
                      </h2>
                      <StatusBadge status={payment.status} />
                    </div>
                    <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300">
                      결제 ID:{" "}
                      <span className="font-mono text-[11px] sm:text-xs">
                        {payment.id}
                      </span>
                    </p>
                    <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300">
                      결제 일시: {formatDate(payment.createdAt)}
                    </p>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-medium uppercase tracking-[0.12em] text-neutral-500 dark:text-neutral-400">
                      결제 금액
                    </div>
                    <div className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-50">
                      {formatAmount(payment.amount, payment.currency)}
                    </div>
                    <div className="mt-1 text-xs sm:text-sm text-neutral-600 dark:text-neutral-300">
                      + {payment.credits.toLocaleString()} 크레딧 충전
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 상세 정보 카드 */}
            <section className="mt-8 grid gap-6 lg:grid-cols-2">
              {/* 결제 정보 */}
              <div className="rounded-3xl border border-white/80 bg-white/95 backdrop-blur p-4 sm:p-5 dark:bg-black/50 dark:border-white/20">
                <h3 className="text-sm sm:text-base font-semibold text-neutral-900 dark:text-neutral-50">
                  결제 정보
                </h3>
                <dl className="mt-3 space-y-1.5 text-xs sm:text-sm text-neutral-700 dark:text-neutral-200">
                  <div className="flex justify-between gap-4">
                    <dt className="text-neutral-500 dark:text-neutral-400">
                      결제 수단
                    </dt>
                    <dd className="text-right">{payment.method}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-neutral-500 dark:text-neutral-400">
                      결제 처리사
                    </dt>
                    <dd className="text-right">
                      {payment.provider === "Toss"
                        ? "토스페이먼츠(Toss Payments)"
                        : "LemonSqueezy"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-neutral-500 dark:text-neutral-400">
                      결제 통화
                    </dt>
                    <dd className="text-right">
                      {payment.currency === "krw" ? "KRW (원화)" : "USD (달러)"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-neutral-500 dark:text-neutral-400">
                      상태
                    </dt>
                    <dd className="text-right">
                      <StatusBadge status={payment.status} />
                    </dd>
                  </div>
                </dl>
              </div>

              {/* 크레딧 정보 */}
              <div className="rounded-3xl border border-white/80 bg-white/95 backdrop-blur p-4 sm:p-5 dark:bg-black/50 dark:border-white/20">
                <h3 className="text-sm sm:text-base font-semibold text-neutral-900 dark:text-neutral-50">
                  크레딧 정보
                </h3>
                <dl className="mt-3 space-y-1.5 text-xs sm:text-sm text-neutral-700 dark:text-neutral-200">
                  <div className="flex justify-between gap-4">
                    <dt className="text-neutral-500 dark:text-neutral-400">
                      충전된 크레딧
                    </dt>
                    <dd className="text-right">
                      {payment.credits.toLocaleString()} 크레딧
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-neutral-500 dark:text-neutral-400">
                      예상 구조맵 개수
                    </dt>
                    <dd className="text-right">
                      약 {payment.credits.toLocaleString()}개 분량
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-neutral-500 dark:text-neutral-400">
                      사용 기준
                    </dt>
                    <dd className="text-right">
                      구조맵 1개당 기본 1크레딧 차감
                    </dd>
                  </div>
                </dl>
              </div>
            </section>

            {/* 안내 섹션 */}
            <section className="mt-10">
              <div className="rounded-3xl border border-white/80 bg-white/90 backdrop-blur p-4 sm:p-5 dark:bg-black/40 dark:border-white/20">
                <h3 className="text-sm sm:text-base font-semibold text-neutral-900 dark:text-neutral-50">
                  영수증 및 환불 안내
                </h3>
                <ul className="mt-2 space-y-1.5 text-xs sm:text-sm text-neutral-700 dark:text-neutral-200">
                  <li>• 이 페이지는 서비스 내 참고용 영수증입니다.</li>
                  <li>• 카드사 청구 내역과 실제 청구 시점은 다를 수 있어요.</li>
                  <li>
                    • 환불이 완료된 경우, 카드사/결제사 정책에 따라 환불 반영까지
                    며칠이 소요될 수 있어요.
                  </li>
                  <li>
                    • 세무용 증빙이 필요하다면, 추후 사업자용 결제/정산 기능을
                    통해 별도 증빙을 제공할 예정입니다.
                  </li>
                </ul>
                <p className="mt-2 text-[11px] sm:text-xs text-neutral-500 dark:text-neutral-400">
                  추가 문의 사항이 있다면, 문의 페이지를 통해 결제 ID와 함께
                  연락해 주세요.
                </p>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
