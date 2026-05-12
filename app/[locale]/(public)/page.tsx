import FinalCTA from "@/components/landing/FinalCTA";
import LandingAudienceSection from "@/components/landing/LandingAudienceSection";
import LandingComparisonSection from "@/components/landing/LandingComparisonSection";
import LandingFeatureListSection from "@/components/landing/LandingFeatureListSection";
import LandingTestimonialsSection from "@/components/landing/LandingTestimonialsSection";
import LandingUsageGuideSection from "@/components/landing/LandingUsageGuideSection";
import CreatorSection from "@/components/layout/CreateorSection";
import Hero from "@/components/layout/Hero";
import { createClient } from "@/utils/supabase/server";

export default async function Home({
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
    url: `https://www.brify.app/${locale}`,
    description: isKorean
      ? "브라이피(Brify)는 유튜브 대본, 웹페이지, 긴 텍스트를 구조맵으로 정리해 복잡한 정보의 흐름과 구조를 한눈에 파악할 수 있게 도와줍니다."
      : "Brify turns YouTube transcripts, webpages, and long text into structure maps so you can understand complex information at a glance.",
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
