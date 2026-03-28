"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AlertCircle, ChevronLeft, ChevronRight, RefreshCw, Search } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { cn } from "@/lib/utils";

type PaymentStatus =
  | "pending"
  | "paid"
  | "failed"
  | "refunded"
  | "part_refunded"
  | "canceled";

type PaymentProvider = "toss" | "lemon_squeezy";
type Currency = "krw" | "usd";

type QueryState = {
  email: string;
  dateFrom: string;
  dateTo: string;
  status: "" | PaymentStatus;
  provider: "" | PaymentProvider;
  page: number;
  limit: number;
};

type GetAdminPaymentsResponse = {
  items: Array<{
    id: string;
    userId: string;
    email: string | null;
    provider: PaymentProvider;
    providerOrderId: string;
    status: PaymentStatus;
    amount: number;
    currency: Currency;
    credits: number;
    paidAt: string | null;
    refundedAt: string | null;
    createdAt: string;
    paymentMethod: string | null;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
  filters: {
    email: string | null;
    dateFrom: string | null;
    dateTo: string | null;
    status: string | null;
    provider: string | null;
  };
};

const DEFAULT_LIMIT = 20;
const LIMIT_OPTIONS = [20, 50, 100] as const;

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

function parsePositiveInt(value: string | null, fallback: number) {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function clampLimit(limit: number) {
  return Math.min(Math.max(limit, 1), 100);
}

function parseQueryState(searchParams: URLSearchParams): QueryState {
  return {
    email: searchParams.get("email") ?? "",
    dateFrom: isoToLocalInput(searchParams.get("dateFrom")),
    dateTo: isoToLocalInput(searchParams.get("dateTo")),
    status: ((searchParams.get("status") as PaymentStatus | null) ?? "") as QueryState["status"],
    provider: ((searchParams.get("provider") as PaymentProvider | null) ?? "") as QueryState["provider"],
    page: parsePositiveInt(searchParams.get("page"), 1),
    limit: clampLimit(parsePositiveInt(searchParams.get("limit"), DEFAULT_LIMIT)),
  };
}

function isoToLocalInput(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function localInputToIso(value: string) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

function buildSearchParams(state: QueryState) {
  const params = new URLSearchParams();

  if (state.email.trim()) params.set("email", state.email.trim());
  if (state.dateFrom) params.set("dateFrom", localInputToIso(state.dateFrom));
  if (state.dateTo) params.set("dateTo", localInputToIso(state.dateTo));
  if (state.status) params.set("status", state.status);
  if (state.provider) params.set("provider", state.provider);
  if (state.page > 1) params.set("page", String(state.page));
  if (state.limit !== DEFAULT_LIMIT) params.set("limit", String(state.limit));

  return params;
}

function formatDateTime(value: string | null) {
  if (!value) return "-";
  try {
    return new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
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
          "border-rose-500/40 bg-rose-50 text-rose-700",
      )}
    >
      {statusLabel[status]}
    </span>
  );
}

function DetailItem({
  label,
  value,
  emphasize = false,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <div className="min-w-0">
      <div className="text-[11px] font-medium text-neutral-500">{label}</div>
      <div
        className={cn(
          "mt-0.5 break-all text-[13px] leading-5 text-neutral-800",
          emphasize && "font-semibold text-neutral-950"
        )}
      >
        {value}
      </div>
    </div>
  );
}

function PaymentCard({
  item,
  detailHref,
}: {
  item: GetAdminPaymentsResponse["items"][number];
  detailHref: string;
}) {
  return (
    <article className="group relative overflow-hidden rounded-3xl border border-slate-300 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(248,250,252,0.98)_100%)] p-4 shadow-[0_18px_32px_-28px_rgba(15,23,42,0.42)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_24px_48px_-32px_rgba(15,23,42,0.32)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#0ea5e9_0%,#2563eb_48%,#14b8a6_100%)] opacity-80" />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <StatusBadge status={item.status} />
            <span className="inline-flex items-center rounded-full border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700">
              {providerLabel[item.provider]}
            </span>
          </div>

          <div className="mt-2 truncate text-base font-extrabold tracking-tight text-neutral-950 sm:text-lg">
            {item.email ?? "이메일 없음"}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-500">
            <span>UID {item.userId}</span>
            <span>결제일 {formatDateTime(item.paidAt ?? item.createdAt)}</span>
            <span>{item.paymentMethod ?? "수단 미확인"}</span>
          </div>
        </div>

        <div className="lg:min-w-[190px] lg:text-right">
          <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-blue-700">
            결제 금액
          </div>
          <div className="mt-0.5 text-xl font-extrabold tracking-tight text-neutral-950">
            {formatAmount(item.amount, item.currency)}
          </div>
          <div className="text-[11px] uppercase text-neutral-500">{item.currency}</div>
        </div>
      </div>

      <div className="mt-3 grid gap-x-4 gap-y-2 border-t border-slate-200 pt-3 sm:grid-cols-2">
        <DetailItem label="주문번호" value={item.providerOrderId} />
        <DetailItem
          label="환불 처리일"
          value={item.refundedAt ? formatDateTime(item.refundedAt) : "-"}
        />
      </div>

      <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2 sm:grid-cols-4 lg:grid-cols-5">
        <DetailItem
          label="구매 크레딧"
          value={`${item.credits.toLocaleString()}cr`}
          emphasize
        />
        <DetailItem label="결제 수단" value={item.paymentMethod ?? "-"} />
        <DetailItem label="결제일" value={formatDateTime(item.paidAt ?? item.createdAt)} />
        <DetailItem label="생성일" value={formatDateTime(item.createdAt)} />
        <DetailItem label="사용자 ID" value={item.userId} />
      </div>

      <div className="mt-3 flex flex-col gap-2 border-t border-slate-200 pt-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-[11px] text-neutral-500">
          목록 API는 최소 정보만 보여줘요. 상세 사용 내역과 환불 가능 여부는 상세 API에서 확인합니다.
        </div>

        <Link
          href={detailHref}
          className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-500"
        >
          상세 보기
        </Link>
      </div>
    </article>
  );
}

export default function AdminRefundPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams.toString();

  const [form, setForm] = useState<QueryState>(() => parseQueryState(new URLSearchParams(searchParamsString)));
  const [data, setData] = useState<GetAdminPaymentsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setForm(parseQueryState(new URLSearchParams(searchParamsString)));
  }, [searchParamsString, refreshKey]);

  useEffect(() => {
    let cancelled = false;

    async function fetchPayments() {
      setLoading(true);
      setErrorMessage(null);

      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
        if (!baseUrl) {
          throw new Error("NEXT_PUBLIC_API_BASE_URL이 설정되지 않았어요.");
        }

        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        const accessToken = session?.access_token;
        if (!accessToken) {
          throw new Error("관리자 세션을 찾지 못했어요. 다시 로그인해 주세요.");
        }

        const response = await fetch(`${baseUrl}/admin/payments?${searchParamsString}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          cache: "no-store",
        });

        if (response.status === 401) {
          throw new Error("인증이 만료되었어요. 다시 로그인해 주세요.");
        }

        if (response.status === 403) {
          throw new Error("관리자 권한이 필요해요.");
        }

        if (response.status === 400) {
          const body = (await response.json()) as { message?: string | string[] };
          const message = Array.isArray(body.message) ? body.message.join(", ") : body.message;
          throw new Error(message || "검색 조건 형식이 올바르지 않아요.");
        }

        if (!response.ok) {
          throw new Error("결제 목록을 불러오지 못했어요.");
        }

        const json = (await response.json()) as GetAdminPaymentsResponse;
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

    void fetchPayments();

    return () => {
      cancelled = true;
    };
  }, [searchParamsString]);

  const pagination = data?.pagination ?? { page: form.page, limit: form.limit, total: 0 };
  const totalPages = Math.max(1, Math.ceil(pagination.total / pagination.limit));

  const summaryCards = [
    { label: "조회 결과", value: `${pagination.total.toLocaleString()}건` },
    { label: "현재 페이지", value: `${pagination.page} / ${totalPages}` },
    { label: "페이지 크기", value: `${pagination.limit.toLocaleString()}건` },
  ];

  const updateUrl = (nextState: QueryState) => {
    const params = buildSearchParams(nextState);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateUrl({ ...form, page: 1 });
  };

  const handleReset = () => {
    const nextState: QueryState = {
      email: "",
      dateFrom: "",
      dateTo: "",
      status: "",
      provider: "",
      page: 1,
      limit: DEFAULT_LIMIT,
    };
    setForm(nextState);
    updateUrl(nextState);
  };

  const movePage = (nextPage: number) => {
    updateUrl({
      ...form,
      page: Math.min(Math.max(nextPage, 1), totalPages),
    });
  };

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-[#f4f6fb]">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(900px_500px_at_88%_-10%,rgba(14,165,233,0.16),transparent_65%),radial-gradient(760px_460px_at_0%_0%,rgba(59,130,246,0.12),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_right,rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-[size:28px_28px] [mask-image:radial-gradient(ellipse_at_top,black,transparent_78%)]" />

      <header className="mx-auto max-w-7xl px-6 pt-20 md:px-10 md:pt-24">
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-[11px] font-semibold tracking-[0.02em] text-slate-800 shadow-[0_10px_24px_-18px_rgba(15,23,42,0.28)]">
          <span className="inline-block h-2 w-2 rounded-full bg-blue-500" />
          ADMIN REFUND
        </div>

        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-[24px] font-extrabold tracking-tight text-neutral-950 sm:text-[30px]">
              환불 처리용 결제 목록
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-neutral-600 sm:text-base">
              사용자 이메일, 결제일, 상태, 결제사 기준으로 결제를 찾고 환불 가능 여부를 한 화면에서 확인할 수 있어요.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href={pathname.replace(/\/refund$/, "") || "/admin"}
              className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-neutral-800 transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              관리자 홈
            </Link>
            <button
              type="button"
              onClick={() => setRefreshKey((prev) => prev + 1)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-white transition-all hover:-translate-y-0.5 hover:bg-slate-700 hover:shadow-md"
            >
              <RefreshCw className="h-4 w-4" />
              새로고침
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 pb-24 md:px-10">
        <section className="mt-8 grid gap-4 md:grid-cols-3">
          {summaryCards.map((card) => (
            <div
              key={card.label}
              className="rounded-3xl border border-slate-300 bg-white/90 px-5 py-4 shadow-sm"
            >
              <div className="text-xs font-medium text-neutral-500">{card.label}</div>
              <div className="mt-2 text-2xl font-extrabold tracking-tight text-neutral-950">
                {card.value}
              </div>
            </div>
          ))}
        </section>

        <section className="mt-8 rounded-[28px] border border-slate-300 bg-white/92 p-5 shadow-[0_18px_50px_-30px_rgba(15,23,42,0.35)] sm:p-6">
          <form className="grid gap-4 lg:grid-cols-[1.6fr_1fr_1fr_0.9fr_0.9fr_0.8fr]" onSubmit={handleSubmit}>
            <label className="flex flex-col gap-2 text-sm font-medium text-neutral-700">
              사용자 이메일
              <input
                type="text"
                value={form.email}
                onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                placeholder="gmail.com 또는 user@example.com"
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-neutral-700">
              결제 시작일
              <input
                type="datetime-local"
                value={form.dateFrom}
                onChange={(event) => setForm((prev) => ({ ...prev, dateFrom: event.target.value }))}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-neutral-900 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-neutral-700">
              결제 종료일
              <input
                type="datetime-local"
                value={form.dateTo}
                onChange={(event) => setForm((prev) => ({ ...prev, dateTo: event.target.value }))}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-neutral-900 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-neutral-700">
              결제 상태
              <select
                value={form.status}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, status: event.target.value as QueryState["status"] }))
                }
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-neutral-900 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
              >
                <option value="">전체</option>
                {Object.entries(statusLabel).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-neutral-700">
              결제사
              <select
                value={form.provider}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    provider: event.target.value as QueryState["provider"],
                  }))
                }
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-neutral-900 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
              >
                <option value="">전체</option>
                {Object.entries(providerLabel).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-neutral-700">
              페이지 크기
              <select
                value={form.limit}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    limit: clampLimit(Number(event.target.value)),
                  }))
                }
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-neutral-900 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
              >
                {LIMIT_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}개
                  </option>
                ))}
              </select>
            </label>

            <div className="flex flex-wrap items-center gap-2 lg:col-span-full lg:justify-end">
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-700 transition-colors hover:bg-slate-50"
              >
                초기화
              </button>
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-blue-700 bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-md"
              >
                <Search className="h-4 w-4" />
                검색
              </button>
            </div>
          </form>

          <div className="mt-4 rounded-2xl border border-sky-200 bg-sky-50/90 px-4 py-3 text-xs leading-5 text-sky-900">
            날짜 검색은 현재 사용 중인 브라우저의 로컬 시간대를 기준으로 적용돼요. 예를 들어 한국 브라우저에서 입력하면 KST 기준으로 검색됩니다.
          </div>
        </section>

        <section className="mt-8 rounded-[28px] border border-slate-300 bg-white/95 p-4 shadow-[0_18px_50px_-30px_rgba(15,23,42,0.35)] sm:p-5">
          {errorMessage ? (
            <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>{errorMessage}</div>
            </div>
          ) : null}

          {loading ? (
            <div className="py-16 text-center text-sm text-neutral-500">결제 목록을 불러오는 중이에요…</div>
          ) : !data || data.items.length === 0 ? (
            <div className="py-16 text-center text-sm text-neutral-500">
              조건에 맞는 결제가 없어요. 검색 조건을 조정해 보세요.
            </div>
          ) : (
            <>
              <div className="grid gap-3">
                {data.items.map((item) => (
                  <PaymentCard
                    key={item.id}
                    item={item}
                    detailHref={`${pathname}/${item.id}${searchParamsString ? `?${searchParamsString}` : ""}`}
                  />
                ))}
              </div>

              <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-neutral-500">
                  총 {pagination.total.toLocaleString()}건 중 {(pagination.page - 1) * pagination.limit + 1}-
                  {Math.min(pagination.page * pagination.limit, pagination.total)}건 표시
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => movePage(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                    className="inline-flex items-center gap-1 rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-neutral-700 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    이전
                  </button>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-neutral-800">
                    {pagination.page} / {totalPages}
                  </div>
                  <button
                    type="button"
                    onClick={() => movePage(pagination.page + 1)}
                    disabled={pagination.page >= totalPages}
                    className="inline-flex items-center gap-1 rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-neutral-700 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    다음
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
