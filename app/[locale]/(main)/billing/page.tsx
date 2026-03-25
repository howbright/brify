// app/[locale]/billing/page.tsx
"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import Script from "next/script";
import { useSession } from "@/components/SessionProvider";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  getBillingCatalog,
  type BillingCatalogItem,
  type BillingCurrency,
} from "@/app/lib/billing/catalog";

type BalanceResponse = {
  total: number;
  paid: number;
  free: number;
};

type TossPaymentsInstance = {
  payment: (params: { customerKey: string }) => {
    requestPayment: (params: {
      method: "CARD";
      amount: { currency: "KRW"; value: number };
      orderId: string;
      orderName: string;
      successUrl: string;
      failUrl: string;
      customerEmail?: string;
    }) => void;
  };
};

declare global {
  interface Window {
    TossPayments?: (clientKey: string) => TossPaymentsInstance;
  }
}

function formatPrice(amount: number, currency: BillingCurrency) {
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

export default function BillingPage() {
  const t = useTranslations("BillingPage");
  const { session } = useSession();
  const router = useRouter();
  const locale = useLocale();
  const isKorean = locale === "ko";
  const [balance, setBalance] = useState<BalanceResponse | null>(null);
  const [openFaq, setOpenFaq] = useState<"q2" | "q3" | "q4" | null>(null);

  useEffect(() => {
    if (!session) {
      router.push(`/${locale}/login?next=${encodeURIComponent(`/${locale}/billing`)}`);
    }
  }, [session, router, locale]);

  useEffect(() => {
    if (!session) return;

    let cancelled = false;

    const fetchBalance = async () => {
      try {
        const res = await fetch("/api/billing/balance", {
          method: "GET",
          cache: "no-store",
        });

        if (res.status === 401) {
          router.push(`/${locale}/login?next=${encodeURIComponent(`/${locale}/billing`)}`);
          return;
        }

        if (!res.ok) {
          console.error("Failed to load balance");
          return;
        }

        const data: BalanceResponse = await res.json();
        if (!cancelled) {
          setBalance(data);
        }
      } catch (err) {
        console.error("Error while loading balance:", err);
      }
    };

    fetchBalance();

    return () => {
      cancelled = true;
    };
  }, [session, router, locale]);

  const packs = useMemo(() => getBillingCatalog(locale), [locale]);

  const refundPolicyHref = `/${locale}/refund-policy`;
  const billingHistoryHref = `/${locale}/billing/history`;
  const creditHistoryHref = `/${locale}/billing/credits`;
  const faqItems = [
    { id: "q2" as const, q: t("faq.q2"), a: t("faq.a2") },
    { id: "q3" as const, q: t("faq.q3"), a: t("faq.a3") },
    { id: "q4" as const, q: t("faq.q4"), a: t("faq.a4") },
  ];

  return (
    <>
      {!isKorean ? (
        <Script
          src="https://assets.lemonsqueezy.com/lemon.js"
          strategy="afterInteractive"
        />
      ) : (
        <Script
          src="https://js.tosspayments.com/v2/standard"
          strategy="afterInteractive"
        />
      )}

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

        {/* 상단 헤더 영역 */}
        <header className="mx-auto max-w-5xl px-6 md:px-10 pt-24 md:pt-28">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-[11px] font-semibold tracking-[0.02em] text-slate-800 shadow-[0_10px_24px_-18px_rgba(15,23,42,0.28)] dark:border-white/14 dark:bg-slate-900 dark:text-slate-100 dark:shadow-[0_16px_34px_-24px_rgba(0,0,0,0.7)]">
            <span className="inline-block h-2 w-2 rounded-full bg-blue-500 dark:bg-blue-400" />
            {t("badge")}
          </div>

          <div className="mt-1.5">
            <div>
              <h1 className="text-[20px] sm:text-[24px] md:text-[28px] font-extrabold tracking-tight text-neutral-900 dark:text-white dark:[text-shadow:0_1px_12px_rgba(0,0,0,0.45)]">
                {t("title")}
              </h1>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-5xl px-6 md:px-10 pb-24">
          {/* 잔액 카드 */}
          <section className="mt-8">
            <div className="mb-5">
              <h2 className="flex items-center gap-3 text-[18px] md:text-[22px] font-extrabold tracking-tight text-neutral-900 dark:text-neutral-50">
                <span className="inline-block h-3 w-3 rounded-full bg-blue-600 shadow-[0_0_0_5px_rgba(59,130,246,0.12)] dark:bg-blue-300 dark:shadow-[0_0_0_5px_rgba(96,165,250,0.16)]" />
                {t("balance.label")}
              </h2>
            </div>
            <div
              className="
                relative overflow-hidden
                rounded-3xl border border-blue-300
                bg-[linear-gradient(180deg,#eef5ff_0%,#f7fbff_100%)]
                shadow-[0_26px_60px_-28px_rgba(15,23,42,0.22)]
                ring-1 ring-blue-200/90
                dark:border-[rgb(var(--hero-b))]/35
                dark:bg-[linear-gradient(180deg,rgba(59,130,246,0.12),rgba(15,23,42,0.9))]
                dark:ring-1 dark:ring-[rgb(var(--hero-b))]/20
                dark:shadow-[0_28px_90px_-55px_rgba(0,0,0,0.85)]
                px-5 py-5 sm:px-6 sm:py-6
              "
            >
              <div
                aria-hidden
                className="
                  pointer-events-none absolute inset-y-0 right-[-40px] w-48
                  bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.28),transparent_60%)]
                  dark:bg-[radial-gradient(circle_at_center,rgba(129,140,248,0.32),transparent_60%)]
                "
              />

              <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-2">
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="leading-none text-[38px] sm:text-[48px] font-extrabold tracking-tight text-neutral-900 dark:text-white">
                      {balance === null ? "…" : balance.total.toLocaleString()}
                    </span>
                    <span className="leading-none text-[18px] font-semibold text-neutral-500 dark:text-white/72">
                      {t("balance.unit")}
                    </span>
                  </div>

	                  {balance && (
	                    <div
	                      className="
	      inline-flex flex-wrap items-center gap-1.5
	      rounded-full border border-blue-300 bg-[linear-gradient(180deg,#dbeafe_0%,#bfdbfe_100%)] px-2.5 py-1
	      text-[12px] sm:text-[13px] text-blue-900
	      shadow-[0_10px_24px_-18px_rgba(37,99,235,0.35)]
	      dark:border-blue-400/24 dark:bg-[linear-gradient(180deg,rgba(59,130,246,0.22),rgba(30,41,59,0.92))] dark:text-blue-100
	    "
	                    >
                      <span className="font-semibold">
                        {t("balance.paidLabel")}
                      </span>
                      <span>{balance.paid.toLocaleString()}</span>

	                      <span className="mx-1 h-3 w-px bg-blue-700/20 dark:bg-white/18" />

                      <span className="font-semibold">
                        {t("balance.freeLabel")}
                      </span>
                      <span>{balance.free.toLocaleString()}</span>
                    </div>
                  )}

                </div>

                <div className="flex flex-col gap-2 sm:items-end min-w-[220px]">
	                  <Link
	                    href={billingHistoryHref}
	                    className="
	      inline-flex w-full sm:w-auto items-center justify-center
	      rounded-2xl px-5 py-3
	      text-sm font-semibold
	      text-white
	      bg-slate-800
	      border border-slate-700
	      transition-all
	      hover:scale-[1.02] hover:shadow-sm hover:bg-slate-700
	      active:scale-[0.99]
	      focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20
	    "
	                  >
                    {t("balance.historyButton")}
                  </Link>

                  <Link
                    href={creditHistoryHref}
                    className="
      inline-flex w-full sm:w-auto items-center justify-center
      rounded-2xl px-5 py-3
      text-sm font-semibold
      text-white
      bg-slate-700
      border border-slate-600
      transition-all
      hover:scale-[1.02] hover:shadow-sm hover:bg-slate-600
      active:scale-[0.99]
      focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20
    "
                  >
                    {t("balance.creditHistoryButton")}
                  </Link>

                  <Link
                    href="/missions"
                    className="
      group inline-flex w-full sm:w-auto items-center justify-center gap-1.5
      px-1 py-1
      text-[13px] font-medium
      text-emerald-700 dark:text-emerald-300
      transition-colors
      hover:text-emerald-800 dark:hover:text-emerald-200
      focus:outline-none
                    "
                  >
                    <span className="whitespace-nowrap">
                      {t("bullets.missionCredits")}
                    </span>

                    <span
                      aria-hidden
                      className="
        inline-block h-3.5 w-3.5
        [clip-path:polygon(25%_15%,85%_50%,25%_85%)]
        bg-current
        transition-transform group-hover:translate-x-0.5
      "
                    />
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* 패키지 카드 섹션 */}
          <section id="packs" className="mt-10">
            <div className="mb-5">
              <div>
                <h2 className="flex items-center gap-3 text-[18px] md:text-[22px] font-extrabold tracking-tight text-neutral-900 dark:text-neutral-50">
                  <span className="inline-block h-3 w-3 rounded-full bg-blue-600 shadow-[0_0_0_5px_rgba(59,130,246,0.12)] dark:bg-blue-300 dark:shadow-[0_0_0_5px_rgba(96,165,250,0.16)]" />
                  {t("packs.title")}
                </h2>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {packs.map((pack) => (
                <CreditPackCard
                  key={pack.id}
                  pack={pack}
                  userId={session?.user?.id ?? null}
                  userEmail={session?.user?.email ?? null}
                  locale={locale}
                />
              ))}
            </div>

            <div className="mt-4 text-right text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
              <p>
                {t("packs.info.refund")}{" "}
                <Link
                  href={refundPolicyHref}
                  className="font-semibold text-blue-700 hover:underline dark:text-[rgb(var(--hero-b))]"
                >
                  {t("packs.info.refundPolicy")}
                </Link>
              </p>
            </div>
          </section>

          {/* FAQ 섹션 */}
          <section className="mt-12">
            <h3 className="text-base md:text-lg font-semibold text-neutral-700 dark:text-neutral-300">
              {t("faq.title")}
            </h3>
            <div className="mt-4 space-y-3">
              {faqItems.map((item) => (
                <FaqAccordionItem
                  key={item.id}
                  q={item.q}
                  a={item.a}
                  open={openFaq === item.id}
                  onToggle={() =>
                    setOpenFaq((prev) => (prev === item.id ? null : item.id))
                  }
                />
              ))}
            </div>
          </section>
        </main>
      </div>
    </>
  );
}

function CreditPackCard({
  pack,
  userId,
  userEmail,
  locale,
}: {
  pack: BillingCatalogItem;
  userId: string | null;
  userEmail: string | null;
  locale: string;
}) {
  const t = useTranslations("BillingPage");
  const { credits, price, currency, checkoutUrl, popular, starter, provider } = pack;
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleBuy = async () => {
    if (!userId) {
      router.push(`/${locale}/login?next=${encodeURIComponent(`/${locale}/billing`)}`);
      return;
    }

    if (provider === "toss") {
      const tossClientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;

      if (!tossClientKey) {
        toast.error("NEXT_PUBLIC_TOSS_CLIENT_KEY가 설정되지 않았어요.");
        return;
      }

      if (typeof window === "undefined" || !window.TossPayments) {
        toast.error("토스 결제 SDK를 아직 불러오지 못했어요.");
        return;
      }

      setIsSubmitting(true);

      try {
        const res = await fetch("/api/payments/create-order", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ packId: pack.id }),
        });

        const data = (await res.json()) as {
          orderId?: string;
          amount?: number;
          orderName?: string;
          error?: string;
        };

        if (!res.ok || !data.orderId || !data.amount || !data.orderName) {
          throw new Error(data.error || "Failed to create order");
        }

        const tossPayments = window.TossPayments(tossClientKey);
        const payment = tossPayments.payment({
          customerKey: userId,
        });

        payment.requestPayment({
          method: "CARD",
          amount: {
            currency: "KRW",
            value: data.amount,
          },
          orderId: data.orderId,
          orderName: data.orderName,
          successUrl: `${window.location.origin}/${locale}/billing/toss/success`,
          failUrl: `${window.location.origin}/${locale}/billing/toss/fail`,
          customerEmail: userEmail ?? undefined,
        });
      } catch (error) {
        console.error("Failed to open Toss payment window:", error);
        toast.error("토스 결제를 준비하는 중 문제가 발생했어요.");
        setIsSubmitting(false);
      }

      return;
    }

    if (!checkoutUrl) {
      toast.error("Checkout URL이 설정되지 않았어요.");
      return;
    }

    const url = new URL(checkoutUrl);

    url.searchParams.set("checkout[custom][user_id]", userId);
    url.searchParams.set("checkout[custom][pack_code]", pack.id);

    url.searchParams.set(
      "checkout[product_options][redirect_url]",
      `${window.location.origin}/${locale}/billing?success=1`
    );

    window.open(url.toString(), "_blank", "noopener,noreferrer");
  };

  const unit = price / credits;
  const isLargePack = !popular && !starter && credits >= 300;

  return (
    <div
      className={[
        "group relative flex h-full flex-col rounded-2xl border p-4 shadow-sm transition-all duration-300 ease-out will-change-transform",
        "text-neutral-900 hover:-translate-y-1 hover:shadow-[0_24px_44px_-24px_rgba(15,23,42,0.34)] hover:rotate-[-0.4deg] dark:hover:shadow-[0_28px_52px_-28px_rgba(37,99,235,0.42)]",
        popular
          ? "border-[var(--color-primary-500)] bg-[linear-gradient(180deg,#ffffff_0%,#f5f9ff_100%)] shadow-[0_26px_60px_-34px_rgba(37,99,235,0.34)] hover:border-[var(--color-primary-400)] dark:border-blue-400/35 dark:bg-[linear-gradient(180deg,rgba(37,99,235,0.16),rgba(15,23,42,0.94))] dark:text-[var(--color-card-foreground,#e5e7eb)]"
          : "border-slate-400 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] shadow-[0_22px_48px_-34px_rgba(15,23,42,0.22)] hover:border-slate-500 dark:border-white/12 dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(15,23,42,0.94))] dark:text-[var(--color-card-foreground,#e5e7eb)] dark:hover:border-white/20",
      ].join(" ")}
    >
      <div
        aria-hidden
        className={[
          "pointer-events-none absolute inset-x-6 top-0 h-px opacity-0 transition-opacity duration-300 group-hover:opacity-100",
          popular
            ? "bg-gradient-to-r from-transparent via-blue-400 to-transparent"
            : "bg-gradient-to-r from-transparent via-slate-300 to-transparent dark:via-slate-500",
        ].join(" ")}
      />
      <div
        aria-hidden
        className={[
          "pointer-events-none absolute inset-x-4 top-0 h-20 rounded-t-[18px] opacity-90",
          popular
            ? "bg-[radial-gradient(60%_100%_at_50%_0%,rgba(59,130,246,0.16),transparent_74%)] dark:bg-[radial-gradient(60%_100%_at_50%_0%,rgba(96,165,250,0.18),transparent_76%)]"
            : "bg-[radial-gradient(60%_100%_at_50%_0%,rgba(148,163,184,0.10),transparent_74%)] dark:bg-[radial-gradient(60%_100%_at_50%_0%,rgba(255,255,255,0.08),transparent_76%)]",
        ].join(" ")}
      />

      <div className="mb-1 h-6">
      {(popular || starter || isLargePack) && (
        <div
          className={[
            "inline-flex items-center gap-1 self-start rounded-full border px-3 py-1 text-xs font-bold transition-all duration-300 group-hover:-translate-y-0.5 group-hover:scale-[1.03]",
            starter && !popular ? "opacity-85" : "",
            popular
              ? "border-blue-500 bg-blue-600 text-white shadow-[0_12px_24px_-12px_rgba(37,99,235,0.6)] dark:border-blue-300 dark:bg-blue-500"
              : "",
          ].join(" ")}
          style={
            popular
              ? undefined
              : {
                  borderColor:
                    "color-mix(in_srgb,var(--color-primary-500),transparent 70%)",
                  background:
                    "color-mix(in_srgb,var(--color-primary-500),white 85%)",
                  color: "var(--color-primary-700)",
                }
          }
        >
          {popular
            ? t("card.badge.popular")
            : starter
            ? t("card.badge.starter")
            : t("card.badge.large")}
        </div>
      )}
      </div>
      <div className="relative text-[28px] font-bold tracking-tight text-neutral-900 dark:text-[var(--color-foreground,#e5e7eb)] md:text-[34px]">
        {credits.toLocaleString()}{" "}
        <span className="text-xl font-semibold text-neutral-600 dark:text-[var(--color-muted-foreground,#cbd5e1)]">
          {t("card.creditsUnit")}
        </span>
      </div>

      <div className="mt-2 text-2xl font-bold text-neutral-900 dark:text-[var(--color-card-foreground,#e5e7eb)] md:text-[28px]">
        {formatPrice(price, currency)}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <div className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-700 transition-transform duration-300 group-hover:-translate-y-0.5 dark:border-blue-400/20 dark:bg-blue-500/10 dark:text-blue-200">
          {t("card.unitPricePrefix")} {formatPrice(unit, currency)} /{" "}
          {t("card.creditsUnit")}
        </div>
      </div>

      <div className="mt-5 flex-1" />

	      <button
	        onClick={handleBuy}
	        disabled={isSubmitting}
	        className="
	          block w-full cursor-pointer rounded-[var(--radius-lg)] px-4 py-3 text-center text-[16px] font-semibold shadow-sm
	          bg-slate-800 text-white
	          hover:bg-blue-600
	          dark:bg-slate-800 dark:hover:bg-blue-600 dark:text-white
	          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring,#93c5fd)]
	          disabled:cursor-not-allowed disabled:opacity-65
	        "
	      >
        {isSubmitting ? t("card.loading") : t("card.cta")}
      </button>
    </div>
  );
}

function FaqAccordionItem({
  q,
  a,
  open,
  onToggle,
}: {
  q: string;
  a: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-400 bg-white/72 dark:border-white/12 dark:bg-black/28">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left"
      >
        <span className="flex items-center gap-2 font-medium text-neutral-800 dark:text-neutral-100">
          <span className="text-sm font-bold text-blue-700 dark:text-blue-300">Q</span>
          <span>{q}</span>
        </span>
        <span className="text-lg font-semibold leading-none text-neutral-400 dark:text-neutral-500">
          {open ? "−" : "+"}
        </span>
      </button>
      {open ? (
        <div className="border-t border-slate-300 px-4 py-3 text-sm text-neutral-600 dark:border-white/10 dark:text-neutral-300">
          {a}
        </div>
      ) : null}
    </div>
  );
}
