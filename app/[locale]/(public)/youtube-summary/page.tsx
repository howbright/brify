import { permanentRedirect } from "next/navigation";

type PageProps = {
  params: Promise<{
    locale: string;
  }>;
};

function normalizeLocale(locale: string) {
  return locale === "ko" || locale === "fr" || locale === "en" ? locale : "en";
}

export default async function YoutubeSummaryRedirectPage({ params }: PageProps) {
  const { locale } = await params;
  permanentRedirect(`/${normalizeLocale(locale)}`);
}
