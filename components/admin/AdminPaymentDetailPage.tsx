"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AlertCircle, ArrowLeft, ExternalLink, RefreshCw } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type PaymentStatus =
  | "pending"
  | "paid"
  | "failed"
  | "refunded"
  | "part_refunded"
  | "canceled";

type PaymentProvider = "toss" | "lemon_squeezy";
type Currency = "krw" | "usd";

type RefundEligibilityReason =
  | "REFUNDABLE"
  | "PAYMENT_NOT_PAID"
  | "PAYMENT_ALREADY_REFUNDED"
  | "REFUND_WINDOW_EXPIRED"
  | "CREDITS_ALREADY_USED"
  | "NO_REFUNDABLE_CREDITS";

type CreditLotSource = "lemon_squeezy" | "toss" | "system" | "admin" | "migration";
type CreditLotStatus = "active" | "depleted" | "expired" | "refunded";
type CreditUsageType =
  | "map_generation"
  | "summary_generation"
  | "export"
  | "feature_access"
  | "admin_adjustment"
  | "system_deduction";
type CreditTxType = "purchase" | "spend" | "bonus" | "refund" | "adjustment" | "expire";
type CreditTxSource = "lemon_squeezy" | "toss" | "system" | "admin" | "migration";

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue | undefined };

type PaymentDetailResponse = {
  payment: {
    id: string;
    userId: string;
    email: string | null;
    provider: PaymentProvider;
    providerOrderId: string;
    providerCustomerId: string | null;
    providerPaymentKey: string | null;
    providerPaymentKeyExists: boolean;
    paymentMethod: string | null;
    status: PaymentStatus;
    amount: number;
    currency: Currency;
    credits: number;
    creditPackId: string | null;
    paidAt: string | null;
    refundedAt: string | null;
    receiptUrl: string | null;
    createdAt: string;
    updatedAt: string;
  };
  usageSummary: {
    lotCount: number;
    originalCredits: number;
    remainingCredits: number;
    consumedCredits: number;
    mapUsageCount: number;
  };
  refundEligibility: {
    refundable: boolean;
    reason: RefundEligibilityReason;
    refundableUntil: string | null;
  };
  lots: Array<{
    id: string;
    createdAt: string;
    expiresAt: string;
    originalCredits: number;
    paymentId: string;
    remainingCredits: number;
    source: CreditLotSource;
    status: CreditLotStatus;
    updatedAt: string;
    userId: string;
    consumptions: Array<{
      id: string;
      createdAt: string;
      creditTransactionId: string;
      lotId: string;
      metadata: JsonValue;
      referenceId: string | null;
      referenceTable: string | null;
      usageType: CreditUsageType;
      usedCredits: number;
      map: null | {
        id: string;
        title: string | null;
        sourceType: "youtube" | "website" | "file" | "manual" | null;
        sourceUrl: string | null;
        mapStatus: "processing" | "done" | "failed" | "idle" | "queued" | null;
        creditsCharged: number | null;
        createdAt: string | null;
      };
    }>;
  }>;
  creditTransactions: Array<{
    id: string;
    createdAt: string;
    txType: CreditTxType;
    source: CreditTxSource;
    reason: string | null;
    mapId: string | null;
    paymentId: string | null;
    deltaFree: number;
    deltaPaid: number;
    deltaTotal: number;
    balanceFreeAfter: number;
    balancePaidAfter: number;
    balanceTotalAfter: number;
  }>;
};

type RefundRequestBody = {
  cancel_reason?: string;
};

type RefundResponse = {
  paymentId: string;
  refundedCredits: number;
  refundedLotCount: number;
  paymentStatus: "refunded";
  provider: "toss";
  paymentKey: string;
  providerStatus: string;
};

type RefundErrorPayload = {
  code?: string;
  message?: string | string[];
  paymentMethod?: string;
  paymentId?: string;
  providerOrderId?: string;
  balanceAmount?: number;
  status?: string;
};

const statusLabel: Record<PaymentStatus, string> = {
  pending: "대기",
  paid: "결제 완료",
  failed: "실패",
  refunded: "전액 환불",
  part_refunded: "부분 환불",
  canceled: "취소",
};

