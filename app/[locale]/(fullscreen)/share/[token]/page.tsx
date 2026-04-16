"use client";

import { useParams } from "next/navigation";
import { useLocale } from "next-intl";
import FullscreenMapDetailScreen from "@/components/maps/FullscreenMapDetailScreen";

export default function SharedMapPage() {
  const params = useParams();
  const locale = useLocale();
  const token = String(params?.token ?? "");

  return (
    <FullscreenMapDetailScreen
      mapId={token}
      locale={locale}
      accessMode="shared"
      sharedToken={token}
    />
  );
}
