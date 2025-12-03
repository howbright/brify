// app/[locale]/billing/page.tsx
"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import Script from "next/script";
import { useSession } from "@/components/SessionProvider";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

type Currency = "krw" | "usd";

type CreditPack = {
  id: string;
  credits: number;
  price: number; // 원 또는 달러
  currency: Currency;
  checkoutUrl: string;
  popular?: boolean;
  starter?: boolean;
};

// 💳 결제 링크는 환경변수로 주입 (예시)
const PACKS_BY_CURRENCY: Record<Currency, CreditPack[]> = {
  krw: [
    {
      id: "50_kr",
      credits: 50,
      price: 3500, // 4,000원
      currency: "krw",
      starter: true,
      checkoutUrl: process.env.NEXT_PUBLIC_LEMON_CHECKOUT_50_KRW || "#",
    },
    {
      id: "150_kr",
      credits: 150,
      price: 9000, // 9,000원
      currency: "krw",
      popular: true,
      checkoutUrl: process.env.NEXT_PUBLIC_LEMON_CHECKOUT_150_KRW || "#",
    },
    {
      id: "300_kr",
      credits: 300,
      price: 15000, // 15,000원
      currency: "krw",
      checkoutUrl: process.env.NEXT_PUBLIC_LEMON_CHECKOUT_300_KRW || "#",
    },
  ],
  usd: [
    {
      id: "50_us",
      credits: 50,
      price: 3, // $3
      currency: "usd",
      starter: true,
      checkoutUrl: process.env.NEXT_PUBLIC_LEMON_CHECKOUT_50_USD || "#",
    },
    {
      id: "150_us",
      credits: 150,
      price: 7, // $7
      currency: "usd",
      popular: true,
      checkoutUrl: process.env.NEXT_PUBLIC_LEMON_CHECKOUT_150_USD || "#",
    },
    {
      id: "300_us",
      credits: 300,
      price: 12, // $12
      currency: "usd",
      checkoutUrl: process.env.NEXT_PUBLIC_LEMON_CHECKOUT_300_USD || "#",
    },
  ],
};

