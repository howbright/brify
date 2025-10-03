// app/[locale]/pricing/page.tsx
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";

type Pack = {
  id: string;
  credits: number;
  priceUSD: number;
  unitUSD: number;
  popular?: boolean;
};
const PACKS: Pack[] = [
  { id: "100", credits: 100, priceUSD: 10, unitUSD: 0.1 },
  { id: "300", credits: 300, priceUSD: 25, unitUSD: 0.0833, popular: true },
  { id: "1000", credits: 1000, priceUSD: 70, unitUSD: 0.07 },
];

function usd(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(n);
}

export default async function PricingPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const isAuthed = !!session;

  return (
    <div className="min-h-[100dvh] bg-[#fdfaf6]">
      <header className="mx-auto max-w-5xl px-4 pt-12">
        <h1 className="text-3xl font-semibold text-[#2c2c2c]">Pricing</h1>
        <p className="mt-2 text-neutral-600">
          Pay-as-you-go credits. No subscriptions.
        </p>
        <div className="mt-6 flex gap-3">
          <Link
            href="/signup"
            className="rounded-xl bg-[#a14b3a] px-4 py-2 text-white text-sm shadow-sm"
          >
            Start free
          </Link>
          <Link href="/login" className="rounded-xl border px-4 py-2 text-sm">
            Sign in
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-24">
        <section className="mt-10">
          <div className="grid gap-4 sm:grid-cols-3">
            {PACKS.map((p) => (
              <div
                key={p.id}
                className={`rounded-2xl border bg-white p-5 shadow-sm ${
                  p.popular ? "border-[#a14b3a]" : "border-neutral-200"
                }`}
              >
                {p.popular && (
                  <div className="mb-2 inline-flex items-center gap-1 self-start rounded-full border border-[#a14b3a]/30 bg-[#a14b3a]/10 px-2.5 py-0.5 text-xs text-[#a14b3a]">
                    Most popular
                  </div>
                )}
                <div className="text-2xl font-bold text-[#2c2c2c]">
                  {p.credits.toLocaleString()}{" "}
                  <span className="text-base font-medium text-neutral-500">
                    credits
                  </span>
                </div>
                <div className="mt-1 text-neutral-700">{usd(p.priceUSD)}</div>
                <div className="mt-1 text-xs text-neutral-500">
                  ≈ {usd(p.unitUSD)} / credit
                </div>

                <div className="mt-5" />
                {isAuthed ? (
                  <Link
                    href="/billing"
                    className="block w-full rounded-xl bg-[#a14b3a] px-4 py-2.5 text-center text-sm font-medium text-white shadow-sm"
                  >
                    Buy now
                  </Link>
                ) : (
                  <Link
                    href="/login"
                    className="block w-full rounded-xl bg-[#a14b3a] px-4 py-2.5 text-center text-sm font-medium text-white shadow-sm"
                  >
                    Sign in to buy
                  </Link>
                )}
                <div className="mt-3 text-xs text-neutral-500">
                  Payments in USD via LemonSqueezy.
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-2xl border border-neutral-200 bg-white p-5">
            <h2 className="text-lg font-semibold text-[#2c2c2c]">
              How it works
            </h2>
            <ul className="mt-3 list-disc pl-5 text-sm text-neutral-700 space-y-1">
              <li>Join and get free trial credits.</li>
              <li>1 summary = 1 credit (very long inputs may consume more).</li>
              <li>No subscriptions. Top up credits anytime.</li>
            </ul>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-neutral-200 bg-white p-4">
              <div className="font-medium">
                Do I need an account to purchase?
              </div>
              <div className="mt-1 text-sm text-neutral-700">
                Yes. Please{" "}
                {isAuthed ? (
                  <Link href="/billing" className="underline">
                    go to Billing
                  </Link>
                ) : (
                  <Link href="/signup" className="underline">
                    create an account
                  </Link>
                )}{" "}
                first so we can apply credits to your profile.
              </div>
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-white p-4">
              <div className="font-medium">Refund policy</div>
              <div className="mt-1 text-sm text-neutral-700">
                Unused credits refundable within 7 days. (Adjust to your
                policy.)
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
