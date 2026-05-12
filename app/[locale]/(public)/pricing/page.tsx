import FinalCTA from "@/components/landing/FinalCTA";
import LandingPricingSection from "@/components/landing/LandingPricingSection";
import { getBillingCurrencyByLocale } from "@/app/lib/billing/catalog";
import { fetchBillingCatalog } from "@/app/lib/billing/catalog.server";
import { createClient } from "@/utils/supabase/server";

export default async function PricingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAuthed = !!user;

  const billingCurrency = getBillingCurrencyByLocale(locale);
  const billingCatalog = await fetchBillingCatalog(billingCurrency);
  const packs = billingCatalog.map((pack) => ({
    id: pack.id,
    credits: pack.credits,
    priceUSD: pack.price,
    popular: pack.popular,
    starter: pack.starter,
  }));

  return (
    <div className="pt-[72px] md:pt-[84px]">
      <LandingPricingSection isAuthed={isAuthed} packs={packs} />
      <FinalCTA isAuthed={isAuthed} showSecondary={false} />
    </div>
  );
}
