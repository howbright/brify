import FullscreenMapDetailScreen from "@/components/maps/FullscreenMapDetailScreen";

export default async function AdminMapDetailPage({
  params,
}: {
  params: Promise<{ locale: string; mapId: string }>;
}) {
  const { locale, mapId } = await params;

  return (
    <FullscreenMapDetailScreen
      mapId={mapId}
      locale={locale}
      accessMode="admin"
    />
  );
}
