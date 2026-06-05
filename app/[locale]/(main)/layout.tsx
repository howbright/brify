// app/[locale]/(main)/layout.tsx
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import AppShell from "@/components/layout/AppShell";
import { createClient } from "@/utils/supabase/server";
import { MindThemePreferenceProvider } from "@/components/maps/MindThemePreferenceProvider";
import { resolveTermsAccess } from "@/app/lib/auth/resolveTermsAccess";

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
    console.warn("[main/layout] no-user", {
      locale,
      currentPath,
      userError: userError?.message ?? null,
    });
    redirect(`/${locale}/login?next=${encodeURIComponent(currentPath)}`);
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("terms_accepted, mind_theme_preference, credits_free, credits_paid")
    .eq("id", user.id)
    .maybeSingle();
  const h = await headers();
  const currentPath = normalizeNext(h.get("x-pathname"));

  const resolvedProfile = await resolveTermsAccess({
    userId: user.id,
    initialProfile: profile,
    initialProfileError: profileError?.message ?? null,
    logPrefix: "[main/layout]",
    currentPath,
  });

  if (!resolvedProfile || resolvedProfile.terms_accepted !== true) {
    console.warn("[main/layout] redirecting-to-signup-complete", {
      locale,
      userId: user.id,
      currentPath,
      resolvedTermsAccepted: resolvedProfile?.terms_accepted ?? null,
    });

    redirect(
      `/${locale}/signup/incomplete?next=${encodeURIComponent(currentPath)}`
    );
  }

  console.info("[main/layout] allowed", {
    locale,
    userId: user.id,
    resolvedTermsAccepted: resolvedProfile.terms_accepted,
  });

  return (
    <MindThemePreferenceProvider
      profileThemeName={resolvedProfile?.mind_theme_preference ?? null}
    >
      <AppShell locale={locale} email={user.email ?? null}>
        {children}
      </AppShell>
    </MindThemePreferenceProvider>
  );
}
