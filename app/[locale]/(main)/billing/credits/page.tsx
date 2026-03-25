"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "@/components/SessionProvider";
import { useLocale, useTranslations } from "next-intl";

type CreditTx = {
  id: string;
  created_at: string;
  delta_total: number;
  delta_paid: number;
  delta_free: number;
  balance_total_after: number;
  balance_paid_after: number;
  balance_free_after: number;
  source: "lemon_squeezy" | "toss" | "system" | "admin" | "migration";
  tx_type: "purchase" | "spend" | "bonus" | "refund" | "adjustment" | "expire";
  reason: string | null;
};

type CreditHistoryResponse = {
  summary: {
    currentPaid: number;
    currentFree: number;
    currentTotal: number;
  };
  transactions: CreditTx[];
};

function formatDate(iso: string, locale: string) {
  try {
    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function DeltaBadge({ delta }: { delta: number }) {
  const positive = delta > 0;
  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
        positive
          ? "border-emerald-500/50 bg-emerald-50 text-emerald-700 dark:border-emerald-400/50 dark:bg-emerald-950/40 dark:text-emerald-200"
          : "border-rose-500/50 bg-rose-50 text-rose-700 dark:border-rose-400/50 dark:bg-rose-950/40 dark:text-rose-200",
      ].join(" ")}
    >
      {positive ? "+" : ""}
      {delta.toLocaleString()}
    </span>
  );
}