// 통화별 포맷터
function formatPrice(amount: number, currency: Currency) {
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
  const searchParams = useSearchParams();
  const locale = useLocale();
  const isKorean = locale === "ko";

  const currencyFromQuery = searchParams.get("currency");
  const initialCurrency: Currency =
    isKorean && currencyFromQuery === "krw" ? "krw" : "usd";

  const [currency, setCurrency] = useState<Currency>(initialCurrency);
  const [balance, setBalance] = useState<number | null>(null);

  // 로그인 안되면 /login 으로
  useEffect(() => {
    if (!session) {
      router.push("/login");
    }
  }, [session, router]);

  // TODO: 실제 크레딧 잔액 API 연동
  useEffect(() => {
    setTimeout(() => setBalance(42), 200);
  }, []);

  // locale이 한국어가 아니면 강제로 USD
  useEffect(() => {
    if (!isKorean && currency !== "usd") {
      setCurrency("usd");
    }
  }, [isKorean, currency]);

  const packs = useMemo(
    () =>
      [...PACKS_BY_CURRENCY[currency]].sort((a, b) => a.credits - b.credits),
    [currency]
  );

  const currencyLabel =
    currency === "krw"
      ? t("packs.summary.krw")
      : t("packs.summary.usd");

  const processorLabel =
    currency === "krw"
      ? t("packs.summary.processor.krw")
      : t("packs.summary.processor.usd");

  return (
    <>
      {/* LemonSqueezy 스크립트 (체크아웃용) */}
      <Script
        src="https://assets.lemonsqueezy.com/lemon.js"
        strategy="afterInteractive"
      />

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
        <header className="mx-auto max-w-5xl px-6 md:px-10 pt-20">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/70 px-3 py-1 text-[11px] font-medium text-neutral-700 shadow-sm backdrop-blur dark:bg-black/40 dark:border-white/15 dark:text-neutral-200">
            {t("badge")}
          </div>

          <div className="mt-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white dark:[text-shadow:0_1px_12px_rgba(0,0,0,0.45)]">
                {t("title")}
              </h1>
              <p className="mt-2 text-sm md:text-base text-neutral-700 dark:text-neutral-300 max-w-xl">
                {t("subtitle")}
              </p>
            </div>

            {/* 한국어일 때만 KRW / USD 토글 */}
            {isKorean && (
              <div className="mt-1 md:mt-0 flex justify-end">
                <div
                  className="
                    inline-flex items-center
                    rounded-full border border-white/70 bg-white/80
                    px-1.5 py-0.5 text-[11px]
                    shadow-sm backdrop-blur
                    dark:border-white/20 dark:bg-black/40
                  "
                >
                  <button
                    type="button"
                    onClick={() => setCurrency("krw")}
                    className={[
                      "px-2.5 py-0.5 rounded-full transition-all",
                      currency === "krw"
                        ? "bg-blue-600 text-white shadow"
                        : "text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100/80 dark:hover:bg-white/5",
                    ].join(" ")}
                  >
                    {t("currencyToggle.krw")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrency("usd")}
                    className={[
                      "px-2.5 py-0.5 rounded-full transition-all",
                      currency === "usd"
                        ? "bg-blue-600 text-white shadow"
                        : "text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100/80 dark:hover:bg-white/5",
                    ].join(" ")}
                  >
                    {t("currencyToggle.usd")}
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        <main className="mx-auto max-w-5xl px-6 md:px-10 pb-24">
          {/* 잔액 카드 */}
          <section className="mt-2">
            <div
              className="
                relative overflow-hidden
                rounded-3xl border border-neutral-200/80 dark:border-white/15
                bg-white/95 dark:bg-black/50
                backdrop-blur
                shadow-[0_18px_45px_-26px_rgba(15,23,42,0.20)]
                px-5 py-5 sm:px-6 sm:py-6
              "
            >
              {/* 오른쪽 배경 포인트 (살짝만) */}
              <div
                aria-hidden
                className="
                  pointer-events-none absolute inset-y-0 right-[-40px] w-48
                  bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.28),transparent_60%)]
                  dark:bg-[radial-gradient(circle_at_center,rgba(129,140,248,0.32),transparent_60%)]
                "
              />

              <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                {/* 왼쪽: 아이콘 + 숫자 + 간단 설명 */}
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 text-xs font-medium text-neutral-600 dark:text-neutral-300">
                    {/* 크레딧 코인 아이콘 */}
                    <span
                      className="
                        inline-flex h-7 w-7 items-center justify-center
                        rounded-full
                        bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500
                        text-[11px] font-semibold text-white
                        shadow-[0_4px_14px_rgba(37,99,235,0.55)]
                      "
                    >
                      CR
                    </span>
                    <span>{t("balance.label")}</span>
                  </div>

                  {/* 숫자 + '크레딧' 아래 정렬 */}
                  <div className="mt-1 flex items-end gap-2">
                    <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-50">
                      {balance === null ? "…" : balance.toLocaleString()}
                    </span>
                    <span className="text-sm font-medium text-neutral-500 dark:text-neutral-300 pb-1">
                      {t("balance.unit")}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300">
                    {t("balance.hintPrefix")}{" "}
                    <span className="font-semibold">
                      {t("balance.hintStrong")}
                    </span>
                  </p>
                </div>

                {/* 오른쪽: 액션 버튼 두 개 */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 min-w-[180px]">
                  <Link
                    href="/"
                    className="
                      inline-flex items-center justify-center rounded-2xl
                      border border-neutral-200/80 bg-white/90 px-4 py-2.5
                      text-sm font-medium text-neutral-900
                      hover:-translate-y-0.5 hover:shadow-md
                      transition-all
                      dark:border-white/20 dark:bg-black/70 dark:text-neutral-50
                    "
                  >
                    {t("balance.mainButton")}
                  </Link>
                  <a
                    href="#packs"
                    className="
                      inline-flex items-center justify-center rounded-2xl
                      px-4 py-2.5 text-sm font-semibold
                      bg-blue-600 text-white
                      hover:bg-blue-700
                      hover:-translate-y-0.5 hover:shadow-lg
                      active:translate-y-0
                      transition-all
                      dark:bg-[rgb(var(--hero-a))] dark:hover:bg-[rgb(var(--hero-b))]
                    "
                  >
                    {t("balance.chargeButton")}
                  </a>
                </div>
              </div>
            </div>
          </section>

          {/* 패키지 카드 섹션 */}
          <section id="packs" className="mt-10">
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-xl md:text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
                  {t("packs.title")}
                </h2>
                <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                  {t("packs.subtitle")}{" "}
                  <span className="font-semibold text-blue-700 dark:text-[rgb(var(--hero-b))]">
                    {t("packs.subtitleHighlight")}
                  </span>
                </p>
              </div>
              <div className="text-[11px] sm:text-xs text-neutral-500 dark:text-neutral-400">
                {t("packs.summary.prefix")}{" "}
                <span className="font-medium">{currencyLabel}</span>{" "}
                {t("packs.summary.middle")}{" "}
                <span className="font-medium">{processorLabel}</span>{" "}
                {t("packs.summary.suffix")}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {packs.map((pack) => (
                <CreditPackCard key={pack.id} pack={pack} />
              ))}
            </div>

            {/* 결제/환불 안내 */}
            <div
              className="
                mt-7 rounded-3xl border border-neutral-200/80 dark:border-white/15
                bg-white/80 backdrop-blur p-4 sm:p-5
                text-xs sm:text-sm text-neutral-700 space-y-1.5
                dark:bg-black/35 dark:text-neutral-200
              "
            >
              {currency === "usd" && (
                <p>{t("packs.info.usdFee")}</p>
              )}
              <p>{t("packs.info.instant")}</p>
              <p>{t("packs.info.refund")}</p>
            </div>
          </section>

          {/* 크레딧 사용 기준 */}
          <section className="mt-10">
            <div className="rounded-3xl border border-neutral-200/80 dark:border-white/15 bg-white/90 backdrop-blur p-4 sm:p-5 dark:bg-black/40">
              <h3 className="text-sm sm:text-base font-semibold text-neutral-900 dark:text-neutral-50">
                {t("usage.title")}
              </h3>
              <ul className="mt-2 space-y-1.5 text-xs sm:text-sm text-neutral-700 dark:text-neutral-200">
                <li>{t("usage.item1")}</li>
                <li>{t("usage.item2")}</li>
                <li>{t("usage.item3")}</li>
              </ul>
              <p className="mt-2 text-[11px] sm:text-xs text-neutral-500 dark:text-neutral-400">
                {t("usage.note")}
              </p>
            </div>
          </section>

          {/* FAQ 섹션 */}
          <section className="mt-12">
            <h3 className="text-lg md:text-xl font-semibold text-neutral-900 dark:text-neutral-50">
              {t("faq.title")}
            </h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <FaqItem q={t("faq.q1")} a={t("faq.a1")} />
              <FaqItem q={t("faq.q2")} a={t("faq.a2")} />
              <FaqItem q={t("faq.q3")} a={t("faq.a3")} />
              <FaqItem q={t("faq.q4")} a={t("faq.a4")} />
            </div>
          </section>
        </main>
      </div>
    </>
  );
}

