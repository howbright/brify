"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

type ConfirmState = "loading" | "success" | "error";

export default function BillingTossSuccessPage() {
  const locale = useLocale();
  const t = useTranslations("BillingTossSuccessPage");
  const searchParams = useSearchParams();
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
      setMessage(t("missingData"));
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
          data.alreadyConfirmed
            ? t("alreadyConfirmed")
            : t("chargedCredits", { credits: data.chargedCredits ?? 0 })
        );
      } catch (error) {
        if (cancelled) return;
        setState("error");
        setMessage(
          error instanceof Error
            ? error.message
            : t("confirmError")
        );
      }
    };

    void confirmPayment();

    return () => {
      cancelled = true;
    };
  }, [amount, orderId, paymentKey, t]);

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-2xl items-center justify-center px-6 py-16">
      <div className="w-full rounded-3xl border border-slate-300 bg-white p-6 shadow-sm dark:border-white/12 dark:bg-slate-950">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          {state === "loading"
            ? t("titleLoading")
            : state === "success"
              ? t("titleSuccess")
              : t("titleError")}
        </h1>

        <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
          {message || t("pleaseWait")}
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={historyHref}
            className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            {t("viewHistory")}
          </Link>
          <Link
            href={billingHref}
            className="inline-flex items-center justify-center rounded-2xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-white/15 dark:text-white dark:hover:bg-white/5"
          >
            {t("backToBilling")}
          </Link>
        </div>
      </div>
    </div>
  );
}
