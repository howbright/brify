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
    <div className="min-h-[100dvh] bg-[var(--color-background-soft)]">
      <header className="mx-auto max-w-5xl px-4 pt-12">
        <h1 className="text-3xl font-semibold text-[var(--color-text)]">Pricing</h1>
        <p className="mt-2 text-[color-mix(in_oklab,var(--color-foreground),transparent 35%)]">
          Pay-as-you-go credits. No subscriptions.
        </p>
        <div className="mt-6 flex gap-3">
          <Link
            href="/signup"
            className="rounded-[var(--radius-lg)] bg-[var(--color-primary-500)] hover:bg-[var(--color-primary-hover)]
                       text-[var(--color-primary-foreground)] px-4 py-2 text-sm shadow-sm
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
          >
            Start free
          </Link>
          <Link
            href="/login"
            className="rounded-[var(--radius-lg)] border border-[var(--color-border)] px-4 py-2 text-sm
                       text-[var(--color-foreground)]
                       hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
          >
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
                className={`rounded-2xl border bg-[var(--color-card)] text-[var(--color-card-foreground)] p-5 shadow-sm ${
                  p.popular ? "border-[var(--color-primary-500)]" : "border-[var(--color-border)]"
                }`}
              >
                {p.popular && (
                  <div
                    className="mb-2 inline-flex items-center gap-1 self-start rounded-full
                               border px-2.5 py-0.5 text-xs"
                    style={{
                      borderColor:
                        "color-mix(in_srgb,var(--color-primary-500),transparent 70%)",
                      background:
                        "color-mix(in_srgb,var(--color-primary-500),white 85%)",
                      color: "var(--color-primary-700)",
                    }}
                  >
                    Most popular
                  </div>
                )}

                <div className="text-2xl font-bold text-[var(--color-text)]">
                  {p.credits.toLocaleString()}{" "}
                  <span className="text-base font-medium text-[color-mix(in_oklab,var(--color-foreground),transparent 40%)]">
                    credits
                  </span>
                </div>
                <div className="mt-1 text-[color-mix(in_oklab,var(--color-foreground),transparent 20%)]">
                  {usd(p.priceUSD)}
                </div>
                <div className="mt-1 text-xs text-[var(--color-muted-foreground)]">
                  ≈ {usd(p.unitUSD)} / credit
                </div>

                <div className="mt-5" />
                {isAuthed ? (
                  <Link
                    href="/billing"
                    className="block w-full rounded-[var(--radius-lg)]
                               bg-[var(--color-primary-500)] hover:bg-[var(--color-primary-hover)]
                               text-[var(--color-primary-foreground)] px-4 py-2.5 text-center text-sm font-medium shadow-sm
                               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
                  >
                    Buy now
                  </Link>
                ) : (
                  <Link
                    href="/login"
                    className="block w-full rounded-[var(--radius-lg)]
                               bg-[var(--color-primary-500)] hover:bg-[var(--color-primary-hover)]
                               text-[var(--color-primary-foreground)] px-4 py-2.5 text-center text-sm font-medium shadow-sm
                               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
                  >
                    Sign in to buy
                  </Link>
                )}
                <div className="mt-3 text-xs text-[var(--color-muted-foreground)]">
                  Payments in USD via LemonSqueezy.
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
            <h2 className="text-lg font-semibold text-[var(--color-text)]">How it works</h2>
            <ul className="mt-3 list-disc pl-5 text-sm text-[color-mix(in_oklab,var(--color-foreground),transparent 20%)] space-y-1">
              <li>Join and get free trial credits.</li>
              <li>1 summary = 1 credit (very long inputs may consume more).</li>
              <li>No subscriptions. Top up credits anytime.</li>
            </ul>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
              <div className="font-medium text-[var(--color-text)]">Do I need an account to purchase?</div>
              <div className="mt-1 text-sm text-[color-mix(in_oklab,var(--color-foreground),transparent 20%)]">
                Yes. Please{" "}
                {isAuthed ? (
                  <Link href="/billing" className="underline text-[var(--color-primary-600)] hover:text-[var(--color-primary-700)]">
                    go to Billing
                  </Link>
                ) : (
                  <Link href="/signup" className="underline text-[var(--color-primary-600)] hover:text-[var(--color-primary-700)]">
                    create an account
                  </Link>
                )}{" "}
                first so we can apply credits to your profile.
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
              <div className="font-medium text-[var(--color-text)]">Refund policy</div>
              <div className="mt-1 text-sm text-[color-mix(in_oklab,var(--color-foreground),transparent 20%)]">
                Unused credits refundable within 7 days. (Adjust to your policy.)
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
