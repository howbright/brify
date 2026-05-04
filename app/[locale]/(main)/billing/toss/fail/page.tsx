"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";

type FailState = "loading" | "canceled" | "failed";

function isCanceled(code?: string | null, message?: string | null) {
  const normalizedMessage = (message ?? "").toLowerCase();
  return (
    code === "USER_CANCEL" ||
    code === "PAY_PROCESS_CANCELED" ||
    normalizedMessage.includes("cancel") ||
    normalizedMessage.includes("취소")
  );
}

export default function BillingTossFailPage() {
  const locale = useLocale();
  const t = useTranslations("BillingTossFailPage");
  const searchParams = useSearchParams();
  const [state, setState] = useState<FailState>("loading");

  const code = searchParams.get("code");
  const message = searchParams.get("message");
  const orderId = searchParams.get("orderId");

  const billingHref = useMemo(() => `/${locale}/billing`, [locale]);
  const historyHref = useMemo(() => `/${locale}/billing/history`, [locale]);

  useEffect(() => {
    const canceled = isCanceled(code, message);
    setState(canceled ? "canceled" : "failed");

    if (!orderId) return;

    let cancelled = false;

    (async () => {
      try {
        await fetch("/api/payments/fail/toss", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            orderId,
            code: code ?? undefined,
            message: message ?? undefined,
          }),
        });
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to sync Toss fail page status:", error);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [code, message, orderId]);

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-2xl items-center justify-center px-6 py-16">
      <div className="w-full rounded-3xl border border-slate-300 bg-white p-6 shadow-sm dark:border-white/12 dark:bg-slate-950">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          {state === "canceled"
            ? t("titleCanceled")
            : t("titleFailed")}
        </h1>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
          {state === "canceled"
            ? t("descCanceled")
            : t("descFailed")}
        </p>

        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
          <p>code: {code ?? "-"}</p>
          <p>message: {message ?? "-"}</p>
          <p>orderId: {orderId ?? "-"}</p>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={billingHref}
            className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            {t("backToBilling")}
          </Link>
          <Link
            href={historyHref}
            className="inline-flex items-center justify-center rounded-2xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-white/15 dark:text-white dark:hover:bg-white/5"
          >
            {t("viewHistory")}
          </Link>
        </div>
      </div>
    </div>
  );
}