const providerLabel: Record<PaymentProvider, string> = {
  toss: "토스페이먼츠",
  lemon_squeezy: "Lemon Squeezy",
};

const refundReasonLabel: Record<RefundEligibilityReason, string> = {
  REFUNDABLE: "환불 가능",
  PAYMENT_NOT_PAID: "결제 완료 상태가 아니에요",
  PAYMENT_ALREADY_REFUNDED: "이미 환불 처리된 결제예요",
  REFUND_WINDOW_EXPIRED: "환불 가능 기간이 지났어요",
  CREDITS_ALREADY_USED: "이미 사용된 크레딧이 있어요",
  NO_REFUNDABLE_CREDITS: "환불 가능한 남은 크레딧이 없어요",
};

function formatDateTime(value: string | null) {
  if (!value) return "-";
  try {
    return new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function formatAmount(amount: number, currency: Currency) {
  return new Intl.NumberFormat(currency === "krw" ? "ko-KR" : "en-US", {
    style: "currency",
    currency: currency === "krw" ? "KRW" : "USD",
    maximumFractionDigits: currency === "krw" ? 0 : 2,
  }).format(amount);
}

function formatJson(value: JsonValue) {
  if (value == null) return "null";
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function isUnsupportedRefundMethod(paymentMethod: string | null) {
  const normalized = (paymentMethod ?? "").trim().toLowerCase();
  return (
    normalized.includes("가상계좌") ||
    normalized.includes("계좌이체") ||
    normalized.includes("virtual") ||
    normalized.includes("transfer") ||
    normalized.includes("bank")
  );
}

function getRefundDisabledReason(
  refundable: boolean,
  refundReason: RefundEligibilityReason,
  paymentMethod: string | null,
  submitting: boolean
) {
  if (submitting) return "환불 처리 중이에요.";
  if (isUnsupportedRefundMethod(paymentMethod)) {
    return "가상계좌/계좌이체는 현재 관리자 환불 플로우에서 지원하지 않아요.";
  }
  if (!refundable) {
    return refundReasonLabel[refundReason];
  }
  return null;
}

function StatusBadge({ status }: { status: PaymentStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold",
        status === "paid" && "border-emerald-500/40 bg-emerald-50 text-emerald-700",
        status === "pending" && "border-amber-500/40 bg-amber-50 text-amber-700",
        (status === "refunded" || status === "part_refunded") &&
          "border-sky-500/40 bg-sky-50 text-sky-700",
        (status === "failed" || status === "canceled") &&
          "border-rose-500/40 bg-rose-50 text-rose-700"
      )}
    >
      {statusLabel[status]}
    </span>
  );
}

function RefundBadge({
  refundable,
  reason,
}: {
  refundable: boolean;
  reason: RefundEligibilityReason;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold",
        refundable
          ? "border-emerald-500/40 bg-emerald-50 text-emerald-700"
          : "border-slate-400 bg-slate-100 text-slate-700"
      )}
    >
      {refundable ? "환불 가능" : refundReasonLabel[reason]}
    </span>
  );
}

function KeyValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <div className="text-[11px] font-medium text-neutral-500">{label}</div>
      <div className="mt-0.5 break-all text-sm font-semibold text-neutral-900">{value}</div>
    </div>
  );
}

