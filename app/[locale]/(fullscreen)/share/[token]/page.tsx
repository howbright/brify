import type { Metadata } from "next";
import FullscreenMapDetailScreen from "@/components/maps/FullscreenMapDetailScreen";
import LanguageSelector from "@/components/LanguageSelector";
import {
  buildSharedMapOgText,
  getSharedMapMetaByToken,
} from "@/app/lib/sharedMapMeta";

type PageProps = {
  params: Promise<{
    locale: string;
    token: string;
  }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale, token } = await params;
  const map = await getSharedMapMetaByToken(token);

  if (!map) {
    const fallback =
      locale === "ko"
        ? {
            title: "Brify 공유 구조맵",
            description: "공유된 구조맵을 확인해보세요.",
          }
        : locale === "fr"
        ? {
            title: "Carte structurée partagée Brify",
            description: "Découvrez cette carte structurée partagée.",
          }
        : {
            title: "Brify Shared Structure Map",
            description: "Check out this shared structure map.",
          };

    return {
      title: fallback.title,
      description: fallback.description,
    };
  }

  const { title, description } = buildSharedMapOgText(map, locale);
  const imageUrl = "https://www.brify.app/images/sharingurl.jpg";
  const pageUrl = `https://www.brify.app/${locale}/share/${token}`;
  const ogLocale = locale === "ko" ? "ko_KR" : locale === "fr" ? "fr_FR" : "en_US";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: pageUrl,
      siteName: "Brify",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: ogLocale,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default async function SharedMapPage({ params }: PageProps) {
  const { locale, token } = await params;

  return (
    <div className="relative min-h-screen">
      <div className="pointer-events-none absolute right-4 top-4 z-50 sm:right-5 sm:top-5">
        <div className="pointer-events-auto">
          <LanguageSelector compact />
        </div>
      </div>
      <FullscreenMapDetailScreen
        mapId={token}
        locale={locale}
        accessMode="shared"
        sharedToken={token}
      />
    </div>
  );
}
