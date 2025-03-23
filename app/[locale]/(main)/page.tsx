import Header from "@/components/layout/Header";
import Hero from "@/components/layout/Hero";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import For from "@/components/layout/For";
import Hero2 from "@/components/layout/Hero2";
import Hero3 from "@/components/Hero3";

export default function Home() {
  const t = useTranslations("HomePage");
  return (
    <div>
      {/* <Hero />
      <Hero2 /> */}
      <Hero3 />
      <For />
      {/* <div>
        <h1>{t("title")}</h1>
        <Link href="/about">{t("about")}</Link>
      </div> */}
    </div>
  );
}
