// app/[locale]/billing/page.tsx
"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import Script from "next/script";
import { useSession } from "@/components/SessionProvider";
import { useRouter } from "next/navigation";

type CreditPack = {
  id: string;
  credits: number;
  priceUSD: number;
  unitUSD: number; // price per credit
  checkoutUrl: string;
  popular?: boolean;
};

const PACKS: CreditPack[] = [
  {
    id: "pack-100",
    credits: 100,
    priceUSD: 10,
    unitUSD: 0.1,
    checkoutUrl: process.env.NEXT_PUBLIC_LEMON_CHECKOUT_100 || "#",
  },
  {
    id: "pack-300",
    credits: 300,
    priceUSD: 25,
    unitUSD: 0.0833,
    checkoutUrl: process.env.NEXT_PUBLIC_LEMON_CHECKOUT_300 || "#",
    popular: true,
  },
  {
    id: "pack-1000",
    credits: 1000,
    priceUSD: 70,
    unitUSD: 0.07,
    checkoutUrl: process.env.NEXT_PUBLIC_LEMON_CHECKOUT_1000 || "#",
  },
];

function formatUSD(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(n);
}

export default function BillingPage() {
  const { session } = useSession();
  const router = useRouter();
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

  const sortedPacks = useMemo(
    () => [...PACKS].sort((a, b) => a.credits - b.credits),
    []
  );

  return (
    <>
      {/* LemonSqueezy 스크립트 (체크아웃용) */}
      <Script src="https://assets.lemonsqueezy.com/lemon.js" strategy="afterInteractive" />

      <div className="relative min-h-[100dvh] bg-[#f4f6fb] dark:bg-[#020617] overflow-hidden">
        {/* 💡 Light BG: Hero랑 톤 맞춘 그라데이션 + 그리드 (살짝만) */}
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

        {/* 🌙 Dark BG: Hero 다크 톤 재사용 */}
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
        <header className="mx-auto max-w-5xl px-6 md:px-10 pt-16 md:pt-20">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/70 px-3 py-1 text-[11px] font-medium text-neutral-700 shadow-sm backdrop-blur dark:bg-black/40 dark:border-white/15 dark:text-neutral-200">
            크레딧 기반 종량제 · 부담 없이 시작하세요
          </div>

          <div className="mt-4 flex flex-col gap-2">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white dark:[text-shadow:0_1px_12px_rgba(0,0,0,0.45)]">
              Credits & Billing
            </h1>
            <p className="text-sm md:text-base text-neutral-700 dark:text-neutral-300 max-w-xl">
              <span className="font-semibold" style={{ color: "var(--color-foreground)" }}>
                먼저 요약해보고,
              </span>{" "}
              필요한 만큼만 크레딧을 충전하세요. 정기 구독 없이도 유연하게 사용할 수 있어요.
            </p>
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
                    Current balance
                  </div>
                  <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-50">
                    {balance === null ? "…" : `${balance.toLocaleString()} credits`}
                  </div>
                  <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
                    기본 가이드:{" "}
                    <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                      1요약 = 1크레딧
                    </span>{" "}
                    (초장문/대용량은 추후 3~5크레딧 차감 규칙 추가 예정)
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                  <Link
                    href="/dashboard"
                    className="
                      inline-flex items-center justify-center rounded-2xl
                      border border-white/70 bg-white/80 px-4 py-2.5 text-sm font-medium
                      text-neutral-900
                      hover:-translate-y-0.5 hover:shadow-md
                      transition-all
                      dark:bg-black/40 dark:border-white/20 dark:text-neutral-100
                    "
                  >
                    대시보드로 돌아가기
                  </Link>
                  <Link
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
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* 패키지 카드 섹션 */}
          <section id="packs" className="mt-10">
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-xl md:text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
                  Credit Packs
                </h2>
                <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                  많이 충전할수록{" "}
                  <span className="font-semibold text-blue-700 dark:text-[rgb(var(--hero-b))]">
                    크레딧당 단가가 저렴
                  </span>
                  해져요.
                </p>
              </div>
              <div className="text-[11px] sm:text-xs text-neutral-500 dark:text-neutral-400">
                모든 결제는 <span className="font-medium">USD</span> 기준이며{" "}
                <span className="font-medium">LemonSqueezy</span>를 통해 안전하게 처리됩니다.
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {sortedPacks.map((pack) => (
                <CreditPackCard key={pack.id} pack={pack} />
              ))}
            </div>

            <div
              className="
              mt-7 rounded-3xl border border-white/70 bg-white/80
              backdrop-blur p-4 sm:p-5
              text-sm text-neutral-700 space-y-1.5
              dark:bg-black/35 dark:border-white/20 dark:text-neutral-200
            "
            >
              <p>• 해외 결제(USD)로 진행되며, 카드사 해외 수수료가 별도로 붙을 수 있어요.</p>
              <p>• 결제 완료 후, 웹훅/콜백 처리가 완료되면 크레딧이 계정에 자동 반영됩니다.</p>
              <p>• 환불 정책: 미사용 크레딧에 한해 7일 이내 환불 요청 가능 (정책은 추후 조정될 수 있습니다).</p>
            </div>
          </section>

          {/* FAQ 섹션 */}
          <section className="mt-12">
            <h3 className="text-lg md:text-xl font-semibold text-neutral-900 dark:text-neutral-50">
              자주 묻는 질문
            </h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <FaqItem
                q="왜 구독이 아닌가요?"
                a="사용한 만큼만 결제하는 종량제 모델이, 가볍게 테스트하거나 가끔 사용하는 유저들에게 부담이 적기 때문이에요. '한 번에 몰아서 요약하고 끝내기' 같은 사용 패턴에도 잘 맞아요."
              />
              <FaqItem
                q="긴 텍스트는 어떻게 과금되나요?"
                a="기본은 1요청=1크레딧이지만, 아주 긴 텍스트나 대용량(예: 장시간 강의 스크립트)은 3~5크레딧 차감 규칙을 명확히 안내한 후 적용할 예정이에요."
              />
              <FaqItem
                q="법인/팀 요금제도 있나요?"
                a="처음에는 개인 크레딧 팩 중심으로 운영하고, 이후에는 팀 단위 월정액 + 초과 사용분 종량제 모델을 추가할 계획이에요."
              />
              <FaqItem
                q="한국 원화로도 결제할 수 있나요?"
                a="초기에는 USD 카드 결제만 지원하고, 한국 사용자 비중이 충분히 쌓이면 토스페이/카카오페이/네이버페이 같은 원화 결제 수단도 검토할 예정이에요."
              />
            </div>
          </section>
        </main>
      </div>
    </>
  );
}