export default function AdminPaymentDetailPage({
  paymentId,
}: {
  paymentId: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams.toString();
  const listHref = `${pathname.replace(/\/[^/]+$/, "")}${searchParamsString ? `?${searchParamsString}` : ""}`;

  const [data, setData] = useState<PaymentDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [refundSubmitting, setRefundSubmitting] = useState(false);
  const [cancelReason, setCancelReason] = useState("admin_refund");

  useEffect(() => {
    let cancelled = false;

    async function fetchDetail() {
      setLoading(true);
      setErrorMessage(null);

      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
        if (!baseUrl) throw new Error("NEXT_PUBLIC_API_BASE_URL이 설정되지 않았어요.");

        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        const accessToken = session?.access_token;
        if (!accessToken) throw new Error("관리자 세션을 찾지 못했어요. 다시 로그인해 주세요.");

        const response = await fetch(`${baseUrl}/admin/payments/${paymentId}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          cache: "no-store",
        });

        if (response.status === 401) throw new Error("인증이 만료되었어요. 다시 로그인해 주세요.");
        if (response.status === 403) throw new Error("관리자 권한이 필요해요.");
        if (response.status === 404) throw new Error("결제를 찾지 못했어요.");
        if (!response.ok) throw new Error("결제 상세 정보를 불러오지 못했어요.");

        const json = (await response.json()) as PaymentDetailResponse;
        if (!cancelled) setData(json);
      } catch (error) {
        if (!cancelled) {
          setData(null);
          setErrorMessage(error instanceof Error ? error.message : "알 수 없는 오류가 발생했어요.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void fetchDetail();

    return () => {
      cancelled = true;
    };
  }, [paymentId, refreshKey]);

  const payment = data?.payment;
  const summary = data?.usageSummary;
  const eligibility = data?.refundEligibility;
  const refundDisabledReason =
    payment && eligibility
      ? getRefundDisabledReason(
          eligibility.refundable,
          eligibility.reason,
          payment.paymentMethod,
          refundSubmitting
        )
      : "결제 정보를 불러오는 중이에요.";
  const canRefund = Boolean(
    payment &&
      eligibility &&
      eligibility.refundable &&
      !isUnsupportedRefundMethod(payment.paymentMethod) &&
      !refundSubmitting
  );

  async function handleRefund() {
    if (!payment || !eligibility) return;
    if (!canRefund) return;

    try {
      setRefundSubmitting(true);

      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      if (!baseUrl) throw new Error("NEXT_PUBLIC_API_BASE_URL이 설정되지 않았어요.");

      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const accessToken = session?.access_token;
      if (!accessToken) throw new Error("관리자 세션을 찾지 못했어요. 다시 로그인해 주세요.");

      const body: RefundRequestBody = {
        cancel_reason: cancelReason.trim() || "admin_refund",
      };

      const response = await fetch(`${baseUrl}/admin/payments/${paymentId}/refund`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const maybeJson = (await response.json().catch(() => null)) as
        | RefundErrorPayload
        | RefundResponse
        | null;

      if (!response.ok) {
        const errorPayload =
          maybeJson && !("paymentStatus" in maybeJson)
            ? (maybeJson as RefundErrorPayload)
            : null;
        const message = Array.isArray(errorPayload?.message)
          ? errorPayload.message.join(", ")
          : errorPayload?.message;
        const code = errorPayload?.code;

        if (code === "UNSUPPORTED_PAYMENT_METHOD") {
          throw new Error("지원하지 않는 결제수단이에요. 카드 또는 Toss easyPay 결제만 환불할 수 있어요.");
        }
        if (code === "TOSS_PAYMENT_KEY_NOT_FOUND") {
          throw new Error("paymentKey가 없어 Toss 환불을 진행할 수 없어요.");
        }
        if (code === "TOSS_REFUND_NOT_FULLY_COMPLETED") {
          throw new Error("Toss 환불이 완전히 끝나지 않았어요. 잠시 후 상태를 다시 확인해 주세요.");
        }

        throw new Error(message || code || "환불 처리에 실패했어요.");
      }

      const result = maybeJson as RefundResponse;
      toast.success(
        `환불 완료: ${result.refundedCredits.toLocaleString()}cr / lot ${result.refundedLotCount}개`
      );
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      const rawMessage =
        error instanceof Error ? error.message : "알 수 없는 오류로 환불에 실패했어요.";
      const message =
        rawMessage === "REFUND_RECEIVE_ACCOUNT_REQUIRED"
          ? "현재 운영 정책상 가상계좌/계좌이체 환불은 지원하지 않아요."
          : rawMessage;
      toast.error(message);
    } finally {
      setRefundSubmitting(false);
    }
  }

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-[#f4f6fb]">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(900px_500px_at_88%_-10%,rgba(14,165,233,0.16),transparent_65%),radial-gradient(760px_460px_at_0%_0%,rgba(59,130,246,0.12),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_right,rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-[size:28px_28px] [mask-image:radial-gradient(ellipse_at_top,black,transparent_78%)]" />

      <header className="mx-auto max-w-7xl px-6 pt-20 md:px-10 md:pt-24">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-[11px] font-semibold tracking-[0.02em] text-slate-800 shadow-[0_10px_24px_-18px_rgba(15,23,42,0.28)]">
              <span className="inline-block h-2 w-2 rounded-full bg-blue-500" />
              ADMIN REFUND DETAIL
            </div>
            <h1 className="mt-3 text-[24px] font-extrabold tracking-tight text-neutral-950 sm:text-[30px]">
              결제 상세 정보
            </h1>
            <p className="mt-2 text-sm text-neutral-600">
              결제 기본 정보, 환불 가능 여부, lot 사용 내역, 관련 ledger 를 한 번에 확인합니다.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href={listHref}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-neutral-800 transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <ArrowLeft className="h-4 w-4" />
              목록으로
            </Link>
            <button
              type="button"
              onClick={() => setRefreshKey((prev) => prev + 1)}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-white transition-all hover:-translate-y-0.5 hover:bg-slate-700 hover:shadow-md"
            >
              <RefreshCw className="h-4 w-4" />
              새로고침
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 pb-24 md:px-10">
        {errorMessage ? (
          <section className="mt-8 rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-800">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>{errorMessage}</div>
            </div>
          </section>
        ) : null}

        {loading ? (
          <section className="mt-8 rounded-3xl border border-slate-300 bg-white/95 px-5 py-16 text-center text-sm text-neutral-500">
            결제 상세 정보를 불러오는 중이에요…
          </section>
        ) : data && payment && summary && eligibility ? (
          <>
            <section className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="rounded-3xl border border-slate-300 bg-white/95 p-5 shadow-sm md:col-span-2">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={payment.status} />
                  <span className="inline-flex items-center rounded-full border border-slate-300 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                    {providerLabel[payment.provider]}
                  </span>
                  <RefundBadge
                    refundable={eligibility.refundable}
                    reason={eligibility.reason}
                  />
                </div>

                <div className="mt-3 text-2xl font-extrabold tracking-tight text-neutral-950">
                  {payment.email ?? "이메일 없음"}
                </div>

                <div className="mt-4 grid gap-x-6 gap-y-3 border-t border-slate-200 pt-4 sm:grid-cols-2 lg:grid-cols-4">
                  <KeyValue label="결제 ID" value={payment.id} />
                  <KeyValue label="사용자 ID" value={payment.userId} />
                  <KeyValue label="주문번호" value={payment.providerOrderId} />
                  <KeyValue label="결제 수단" value={payment.paymentMethod ?? "-"} />
                  <KeyValue label="결제일" value={formatDateTime(payment.paidAt)} />
                  <KeyValue label="생성일" value={formatDateTime(payment.createdAt)} />
                  <KeyValue label="수정일" value={formatDateTime(payment.updatedAt)} />
                  <KeyValue label="환불 처리일" value={formatDateTime(payment.refundedAt)} />
                </div>

                <div className="mt-4 grid gap-x-6 gap-y-3 border-t border-slate-200 pt-4 sm:grid-cols-2 lg:grid-cols-4">
                  <KeyValue label="provider customer" value={payment.providerCustomerId ?? "-"} />
                  <KeyValue label="provider payment key" value={payment.providerPaymentKey ?? "-"} />
                  <KeyValue label="credit pack ID" value={payment.creditPackId ?? "-"} />
                  <KeyValue
                    label="영수증"
                    value={payment.receiptUrl ? "아래 링크 참고" : "-"}
                  />
                </div>

                {payment.receiptUrl ? (
                  <div className="mt-3">
                    <a
                      href={payment.receiptUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-800"
                    >
                      영수증 열기
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                ) : null}
              </div>

              <div className="rounded-3xl border border-slate-300 bg-white/95 p-5 shadow-sm">
                <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-blue-700">
                  결제 금액
                </div>
                <div className="mt-1 text-3xl font-extrabold tracking-tight text-neutral-950">
                  {formatAmount(payment.amount, payment.currency)}
                </div>
                <div className="mt-1 text-xs uppercase text-neutral-500">{payment.currency}</div>

                <div className="mt-5 grid gap-3 border-t border-slate-200 pt-4">
                  <KeyValue label="구매 크레딧" value={`${payment.credits.toLocaleString()}cr`} />
                  <KeyValue label="lot 수" value={`${summary.lotCount.toLocaleString()}개`} />
                  <KeyValue label="사용 크레딧" value={`${summary.consumedCredits.toLocaleString()}cr`} />
                  <KeyValue label="남은 크레딧" value={`${summary.remainingCredits.toLocaleString()}cr`} />
                  <KeyValue label="사용 맵 수" value={`${summary.mapUsageCount.toLocaleString()}건`} />
                  <KeyValue
                    label="환불 가능 기한"
                    value={formatDateTime(eligibility.refundableUntil)}
                  />
                </div>

                <div className="mt-5 border-t border-slate-200 pt-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <RefundBadge
                      refundable={eligibility.refundable}
                      reason={eligibility.reason}
                    />
                    <span className="text-xs text-neutral-500">
                      {eligibility.refundable
                        ? "지금 환불 처리할 수 있어요."
                        : refundReasonLabel[eligibility.reason]}
                    </span>
                  </div>

                    <div className="mt-4 grid gap-3">
                      <label className="grid gap-1.5">
                        <span className="text-xs font-medium text-neutral-600">환불 사유</span>
                      <input
                        type="text"
                        value={cancelReason}
                        onChange={(event) => setCancelReason(event.target.value)}
                        className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
                        placeholder="admin_refund"
                      />
                    </label>

                    <button
                      type="button"
                      onClick={handleRefund}
                      disabled={!canRefund}
                      className={cn(
                        "inline-flex items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-semibold transition-all",
                        canRefund
                          ? "border border-rose-700 bg-rose-600 text-white hover:-translate-y-0.5 hover:bg-rose-700 hover:shadow-md"
                          : "cursor-not-allowed border border-slate-300 bg-slate-100 text-slate-400"
                      )}
                      title={refundDisabledReason ?? undefined}
                    >
                      {refundSubmitting ? "환불 처리 중..." : "환불하기"}
                    </button>
                    {refundDisabledReason ? (
                      <div className="text-xs text-neutral-500">{refundDisabledReason}</div>
                    ) : null}
                  </div>
                </div>
              </div>
            </section>

            <section className="mt-8 rounded-3xl border border-slate-300 bg-white/95 p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-extrabold tracking-tight text-neutral-950">
                    Lot 목록
                  </h2>
                  <p className="mt-1 text-sm text-neutral-500">
                    이 결제로 생성된 credit lot 와 각 소비 내역입니다.
                  </p>
                </div>
                <div className="text-sm font-medium text-neutral-500">
                  {data.lots.length.toLocaleString()}개 lot
                </div>
              </div>

              <div className="mt-4 grid gap-4">
                {data.lots.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-neutral-500">
                    연결된 lot 이 없어요.
                  </div>
                ) : (
                  data.lots.map((lot) => (
                    <article key={lot.id} className="rounded-3xl border border-slate-200 bg-slate-50/75 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <div className="text-sm font-extrabold text-neutral-950">{lot.id}</div>
                          <div className="mt-1 text-xs text-neutral-500">
                            {lot.source} · {lot.status} · 생성 {formatDateTime(lot.createdAt)}
                          </div>
                        </div>
                        <div className="text-sm font-semibold text-neutral-800">
                          {lot.remainingCredits.toLocaleString()} / {lot.originalCredits.toLocaleString()}cr
                        </div>
                      </div>

                      <div className="mt-3 grid gap-x-4 gap-y-2 border-t border-slate-200 pt-3 sm:grid-cols-2 lg:grid-cols-4">
                        <KeyValue label="만료일" value={formatDateTime(lot.expiresAt)} />
                        <KeyValue label="사용자 ID" value={lot.userId} />
                        <KeyValue label="payment ID" value={lot.paymentId} />
                        <KeyValue label="업데이트일" value={formatDateTime(lot.updatedAt)} />
                      </div>

                      <div className="mt-4 border-t border-slate-200 pt-3">
                        <div className="text-sm font-semibold text-neutral-900">
                          사용 내역 {lot.consumptions.length.toLocaleString()}건
                        </div>

                        <div className="mt-3 grid gap-3">
                          {lot.consumptions.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-5 text-sm text-neutral-500">
                              아직 사용 내역이 없어요.
                            </div>
                          ) : (
                            lot.consumptions.map((consumption) => (
                              <div
                                key={consumption.id}
                                className="rounded-2xl border border-slate-200 bg-white p-4"
                              >
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                  <div>
                                    <div className="text-sm font-semibold text-neutral-950">
                                      {consumption.usageType}
                                    </div>
                                    <div className="mt-1 text-xs text-neutral-500">
                                      {formatDateTime(consumption.createdAt)} · {consumption.usedCredits.toLocaleString()}cr 사용
                                    </div>
                                  </div>
                                  <div className="text-xs text-neutral-500">
                                    tx {consumption.creditTransactionId}
                                  </div>
                                </div>

                                <div className="mt-3 grid gap-x-4 gap-y-2 border-t border-slate-200 pt-3 sm:grid-cols-2 lg:grid-cols-4">
                                  <KeyValue label="consumption ID" value={consumption.id} />
                                  <KeyValue label="reference table" value={consumption.referenceTable ?? "-"} />
                                  <KeyValue label="reference ID" value={consumption.referenceId ?? "-"} />
                                  <KeyValue label="lot ID" value={consumption.lotId} />
                                </div>

                                {consumption.map ? (
                                  <div className="mt-3 border-t border-slate-200 pt-3">
                                    <div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                                      Map 사용처
                                    </div>
                                    <div className="mt-2 grid gap-x-4 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
                                      <KeyValue label="제목" value={consumption.map.title ?? "-"} />
                                      <KeyValue label="source type" value={consumption.map.sourceType ?? "-"} />
                                      <KeyValue label="status" value={consumption.map.mapStatus ?? "-"} />
                                      <KeyValue label="credits charged" value={String(consumption.map.creditsCharged ?? "-")} />
                                      <KeyValue label="생성일" value={formatDateTime(consumption.map.createdAt)} />
                                      <KeyValue label="source url" value={consumption.map.sourceUrl ?? "-"} />
                                    </div>
                                  </div>
                                ) : null}

                                <div className="mt-3 border-t border-slate-200 pt-3">
                                  <div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                                    Metadata
                                  </div>
                                  <pre className="mt-2 overflow-x-auto rounded-2xl bg-slate-950 px-3 py-3 text-[11px] leading-5 text-slate-100">
                                    {formatJson(consumption.metadata)}
                                  </pre>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>

            <section className="mt-8 rounded-3xl border border-slate-300 bg-white/95 p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-extrabold tracking-tight text-neutral-950">
                    Credit Transactions
                  </h2>
                  <p className="mt-1 text-sm text-neutral-500">
                    이 결제와 연관된 ledger 기록입니다.
                  </p>
                </div>
                <div className="text-sm font-medium text-neutral-500">
                  {data.creditTransactions.length.toLocaleString()}건
                </div>
              </div>

              <div className="mt-4 grid gap-3">
                {data.creditTransactions.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-neutral-500">
                    관련 거래 기록이 없어요.
                  </div>
                ) : (
                  data.creditTransactions.map((tx) => (
                    <article key={tx.id} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-extrabold text-neutral-950">
                            {tx.txType} · {tx.source}
                          </div>
                          <div className="mt-1 text-xs text-neutral-500">
                            {formatDateTime(tx.createdAt)} · reason {tx.reason ?? "-"}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-neutral-900">
                            total {tx.deltaTotal > 0 ? "+" : ""}
                            {tx.deltaTotal}
                          </div>
                          <div className="text-xs text-neutral-500">
                            paid {tx.deltaPaid > 0 ? "+" : ""}
                            {tx.deltaPaid} / free {tx.deltaFree > 0 ? "+" : ""}
                            {tx.deltaFree}
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 grid gap-x-4 gap-y-2 border-t border-slate-200 pt-3 sm:grid-cols-2 lg:grid-cols-4">
                        <KeyValue label="tx ID" value={tx.id} />
                        <KeyValue label="map ID" value={tx.mapId ?? "-"} />
                        <KeyValue label="payment ID" value={tx.paymentId ?? "-"} />
                        <KeyValue label="잔액 total" value={String(tx.balanceTotalAfter)} />
                        <KeyValue label="잔액 paid" value={String(tx.balancePaidAfter)} />
                        <KeyValue label="잔액 free" value={String(tx.balanceFreeAfter)} />
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>
          </>
        ) : null}
      </main>
    </div>
  );
}