export default function BillingCreditsPage() {
  const { session } = useSession();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("BillingCreditsPage");

  const [data, setData] = useState<CreditHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) {
      router.push(`/${locale}/login?next=${encodeURIComponent(`/${locale}/billing/credits`)}`);
    }
  }, [session, router, locale]);

  useEffect(() => {
    if (!session) return;

    let cancelled = false;

    const fetchHistory = async () => {
      try {
        const res = await fetch("/api/billing/credits", {
          method: "GET",
          cache: "no-store",
        });

        if (res.status === 401) {
          router.push(`/${locale}/login?next=${encodeURIComponent(`/${locale}/billing/credits`)}`);
          return;
        }

        if (!res.ok) {
          throw new Error("Failed to load credit history");
        }

        const json = (await res.json()) as CreditHistoryResponse;
        if (!cancelled) {
          setData(json);
        }
      } catch (error) {
        console.error(error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void fetchHistory();

    return () => {
      cancelled = true;
    };
  }, [session, router, locale]);

  const rows = useMemo(() => data?.transactions ?? [], [data]);

  const billingHref = `/${locale}/billing`;
  const paymentHistoryHref = `/${locale}/billing/history`;

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-[#f4f6fb] dark:bg-[#020617]">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(900px_500px_at_85%_-10%,rgb(var(--hero-a)_/_0.22),transparent_65%),radial-gradient(700px_420px_at_5%_0%,rgb(var(--hero-b)_/_0.20),transparent_60%)] dark:hidden" />
      <div className="pointer-events-none absolute inset-0 -z-10 hidden dark:block bg-[linear-gradient(180deg,#0a0f1c_0%,#05070e_55%,#030408_100%)]" />

      <header className="mx-auto max-w-5xl px-6 pt-24 md:px-10 md:pt-28">
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-[11px] font-semibold tracking-[0.02em] text-slate-800 shadow-[0_10px_24px_-18px_rgba(15,23,42,0.28)] dark:border-slate-400/55 dark:bg-slate-900 dark:text-slate-100">
          <span className="inline-block h-2 w-2 rounded-full bg-blue-500 dark:bg-blue-400" />
          {t("badge")}
        </div>

        <div className="mt-1.5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-[20px] font-extrabold tracking-tight text-neutral-900 dark:text-white sm:text-[24px] md:text-[28px]">
              {t("title")}
            </h1>
            <p className="mt-1.5 max-w-xl text-sm text-neutral-700 dark:text-neutral-300 md:text-base">
              {t("subtitle")}
            </p>
          </div>

          <div className="mt-3 flex justify-start gap-2 md:mt-0 md:justify-end">
            <Link
              href={paymentHistoryHref}
              className="inline-flex items-center justify-center rounded-2xl border border-slate-400 bg-white/80 px-4 py-2 text-xs font-medium text-neutral-900 transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-slate-400/55 dark:bg-black/40 dark:text-neutral-100 sm:text-sm"
            >
              {t("buttons.paymentHistory")}
            </Link>
            <Link
              href={billingHref}
              className="inline-flex items-center justify-center rounded-2xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-medium text-white transition-all hover:-translate-y-0.5 hover:bg-slate-700 hover:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:text-white sm:text-sm"
            >
              {t("buttons.backToBilling")}
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 pb-24 md:px-10">
        <section className="mt-8">
          <div className="mb-5">
            <h2 className="flex items-center gap-3 text-[18px] font-extrabold tracking-tight text-neutral-900 dark:text-neutral-50 md:text-[22px]">
              <span className="inline-block h-3 w-3 rounded-full bg-blue-600 shadow-[0_0_0_5px_rgba(59,130,246,0.12)] dark:bg-blue-300 dark:shadow-[0_0_0_5px_rgba(96,165,250,0.16)]" />
              {t("summary.title")}
            </h2>
          </div>

          <div className="rounded-3xl border border-slate-400 bg-white/90 px-5 py-4 dark:border-slate-400/55 dark:bg-[#050816] dark:ring-1 dark:ring-white/5 sm:px-6 sm:py-5">
            <div className="flex flex-wrap gap-2 text-xs sm:text-sm">
              <div className="inline-flex flex-col rounded-2xl border border-slate-400 bg-white px-3 py-2 dark:border-slate-400/55 dark:bg-black/70">
                <span className="text-[11px] text-neutral-500 dark:text-neutral-400">{t("summary.total")}</span>
                <span className="mt-0.5 text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                  {(data?.summary.currentTotal ?? 0).toLocaleString()} {t("summary.unit")}
                </span>
              </div>
              <div className="inline-flex flex-col rounded-2xl border border-slate-400 bg-white px-3 py-2 dark:border-slate-400/55 dark:bg-black/70">
                <span className="text-[11px] text-neutral-500 dark:text-neutral-400">{t("summary.paid")}</span>
                <span className="mt-0.5 text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                  {(data?.summary.currentPaid ?? 0).toLocaleString()} {t("summary.unit")}
                </span>
              </div>
              <div className="inline-flex flex-col rounded-2xl border border-slate-400 bg-white px-3 py-2 dark:border-slate-400/55 dark:bg-black/70">
                <span className="text-[11px] text-neutral-500 dark:text-neutral-400">{t("summary.free")}</span>
                <span className="mt-0.5 text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                  {(data?.summary.currentFree ?? 0).toLocaleString()} {t("summary.unit")}
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8">
          <div className="mb-5">
            <h2 className="flex items-center gap-3 text-[18px] font-extrabold tracking-tight text-neutral-900 dark:text-neutral-50 md:text-[22px]">
              <span className="inline-block h-3 w-3 rounded-full bg-blue-600 shadow-[0_0_0_5px_rgba(59,130,246,0.12)] dark:bg-blue-300 dark:shadow-[0_0_0_5px_rgba(96,165,250,0.16)]" />
              {t("list.title")}
            </h2>
          </div>

          <div className="rounded-3xl border border-slate-400 bg-white/95 px-4 py-4 dark:border-slate-400/55 dark:bg-[#050816] dark:ring-1 dark:ring-white/5 sm:px-5 sm:py-5">
            {loading ? (
              <div className="py-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
                {t("list.loading")}
              </div>
            ) : rows.length === 0 ? (
              <div className="py-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
                {t("list.empty")}
              </div>
            ) : (
              <div className="divide-y divide-slate-400 dark:divide-slate-400/35">
                {rows.map((row) => (
                  <article key={row.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                          {t(`types.${row.tx_type}`)}
                        </span>
                        <DeltaBadge delta={row.delta_total} />
                      </div>
                      <div className="text-[11px] text-neutral-500 dark:text-neutral-400 sm:text-xs">
                        {formatDate(row.created_at, locale)} · {t(`sources.${row.source}`)}
                      </div>
                      {row.reason ? (
                        <div className="text-xs text-neutral-600 dark:text-neutral-300">
                          {row.reason}
                        </div>
                      ) : null}
                    </div>

                    <div className="text-right text-xs text-neutral-700 dark:text-neutral-200 sm:text-sm">
                      <div className="font-semibold">
                        {t("list.balanceAfter", {
                          total: row.balance_total_after.toLocaleString(),
                          unit: t("summary.unit"),
                        })}
                      </div>
                      <div className="mt-0.5 text-[11px] text-neutral-500 dark:text-neutral-400">
                        {t("list.breakdown", {
                          paid: row.balance_paid_after.toLocaleString(),
                          free: row.balance_free_after.toLocaleString(),
                        })}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
