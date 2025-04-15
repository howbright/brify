import Hero3 from "@/components/layout/Hero3";
import For from "@/components/layout/For";
import Needs1 from "@/components/layout/Needs1";
import KnowledgeCompleteSection from "@/components/layout/KnowledgeCompleteSection";
import PresentationSection from "@/components/layout/PresentationSection";
import HeroSection from "@/components/layout/HeroSection";
import NeedsSection from "@/components/layout/NeedsSection";
import FeaturesSection from "@/components/layout/FeatureSection";
// import { useTranslations } from "next-intl";

export default function Home() {
  // const t = useTranslations("HomePage");
  return (
    <div>
      {/* <Hero />
      <Hero2 /> */}
      {/* <Hero3 /> */}
      <HeroSection/>
      <NeedsSection />
      <FeaturesSection/>
      {/* <Needs1/>
      <KnowledgeCompleteSection/>
      <PresentationSection/> */}
      <For />
      {/* <div>
        <h1>{t("title")}</h1>
        <Link href="/about">{t("about")}</Link>
      </div> */}
    </div>
  );
}
