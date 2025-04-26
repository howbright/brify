import CTAPricingSection from "@/components/layout/CTAPricingSection";
import FeaturesSection from "@/components/layout/FeatureSection";
import HeroSection from "@/components/layout/HeroSection";
import NeedsSection from "@/components/layout/NeedsSection";
import StatsSection from "@/components/layout/StateSection";
import TestimonialSection from "@/components/layout/TestimonialSection";
// import { useTranslations } from "next-intl";

export default function Home() {
  // const t = useTranslations("HomePage");
  return (
    <div>
      <HeroSection/>
      <StatsSection/>
      <NeedsSection />
      <FeaturesSection/>
      <TestimonialSection/>
      <CTAPricingSection/>
    </div>
  );
}
