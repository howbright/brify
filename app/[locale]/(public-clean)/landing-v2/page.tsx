import LandingV2Page from "@/components/landing-v2/LandingV2Page";
import { createClient } from "@/utils/supabase/server";

export default async function LandingV2({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ resume?: string | string[] }>;
}) {
  const { locale } = await params;
  const sp = searchParams ? await searchParams : undefined;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const resumeValue = Array.isArray(sp?.resume) ? sp?.resume[0] : sp?.resume;

  return (
    <LandingV2Page
      locale={locale}
      isAuthed={Boolean(user)}
      email={user?.email ?? null}
      shouldResume={resumeValue === "1"}
    />
  );
}
