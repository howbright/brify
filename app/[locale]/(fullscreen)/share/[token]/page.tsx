"use client";

import { useParams } from "next/navigation";
import { useLocale } from "next-intl";
import FullscreenMapDetailScreen from "@/components/maps/FullscreenMapDetailScreen";
import LanguageSelector from "@/components/LanguageSelector";

export default function SharedMapPage() {
  const params = useParams();
  const locale = useLocale();
  const token = String(params?.token ?? "");

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
