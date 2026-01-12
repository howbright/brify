// app/[locale]/(main)/layout.tsx
import { redirect } from "next/navigation";
import FooterNew from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import { createClient } from "@/utils/supabase/server";

export default async function MainLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect(`/${locale}/login`);
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("terms_accepted")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile || profile.terms_accepted !== true) {
    redirect(`/${locale}/signup/complete?next=/`);
  }

  return (
    <>
      <Header />
      <div>{children}</div>
      <FooterNew />
    </>
  );
}
