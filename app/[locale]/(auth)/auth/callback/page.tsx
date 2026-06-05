import { redirect } from "next/navigation";

export default async function LocaleAuthCallbackPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const sp = searchParams ? await searchParams : {};
  const nextParams = new URLSearchParams();

  for (const [key, value] of Object.entries(sp)) {
    if (Array.isArray(value)) {
      value.forEach((item) => nextParams.append(key, item));
    } else if (value !== undefined) {
      nextParams.set(key, value);
    }
  }

  if (!nextParams.has("locale")) {
    nextParams.set("locale", locale);
  }

  redirect(`/auth/callback?${nextParams.toString()}`);
}
