import YoutubeReservationsPage from "@/components/youtube-reservations/YoutubeReservationsPage";

export default async function YoutubeReservationsRoute({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <YoutubeReservationsPage locale={locale} />;
}
