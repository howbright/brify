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
  // LemonSqueezy Checkout URL (NEXT_PUBLIC_* 로 노출 허용)
  checkoutUrl: string;
  popular?: boolean;
};

const PACKS: CreditPack[] = [
  {
    id: "pack-100",
    credits: 100,
    priceUSD: 10,
    unitUSD: 0.10,
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
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

export default function BillingPage() {
  const { session, isLoading } = useSession();
  const router = useRouter();
  // 실제로는 Supabase 등에서 사용자 크레딧을 불러오면 됨
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    if (!isLoading && !session) {
      router.push("/login");
    }
  }, [isLoading, session]);

  useEffect(() => {
    // TODO: 서버에서 현재 유저 크레딧 잔액 가져오기 (예: /api/me)
    // 데모용
    setTimeout(() => setBalance(42), 200);
  }, []);

  const sortedPacks = useMemo(
    () => [...PACKS].sort((a, b) => a.credits - b.credits),
    []
  );

  return (
    <>
      {/* LemonSqueezy 임베드(선택): 체크아웃 오버레이 쓰려면 한 번만 로드 */}
      <Script src="https://assets.lemonsqueezy.com/lemon.js" strategy="afterInteractive" />
      <div className="min-h-[100dvh] bg-[#fdfaf6]">
        <header className="mx-auto max-w-5xl px-4 pt-10">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl sm:text-3xl font-semibold text-[#2c2c2c]">
              Credits & Billing
            </h1>
            <p className="text-sm text-neutral-600">
              Summarize first. Pay only for what you use. No subscriptions.
            </p>
          </div>
        </header>

        <main className="mx-auto max-w-5xl px-4 pb-24">
          {/* 잔액 섹션 */}
          <section className="mt-6">
            <div className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <div className="text-sm text-neutral-500">Current Balance</div>
                  <div className="mt-1 text-3xl font-bold tracking-tight">
                    {balance === null ? "…" : `${balance} credits`}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Link
                    href="/dashboard"
                    className="rounded-xl border border-neutral-300 px-4 py-2 text-sm hover:shadow-sm transition"
                  >
                    Back to Dashboard
                  </Link>
                  <Link
                    href="#packs"
                    className="rounded-xl bg-[#a14b3a] px-4 py-2 text-sm text-white shadow-sm hover:opacity-95 transition"
                  >
                    Buy Credits
                  </Link>
                </div>
              </div>
              <div className="mt-3 text-xs text-neutral-500">
                1 요청(요약) = 1 크레딧을 기본으로 권장합니다. 초장문/대용량은 추후 3~5 크레딧 차감 규칙을 추가할 수 있어요.
              </div>
            </div>
          </section>

          {/* 패키지 카드 */}
          <section id="packs" className="mt-10">
            <div className="mb-4 flex items-end justify-between">
              <div>
                <h2 className="text-xl font-semibold text-[#2c2c2c]">Credit Packs</h2>
                <p className="text-sm text-neutral-600 mt-1">
                  More you buy, lower unit price.
                </p>
              </div>
              <div className="text-xs text-neutral-500">
                모든 결제는 <span className="font-medium">USD</span> 기준이며 LemonSqueezy를 통해 처리됩니다.
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {sortedPacks.map((pack) => (
                <CreditPackCard key={pack.id} pack={pack} />
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5">
              <ul className="text-sm text-neutral-700 list-disc pl-5 space-y-1">
                <li>해외 결제(USD)로 진행되며, 카드사 해외 수수료가 별도로 붙을 수 있어요.</li>
                <li>결제 완료 후 크레딧은 즉시 계정에 반영됩니다(웹훅/콜백 처리 필요).</li>
                <li>환불 정책: 미사용 크레딧에 한해 7일 이내 환불 요청 가능(운영 정책에 맞춰 수정하세요).</li>
              </ul>
            </div>
          </section>

          {/* FAQ */}
          <section className="mt-10">
            <h3 className="text-lg font-semibold text-[#2c2c2c]">FAQ</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <FaqItem
                q="왜 구독이 아닌가요?"
                a="사용한 만큼만 결제하는 종량제 모델이 사용자 공정성을 높이고, 가벼운 테스트/가끔 사용에도 부담이 적기 때문이에요."
              />
              <FaqItem
                q="긴 텍스트는 어떻게 과금되나요?"
                a="기본은 1요청=1크레딧이지만, 초장문/대용량은 3~5크레딧 차감 규칙을 안내 후 적용할 수 있어요."
              />
              <FaqItem
                q="법인/팀 요금제도 있나요?"
                a="초기에는 크레딧 팩으로 운영하고, 이후 팀 단위 월정액 + 초과분 종량제로 확장할 계획이에요."
              />
              <FaqItem
                q="한국 원화로도 결제할 수 있나요?"
                a="초기에는 USD 결제만 지원하고, 한국 사용자 증가 시 토스/카카오/네이버페이 연동을 검토합니다."
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
    // 1) 단순 새창으로 체크아웃 열기
    if (!checkoutUrl || checkoutUrl === "#") return alert("Checkout URL이 설정되지 않았어요.");
    window.open(checkoutUrl, "_blank", "noopener,noreferrer");

    // 2) (선택) LemonSqueezy 오버레이를 쓰려면,
    //    checkoutUrl 대신 LS가 제공한 data-lemon-* 속성으로 <a>를 렌더링하세요.
    //    또는 서버에서 주문 완료 후 웹훅으로 크레딧 적립 처리.
  };

  return (
    <div
      className={[
        "rounded-2xl border shadow-sm bg-white p-5 flex flex-col",
        popular ? "border-[#a14b3a]" : "border-neutral-200",
      ].join(" ")}
    >
      {popular && (
        <div className="mb-2 inline-flex items-center gap-1 self-start rounded-full border border-[#a14b3a]/30 bg-[#a14b3a]/10 px-2.5 py-0.5 text-xs text-[#a14b3a]">
          Most popular
        </div>
      )}
      <div className="text-2xl font-bold tracking-tight text-[#2c2c2c]">
        {credits.toLocaleString()} <span className="text-base font-medium text-neutral-500">credits</span>
      </div>
      <div className="mt-1 text-neutral-700">{formatUSD(priceUSD)}</div>
      <div className="mt-1 text-xs text-neutral-500">≈ {formatUSD(unitUSD)} / credit</div>

      <div className="mt-5 flex-1" />

      <button
        onClick={handleBuy}
        className="w-full rounded-xl bg-[#a14b3a] px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:opacity-95 transition"
      >
        Buy now
      </button>

      <div className="mt-3 text-xs text-neutral-500">
        결제는 LemonSqueezy로 안전하게 처리됩니다.
      </div>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4">
      <div className="font-medium text-[#2c2c2c]">{q}</div>
      <div className="mt-1 text-sm text-neutral-700">{a}</div>
    </div>
  );
}
