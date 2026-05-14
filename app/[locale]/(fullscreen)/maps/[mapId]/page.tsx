import MapDetailClient from "./MapDetailClient";

type PageProps = {
  params: Promise<{
    locale: string;
    mapId: string;
  }>;
  searchParams: Promise<{
    tab?: string | string[];
  }>;
};

export default async function MapDetailPage({
  params,
  searchParams,
}: PageProps) {
  const { locale, mapId } = await params;
  const resolvedSearchParams = await searchParams;
  const sourceTab = Array.isArray(resolvedSearchParams?.tab)
    ? resolvedSearchParams.tab[0] ?? null
    : resolvedSearchParams?.tab ?? null;

  return (
    <MapDetailClient
      mapId={mapId}
      locale={locale}
      sourceTab={sourceTab}
    />
  );
}
