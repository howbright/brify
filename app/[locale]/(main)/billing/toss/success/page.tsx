"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";

type ConfirmState = "loading" | "success" | "error";

export default function BillingTossSuccessPage() {
  const locale = useLocale();
  const searchParams = useSearchParams();
  const isKorean = locale === "ko";
  const [state, setState] = useState<ConfirmState>("loading");
  const [message, setMessage] = useState<string>("");

  const paymentKey = searchParams.get("paymentKey");
  const orderId = searchParams.get("orderId");
  const amount = searchParams.get("amount");

  const billingHref = useMemo(() => `/${locale}/billing`, [locale]);
  const historyHref = useMemo(() => `/${locale}/billing/history`, [locale]);

  useEffect(() => {
    if (!paymentKey || !orderId || !amount) {
      setState("error");
      setMessage(
        isKorean
          ? "결제 완료 정보를 확인할 수 없어요."
          : "Payment completion data is missing."
      );
      return;
    }

    let cancelled = false;

    const confirmPayment = async () => {
      try {
        const res = await fetch("/api/payments/confirm/toss", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            paymentKey,
            orderId,
            amount,
          }),
        });

        const data = (await res.json()) as {
          error?: string;
          alreadyConfirmed?: boolean;
          chargedCredits?: number;
        };

        if (!res.ok) {
          throw new Error(data.error || "Failed to confirm payment");
        }

        if (cancelled) return;

        setState("success");
        setMessage(
          isKorean
            ? data.alreadyConfirmed
              ? "이미 승인된 결제예요. 결제 내역에서 확인할 수 있어요."
              : `${data.chargedCredits ?? 0}크레딧이 충전되었어요.`
            : data.alreadyConfirmed
              ? "This payment was already confirmed. You can check it in billing history."
              : `${data.chargedCredits ?? 0} credits have been added to your balance.`
        );
      } catch (error) {
        if (cancelled) return;
        setState("error");
        setMessage(
          error instanceof Error
            ? error.message
            : isKorean
              ? "결제 승인 중 문제가 발생했어요."
              : "Something went wrong while confirming the payment."
        );
      }
    };

    void confirmPayment();

    return () => {
      cancelled = true;
    };
  }, [amount, isKorean, orderId, paymentKey]);

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-2xl items-center justify-center px-6 py-16">
      <div className="w-full rounded-3xl border border-slate-300 bg-white p-6 shadow-sm dark:border-white/12 dark:bg-slate-950">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          {state === "loading"
            ? isKorean
              ? "결제를 확인하고 있어요."
              : "Confirming your payment."
            : state === "success"
              ? isKorean
                ? "결제가 완료되었어요."
                : "Payment completed."
              : isKorean
                ? "결제 확인이 완료되지 않았어요."
                : "Payment confirmation failed."}
        </h1>

        <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
          {message ||
            (isKorean
              ? "잠시만 기다려 주세요."
              : "Please wait a moment.")}
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={historyHref}
            className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            {isKorean ? "결제 내역 보기" : "View billing history"}
          </Link>
          <Link
            href={billingHref}
            className="inline-flex items-center justify-center rounded-2xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-white/15 dark:text-white dark:hover:bg-white/5"
          >
            {isKorean ? "크레딧 충전으로 돌아가기" : "Back to billing"}
          </Link>
        </div>
      </div>
    </div>
  );
}
