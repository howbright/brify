import Hero3 from "@/components/Hero3";
import For from "@/components/layout/For";
import Needs1 from "@/components/layout/Needs1";
// import { useTranslations } from "next-intl";

export default function Home() {
  // const t = useTranslations("HomePage");
  return (
    <div>
      {/* <Hero />
      <Hero2 /> */}
      <Hero3 />
      <Needs1/>
      <For />
      {/* <div>
        <h1>{t("title")}</h1>
        <Link href="/about">{t("about")}</Link>
      </div> */}
    </div>
  );
}
