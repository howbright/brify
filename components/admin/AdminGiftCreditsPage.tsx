"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Gift, LoaderCircle } from "lucide-react";
import { toast } from "sonner";

import { createClient } from "@/utils/supabase/client";
import { cn } from "@/lib/utils";

type GiftCreditsResponse = {
  userId: string;
  email: string;
  grantedCredits: number;
  balanceFreeAfter: number;
  balancePaidAfter: number;
  balanceTotalAfter: number;
  transactionId: string;
  transactionCreatedAt: string;
  notificationId: string;
  notificationCreatedAt: string;
  memo: string | null;
  grantedByAdminUserId: string;
};

type GiftErrorResponse = {
  statusCode?: number;
  message?: string | string[];
  error?: string;
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

export default function AdminGiftCreditsPage() {
  const pathname = usePathname();
  const [email, setEmail] = useState("");
  const [credits, setCredits] = useState("10");
  const [memo, setMemo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<GiftCreditsResponse | null>(null);

  const parsedCredits = useMemo(() => Number(credits), [credits]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
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

      const response = await fetch(`${baseUrl}/admin/credits/gift`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          credits: parsedCredits,
          memo: memo.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as GiftErrorResponse | null;
        const message = Array.isArray(payload?.message)
          ? payload?.message.join(", ")
          : payload?.message || payload?.error || "크레딧 선물 지급에 실패했어요.";
        throw new Error(message);
      }

      const data = (await response.json()) as GiftCreditsResponse;
      setResult(data);
      toast.success(`${data.email} 에게 ${data.grantedCredits} free credits를 지급했어요.`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "크레딧 선물 지급 중 오류가 발생했어요.";
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-[#f4f6fb]">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(900px_500px_at_88%_-10%,rgba(14,165,233,0.16),transparent_65%),radial-gradient(760px_460px_at_0%_0%,rgba(59,130,246,0.12),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_right,rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-[size:28px_28px] [mask-image:radial-gradient(ellipse_at_top,black,transparent_78%)]" />

      <main className="mx-auto max-w-4xl px-6 py-20 md:px-10 md:py-24">
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-[11px] font-semibold tracking-[0.02em] text-slate-800 shadow-[0_10px_24px_-18px_rgba(15,23,42,0.28)]">
          <Gift className="h-3.5 w-3.5" />
          ADMIN GIFT CREDITS
        </div>

        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-[26px] font-extrabold tracking-tight text-neutral-950 sm:text-[32px]">
              무료 크레딧 선물 지급
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-neutral-600 sm:text-base">
              관리자 권한으로 특정 사용자에게 무료 크레딧을 지급해요. 지급 시
              <code className="mx-1 rounded bg-slate-100 px-1 py-0.5 text-[12px]">profiles.credits_free</code>,
              <code className="mx-1 rounded bg-slate-100 px-1 py-0.5 text-[12px]">credit_transactions</code>,
              <code className="mx-1 rounded bg-slate-100 px-1 py-0.5 text-[12px]">notifications</code>
              가 함께 기록돼요.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href={pathname.replace(/\/credits\/gift$/, "") || "/admin"}
              className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-neutral-800 transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              관리자 홈
            </Link>
            <Link
              href={pathname.replace(/\/credits\/gift$/, "/refund")}
              className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-neutral-800 transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              환불 화면
            </Link>
          </div>
        </div>

        <section className="mt-8 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <form
            onSubmit={handleSubmit}
            className="rounded-[28px] border border-slate-300 bg-white/92 p-6 shadow-[0_18px_50px_-30px_rgba(15,23,42,0.35)]"
          >
            <h2 className="text-lg font-extrabold tracking-tight text-neutral-950">
              지급 정보 입력
            </h2>
            <p className="mt-1 text-sm leading-6 text-neutral-600">
              이메일 기준으로 대상 사용자를 찾아 free credits를 지급합니다.
            </p>

            <div className="mt-5 space-y-4">
              <label className="block">
                <div className="text-sm font-semibold text-neutral-800">사용자 이메일</div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="user@example.com"
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                />
              </label>

              <label className="block">
                <div className="text-sm font-semibold text-neutral-800">지급할 free credits</div>
                <input
                  type="number"
                  min={1}
                  max={10000}
                  required
                  value={credits}
                  onChange={(event) => setCredits(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                />
              </label>

              <label className="block">
                <div className="text-sm font-semibold text-neutral-800">메모</div>
                <textarea
                  value={memo}
                  onChange={(event) => setMemo(event.target.value)}
                  rows={4}
                  placeholder="예: CS 보상, 운영 이벤트, 수동 지급 사유"
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                />
              </label>
            </div>

            {errorMessage ? (
              <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                <div className="flex items-start gap-2">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              </div>
            ) : null}

            <div className="mt-6 flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-500">
                  이번 지급
                </div>
                <div className="mt-1 text-lg font-extrabold tracking-tight text-neutral-950">
                  {Number.isFinite(parsedCredits) ? parsedCredits.toLocaleString() : 0} free credits
                </div>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className={cn(
                  "inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium text-white transition-all",
                  submitting
                    ? "cursor-not-allowed bg-slate-400"
                    : "bg-slate-900 hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-md"
                )}
              >
                {submitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Gift className="h-4 w-4" />}
                선물 크레딧 지급
              </button>
            </div>
          </form>

          <section className="rounded-[28px] border border-slate-300 bg-white/92 p-6 shadow-[0_18px_50px_-30px_rgba(15,23,42,0.35)]">
            <h2 className="text-lg font-extrabold tracking-tight text-neutral-950">
              최근 지급 결과
            </h2>
            <p className="mt-1 text-sm leading-6 text-neutral-600">
              성공하면 여기에서 잔액과 트랜잭션/알림 기록 정보를 바로 확인할 수 있어요.
            </p>

            {result ? (
              <div className="mt-5 space-y-3">
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                    <div>
                      <div className="font-semibold">지급이 완료되었어요.</div>
                      <div className="mt-1">
                        {result.email} 에게 {result.grantedCredits.toLocaleString()} free credits를 지급했어요.
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                    <div className="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-500">
                      Free balance after
                    </div>
                    <div className="mt-1 text-lg font-extrabold text-neutral-950">
                      {result.balanceFreeAfter.toLocaleString()}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                    <div className="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-500">
                      Total balance after
                    </div>
                    <div className="mt-1 text-lg font-extrabold text-neutral-950">
                      {result.balanceTotalAfter.toLocaleString()}
                    </div>
                  </div>
                </div>

                <dl className="space-y-3 text-sm text-neutral-700">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                    <dt className="font-semibold text-neutral-900">transactionId</dt>
                    <dd className="mt-1 break-all">{result.transactionId}</dd>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                    <dt className="font-semibold text-neutral-900">notificationId</dt>
                    <dd className="mt-1 break-all">{result.notificationId}</dd>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                    <dt className="font-semibold text-neutral-900">지급 시각</dt>
                    <dd className="mt-1">{formatDateTime(result.transactionCreatedAt)}</dd>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                    <dt className="font-semibold text-neutral-900">메모</dt>
                    <dd className="mt-1">{result.memo ?? "-"}</dd>
                  </div>
                </dl>
              </div>
            ) : (
              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-5 text-sm text-neutral-500">
                아직 지급 결과가 없어요. 위 폼에서 이메일과 크레딧 수를 입력해 선물 지급을 실행해 주세요.
              </div>
            )}
          </section>
        </section>
      </main>
    </div>
  );
}
