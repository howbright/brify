// app/[locale]/pricing/page.tsx (발췌)
import PricingGrid, { Pack } from "@/components/pricing/PricingGrid";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";

const PACKS: Pack[] = [
  { id: "50",  credits: 50,  priceUSD: 5,  starter: true, badgeText: "Starter", tagline: "Try & keep" },
  { id: "300", credits: 300, priceUSD: 25, popular: true, bonusPercent: 10, badgeText: "Best value" }, // 330 지급
  { id: "1000", credits: 1000, priceUSD: 70 },
];

export default async function PricingPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const isAuthed = !!session;

  return (
    <div className="min-h-[100dvh] bg-[var(--color-background-soft)]">
      <header className="mx-auto max-w-5xl px-4 pt-12">
        <h1 className="text-3xl font-semibold text-[var(--color-text)]">Pricing</h1>
        <p className="mt-2 text-[color-mix(in_oklab,var(--color-foreground),transparent 35%)]">
          Pay-as-you-go credits. No subscriptions.
        </p>

        <div className="mt-6 flex gap-3">
          {!isAuthed ? (
            <>
              <Link href="/signup" className="rounded-[var(--radius-lg)] bg-[var(--color-primary-500)] hover:bg-[var(--color-primary-hover)]
                         text-[var(--color-primary-foreground)] px-4 py-2 text-sm shadow-sm
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]">
                Start free
              </Link>
              <Link href="/login" className="rounded-[var(--radius-lg)] border border-[var(--color-border)] px-4 py-2 text-sm
                         text-[var(--color-foreground)]
                         hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]">
                Sign in
              </Link>
            </>
          ) : (
            <>
              <Link href="/dashboard" className="rounded-[var(--radius-lg)] bg-[var(--color-primary-500)] hover:bg-[var(--color-primary-hover)]
                         text-[var(--color-primary-foreground)] px-4 py-2 text-sm shadow-sm
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]">
                Go to Dashboard
              </Link>
              <Link href="/billing" className="rounded-[var(--radius-lg)] border border-[var(--color-border)] px-4 py-2 text-sm
                         text-[var(--color-foreground)]
                         hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]">
                Billing
              </Link>
            </>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-24">
        <section className="mt-10">
          <PricingGrid
            packs={PACKS}
            isAuthed={isAuthed}
            signedInHref="/billing"
            signedOutHref="/login"
            showFooterNote
            showPositioning
            positioningText="No subscription — pay only what you use."
            showRefundBadge
            refundText="Unused credits refundable within 7 days."
            creditRule={{
              label: "Long inputs may use extra credits",
              items: [
                { threshold: "≤ 15k tokens", credits: 1 },
                { threshold: "≤ 50k tokens", credits: 2 },
                { threshold: "≤ 100k tokens", credits: 3 },
              ],
            }}
          />

          {/* 하단 보조 섹션들은 기존대로 유지 */}
        </section>
      </main>
    </div>
  );
}
