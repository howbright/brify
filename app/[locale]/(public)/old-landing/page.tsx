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
      ? "브라이피(Brify)는 길고 복잡한 문서를 구조화해 핵심 흐름과 세부 정보를 함께 파악할 수 있도록 돕는 AI 문서 구조화 도구입니다."
      : "Brify is an AI document structuring tool that helps you organize long, complex documents so you can grasp core flow and critical details faster.",
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