function CreditPackCard({ pack }: { pack: CreditPack }) {
  const t = useTranslations("BillingPage");
  const { credits, price, currency, checkoutUrl, popular, starter } = pack;

  const handleBuy = () => {
    if (!checkoutUrl || checkoutUrl === "#") {
      alert("Checkout URL이 설정되지 않았어요.");
      return;
    }
    window.open(checkoutUrl, "_blank", "noopener,noreferrer");
  };

  const unit = price / credits; // 1크레딧당 대략 가격
  const approxMaps = credits; // 구조맵 1개 = 1크레딧 기준
  const isLargePack = !popular && !starter && credits >= 300;

  return (
    <div
      className={[
        "rounded-3xl border bg-white/85 backdrop-blur p-5 flex flex-col",
        "shadow-[0_18px_40px_-24px_rgba(15,23,42,0.45)]",
        popular
          ? "border-blue-500/70 dark:border-[rgb(var(--hero-b))]"
          : "border-neutral-200/80 dark:border-white/15",
        "dark:bg-black/40",
      ].join(" ")}
    >
      {(popular || starter || isLargePack) && (
        <div className="mb-3 inline-flex items-center gap-1 self-start rounded-full border border-blue-500/40 bg-blue-500/10 px-2.5 py-0.5 text-[11px] font-medium text-blue-700 dark:border-[rgb(var(--hero-b))]/50 dark:bg-[rgb(var(--hero-b))]/15 dark:text-[rgb(var(--hero-b))]">
          {popular
            ? t("card.badge.popular")
            : starter
            ? t("card.badge.starter")
            : t("card.badge.large")}
        </div>
      )}
      <div className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
        {credits.toLocaleString()}{" "}
        <span className="text-base font-medium text-neutral-500 dark:text-neutral-400">
          {t("card.creditsUnit")}
        </span>
      </div>

      <div className="mt-1 text-neutral-800 dark:text-neutral-200">
        {formatPrice(price, currency)}
      </div>

      <div className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
        {t("card.unitPricePrefix")}{" "}
        {formatPrice(unit, currency)}{" "}
        {t("card.unitPriceMiddle")}{" "}
        {approxMaps.toLocaleString()}
        {t("card.unitPriceSuffix")}
      </div>

      <div className="mt-5 flex-1" />

      <button
        onClick={handleBuy}
        className="
          w-full rounded-2xl px-4 py-2.5 text-sm font-semibold
          bg-blue-600 text-white
          hover:bg-blue-700
          hover:-translate-y-0.5 hover:shadow-lg
          active:translate-y-0
          transition-all
          dark:bg-[rgb(var(--hero-a))] dark:hover:bg-[rgb(var(--hero-b))]
        "
      >
        {t("card.cta")}
      </button>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <div
      className="
        rounded-2xl border border-neutral-200/80 dark:border-white/15
        bg-white/85 p-4 backdrop-blur
        dark:bg-black/35
      "
    >
      <div className="font-medium text-neutral-900 dark:text-neutral-50">
        {q}
      </div>
      <div className="mt-1.5 text-sm text-neutral-700 dark:text-neutral-200">
        {a}
      </div>
    </div>
  );
}
