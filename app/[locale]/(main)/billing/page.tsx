// app/[locale]/billing/page.tsx
"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import Script from "next/script";
import { useSession } from "@/components/SessionProvider";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";

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
      price: 4000, // 4,000원
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
            크레딧 종량제 · 정기 구독 없이
          </div>

          <div className="mt-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white dark:[text-shadow:0_1px_12px_rgba(0,0,0,0.45)]">
                크레딧 · 결제
              </h1>
              <p className="mt-2 text-sm md:text-base text-neutral-700 dark:text-neutral-300 max-w-xl">
                필요할 때만 크레딧을 충전해서 사용하세요.
              </p>
            </div>

            {/* 한국어일 때만 KRW / USD 토글 */}
            {isKorean && (
              <div className="mt-3 md:mt-0 flex justify-start md:justify-end">
                <div className="inline-flex rounded-full border border-white/70 bg-white/80 px-1 py-1 text-[11px] shadow-sm backdrop-blur dark:border-white/20 dark:bg-black/40">
                  <button
                    type="button"
                    onClick={() => setCurrency("krw")}
                    className={[
                      "px-3 py-1.5 rounded-full transition-all",
                      currency === "krw"
                        ? "bg-blue-600 text-white shadow"
                        : "text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100/80 dark:hover:bg-white/5",
                    ].join(" ")}
                  >
                    KRW (원화)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrency("usd")}
                    className={[
                      "px-3 py-1.5 rounded-full transition-all",
                      currency === "usd"
                        ? "bg-blue-600 text-white shadow"
                        : "text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100/80 dark:hover:bg-white/5",
                    ].join(" ")}
                  >
                    USD (달러)
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        <main className="mx-auto max-w-5xl px-6 md:px-10 pb-24">
          {/* 잔액 카드 */}
          <section className="mt-8">
            <div
              className="
                rounded-3xl border border-white/70 bg-white/80
                backdrop-blur
                shadow-[0_20px_60px_-20px_rgba(15,23,42,0.35)]
                p-5 sm:p-6 lg:p-7
                dark:bg-black/35 dark:border-white/15
              "
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-xs font-medium uppercase tracking-[0.12em] text-neutral-500 dark:text-neutral-400">
                    현재 보유 크레딧
                  </div>
                  <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-50">
                    {balance === null
                      ? "…"
                      : `${balance.toLocaleString()} 크레딧`}
                  </div>
                  <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300">
                    구조맵 하나당 보통{" "}
                    <span className="font-semibold">1크레딧이면 충분해요.</span>
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                  <Link
                    href="/"
                    className="
                      inline-flex items-center justify-center rounded-2xl
                      border border-white/70 bg-white/80 px-4 py-2.5 text-sm font-medium
                      text-neutral-900
                      hover:-translate-y-0.5 hover:shadow-md
                      transition-all
                      dark:bg-black/40 dark:border-white/20 dark:text-neutral-100
                    "
                  >
                    메인으로 돌아가기
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
                    크레딧 충전하기
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
                  크레딧 팩 선택
                </h2>
                <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                  많이 충전할수록{" "}
                  <span className="font-semibold text-blue-700 dark:text-[rgb(var(--hero-b))]">
                    크레딧당 단가가 낮아져요.
                  </span>
                </p>
              </div>
              <div className="text-[11px] sm:text-xs text-neutral-500 dark:text-neutral-400">
                결제는{" "}
                <span className="font-medium">
                  {currency === "krw" ? "KRW(원화)" : "USD(달러)"}
                </span>{" "}
                기준이며{" "}
                <span className="font-medium">
                  {currency === "krw"
                    ? "토스페이먼츠(Toss Payments)"
                    : "LemonSqueezy"}
                </span>
                를 통해 안전하게 처리돼요.
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
                mt-7 rounded-3xl border border-white/70 bg-white/80
                backdrop-blur p-4 sm:p-5
                text-xs sm:text-sm text-neutral-700 space-y-1.5
                dark:bg-black/35 dark:border-white/20 dark:text-neutral-200
              "
            >
              {currency === "krw" ? (
                <p>
                  • 원화 결제는 PG사를 통해 처리되며, 카드사 규정에 따라
                  수수료가 붙을 수 있어요.
                </p>
              ) : (
                <p>
                  • 해외 결제(USD)로 진행되며, 카드사 해외 수수료가 별도로 붙을
                  수 있어요.
                </p>
              )}
              <p>
                • 결제 완료 후 몇 초 내로 크레딧이 계정에 자동으로 충전됩니다.
              </p>
              <p>
                • 미사용 크레딧에 한해 7일 이내 환불 요청이 가능하며, 자세한
                정책은 추후 안내돼요.
              </p>
            </div>
          </section>

          {/* 크레딧 사용 기준 */}
          <section className="mt-10">
            <div className="rounded-3xl border border-white/70 bg-white/90 backdrop-blur p-4 sm:p-5 dark:bg-black/40 dark:border-white/20">
              <h3 className="text-sm sm:text-base font-semibold text-neutral-900 dark:text-neutral-50">
                크레딧 사용 기준
              </h3>
              <ul className="mt-2 space-y-1.5 text-xs sm:text-sm text-neutral-700 dark:text-neutral-200">
                <li>• 구조맵 하나당 기본 1크레딧이 차감돼요.</li>
                <li>• 2시간 이내 영상 스크립트 → 1크레딧</li>
                <li>• 2~3시간 분량 영상 스크립트 → 2크레딧</li>
                <li>• 3시간 이상 초장편 영상 스크립트 → 3크레딧</li>
              </ul>
              <p className="mt-2 text-[11px] sm:text-xs text-neutral-500 dark:text-neutral-400">
                ※ 위 기준은 서비스 운영 상황에 따라 조정될 수 있으며, 변경 시
                사전에 안내해 드려요.
              </p>
            </div>
          </section>

          {/* FAQ 섹션 */}
          <section className="mt-12">
            <h3 className="text-lg md:text-xl font-semibold text-neutral-900 dark:text-neutral-50">
              자주 묻는 질문
            </h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <FaqItem
                q="왜 크레딧제로 운영하나요?"
                a="자주 쓰는 날도 있고, 한동안 안 쓸 때도 있어서 정기 구독보다는 사용한 만큼만 결제하는 방식이 더 유연하다고 판단했어요."
              />
              <FaqItem
                q="영상 길이에 따라 몇 크레딧이 사용되나요?"
                a="기본은 구조맵 1건 = 1크레딧이고, 2~3시간 분량의 긴 영상은 2크레딧, 3시간 이상 초장편 영상은 3크레딧이 차감돼요."
              />
              <FaqItem
                q="크레딧에 사용 기한이 있나요?"
                a="현재는 별도의 만료 기한 없이 계정에 계속 남아 있어요. 정책이 바뀌더라도 충분한 안내 후 적용할 예정이에요."
              />
              <FaqItem
                q="영수증이나 세금계산서 발급이 가능한가요?"
                a="모든 결제 내역은 이메일 영수증으로 발송되며, 별도 증빙이 필요하다면 문의를 통해 도와드릴 예정이에요."
              />
            </div>
          </section>
        </main>
      </div>
    </>
  );
}

