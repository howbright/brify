"use client";

import { useParams, useSearchParams } from "next/navigation";

import FullscreenMapDetailScreen from "@/components/maps/FullscreenMapDetailScreen";

export default function MapDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  return (
    <FullscreenMapDetailScreen
      mapId={String(params?.mapId ?? "")}
      locale={String(params?.locale ?? "ko")}
      sourceTab={searchParams.get("tab")}
      accessMode="user"
    />
  );
}
