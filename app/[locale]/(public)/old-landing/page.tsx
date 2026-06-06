import FinalCTA from "@/components/landing/FinalCTA";
import LandingAudienceSection from "@/components/landing/LandingAudienceSection";
import LandingComparisonSection from "@/components/landing/LandingComparisonSection";
import LandingFeatureListSection from "@/components/landing/LandingFeatureListSection";
import LandingTestimonialsSection from "@/components/landing/LandingTestimonialsSection";
import LandingUsageGuideSection from "@/components/landing/LandingUsageGuideSection";
import CreatorSection from "@/components/layout/CreateorSection";
import Hero from "@/components/layout/Hero";
import { createClient } from "@/utils/supabase/server";

export default async function OldLanding({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isKorean = locale === "ko";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAuthed = !!user;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: isKorean ? "브라이피 Brify" : "Brify",
    alternateName: isKorean ? ["Brify", "브라이피"] : ["Brify"],
    applicationCategory: "ProductivityApplication",
    operatingSystem: "Web",
    url: `https://www.brify.app/${locale}/old-landing`,
    description: isKorean
      ? "Brify는 논문과 긴 자료를 읽는 대학원생, 연구자, 리포트를 준비하는 학생을 위한 AI 구조맵 도구입니다."
      : "Brify is an AI structure map tool for graduate students, researchers, and students preparing reports from papers and long materials.",
    inLanguage: isKorean ? "ko" : locale,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: isKorean ? "KRW" : "USD",
    },
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <Hero isAuthed={isAuthed} />
      <LandingComparisonSection />
      <LandingUsageGuideSection isAuthed={isAuthed} />
      <LandingAudienceSection />
      <LandingFeatureListSection />
      <LandingTestimonialsSection />
      <FinalCTA isAuthed={isAuthed} />
      <CreatorSection />
    </div>
  );
}