function CreditPackCard({ pack }: { pack: CreditPack }) {
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
          : "border-white/70 dark:border-white/18",
        "dark:bg-black/40",
      ].join(" ")}
    >
      {(popular || starter || isLargePack) && (
        <div className="mb-3 inline-flex items-center gap-1 self-start rounded-full border border-blue-500/40 bg-blue-500/10 px-2.5 py-0.5 text-[11px] font-medium text-blue-700 dark:border-[rgb(var(--hero-b))]/50 dark:bg-[rgb(var(--hero-b))]/15 dark:text-[rgb(var(--hero-b))]">
          {popular
            ? "가장 많이 선택해요"
            : starter
            ? "처음 쓰기 좋아요"
            : "많이 쓰는 분께 좋아요"}
        </div>
      )}
      <div className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
        {credits.toLocaleString()}{" "}
        <span className="text-base font-medium text-neutral-500 dark:text-neutral-400">
          크레딧
        </span>
      </div>

      <div className="mt-1 text-neutral-800 dark:text-neutral-200">
        {formatPrice(price, currency)}
      </div>

      <div className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
        ≈ {formatPrice(unit, currency)} / 크레딧 · 구조맵 약{" "}
        {approxMaps.toLocaleString()}개 분량
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
        지금 충전하기
      </button>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <div
      className="
        rounded-2xl border border-white/70 bg-white/85
        p-4 backdrop-blur
        dark:bg-black/35 dark:border-white/18
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
