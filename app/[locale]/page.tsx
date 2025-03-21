import Header from "@/components/layout/Header";
import Hero from "@/components/layout/Hero";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function Home() {
  const t = useTranslations("HomePage");
  return (
    <div>
      <Hero />
      <div>
        <h1>{t("title")}</h1>
        <Link href="/about">{t("about")}</Link>
      </div>
    </div>
  );
}
