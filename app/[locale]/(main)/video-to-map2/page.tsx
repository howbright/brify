import { redirect } from "next/navigation";

export default async function VideoToMap2RedirectPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}`);
}
