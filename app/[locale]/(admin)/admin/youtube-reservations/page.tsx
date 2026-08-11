import AdminYoutubeReservationsPage from "@/components/admin/AdminYoutubeReservationsPage";

export default async function AdminYoutubeReservationsRoute({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <AdminYoutubeReservationsPage locale={locale} />;
}