function CreditPackCard({ pack }: { pack: CreditPack }) {
  const { credits, priceUSD, unitUSD, checkoutUrl, popular } = pack;

  const handleBuy = () => {
    if (!checkoutUrl || checkoutUrl === "#") {
      alert("Checkout URL이 설정되지 않았어요.");
      return;
    }
    window.open(checkoutUrl, "_blank", "noopener,noreferrer");
  };

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
      {popular && (
        <div className="mb-3 inline-flex items-center gap-1 self-start rounded-full border border-blue-500/40 bg-blue-500/10 px-2.5 py-0.5 text-[11px] font-medium text-blue-700 dark:border-[rgb(var(--hero-b))]/50 dark:bg-[rgb(var(--hero-b))]/15 dark:text-[rgb(var(--hero-b))]">
          Most popular
        </div>
      )}

      <div className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
        {credits.toLocaleString()}{" "}
        <span className="text-base font-medium text-neutral-500 dark:text-neutral-400">
          credits
        </span>
      </div>
      <div className="mt-1 text-neutral-800 dark:text-neutral-200">
        {formatUSD(priceUSD)}
      </div>
      <div className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
        ≈ {formatUSD(unitUSD)} / credit
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
        Buy now
      </button>

      <div className="mt-3 text-xs text-neutral-500 dark:text-neutral-400">
        결제는 LemonSqueezy로 안전하게 처리됩니다.
      </div>
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
      <div className="font-medium text-neutral-900 dark:text-neutral-50">{q}</div>
      <div className="mt-1.5 text-sm text-neutral-700 dark:text-neutral-200">{a}</div>
    </div>
  );
}
