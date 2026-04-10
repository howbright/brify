import FinalCTA from "@/components/landing/FinalCTA";
import HeroFlowStrip from "@/components/landing/HeroFlowStrip";
import MapLibrarySection from "@/components/landing/MapLibrarySection";
import LandingPricingSection from "@/components/landing/LandingPricingSection";
import LandingTestimonialsSection from "@/components/landing/LandingTestimonialsSection";
import CreatorSection from "@/components/layout/CreateorSection";
import Hero from "@/components/layout/Hero";
import { getBillingCurrencyByLocale } from "@/app/lib/billing/catalog";
import { fetchBillingCatalog } from "@/app/lib/billing/catalog.server";
import { createClient } from "@/utils/supabase/server";

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const isAuthed = !!session;
  const billingCurrency = getBillingCurrencyByLocale(locale);
  const billingCatalog = await fetchBillingCatalog(billingCurrency);
  const packs = billingCatalog.map((pack) => ({
    id: pack.id,
    credits: pack.credits,
    priceUSD: pack.price,
    popular: pack.popular,
    starter: pack.starter,
  }));
  // const t = useTranslations("HomePage");
  return (
    <div>
      <Hero isAuthed={isAuthed} />
      <HeroFlowStrip />
      <MapLibrarySection />
      <LandingTestimonialsSection />
      <LandingPricingSection isAuthed={isAuthed} packs={packs} />
      <FinalCTA isAuthed={isAuthed} />
      <CreatorSection />
    </div>
  );
}
