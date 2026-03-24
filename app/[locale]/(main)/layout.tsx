// app/[locale]/(main)/layout.tsx
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import FooterNew from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import { createClient } from "@/utils/supabase/server";
import { MindThemePreferenceProvider } from "@/components/maps/MindThemePreferenceProvider";

function normalizeNext(raw: string | null) {
  const next = (raw ?? "").trim();
  if (!next || next === "/") return "/";
  if (!next.startsWith("/")) return "/";
  if (next.startsWith("//")) return "/";
  return next;
}

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
    const h = await headers();
    const currentPath = normalizeNext(h.get("x-pathname"));
    redirect(`/${locale}/login?next=${encodeURIComponent(currentPath)}`);
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("terms_accepted, mind_theme_preference")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile || profile.terms_accepted !== true) {
    const h = await headers();
    const currentPath = normalizeNext(h.get("x-pathname"));

    // ✅ complete는 locale 붙여서
    redirect(
      `/${locale}/signup/complete?next=${encodeURIComponent(currentPath)}`
    );
  }

  return (
    <MindThemePreferenceProvider
      profileThemeName={profile?.mind_theme_preference ?? null}
    >
      <Header />
      <div>{children}</div>
      <FooterNew />
    </MindThemePreferenceProvider>
  );
}
