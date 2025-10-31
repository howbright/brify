import FinalCTA from "@/components/landing/FinalCTA";
import LandingPricingSection from "@/components/landing/LandingPricingSection";
import CreatorSection from "@/components/layout/CreateorSection";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/layout/Hero";
import { createClient } from "@/utils/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const isAuthed = !!session;
  // const t = useTranslations("HomePage");
  return (
    <div>
      <Hero />
      <CreatorSection />
      <LandingPricingSection isAuthed={isAuthed} />
      <FinalCTA isAuthed={isAuthed}/>
      <Footer />
    </div>
  );
}
