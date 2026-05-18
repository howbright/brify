import { redirect } from "next/navigation";
import { headers } from "next/headers";
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

export default async function FullscreenLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const h = await headers();
  const currentPath = normalizeNext(h.get("x-pathname"));
  const isSharedRoute = currentPath.startsWith(`/${locale}/share/`);

  if (isSharedRoute) {
    return (
      <MindThemePreferenceProvider profileThemeName={null}>
        {children}
      </MindThemePreferenceProvider>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.warn("[fullscreen/layout] no-user", {
      locale,
      currentPath,
      userError: userError?.message ?? null,
    });
    redirect(`/${locale}/login`);
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("terms_accepted, mind_theme_preference, credits_free, credits_paid")
    .eq("id", user.id)
    .maybeSingle();
  const resolvedProfile = await resolveTermsAccess({
    userId: user.id,
    initialProfile: profile,
    initialProfileError: profileError?.message ?? null,
    logPrefix: "[fullscreen/layout]",
    currentPath,
  });

  if (!resolvedProfile || resolvedProfile.terms_accepted !== true) {
    console.warn("[fullscreen/layout] redirecting-to-signup-complete", {
      locale,
      userId: user.id,
      currentPath,
      resolvedTermsAccepted: resolvedProfile?.terms_accepted ?? null,
    });
    redirect(
      `/${locale}/signup/incomplete?next=${encodeURIComponent(currentPath)}`
    );
  }

  console.info("[fullscreen/layout] allowed", {
    locale,
    userId: user.id,
    currentPath,
    resolvedTermsAccepted: resolvedProfile.terms_accepted,
  });

  return (
    <MindThemePreferenceProvider
      profileThemeName={resolvedProfile?.mind_theme_preference ?? null}
    >
      {children}
    </MindThemePreferenceProvider>
  );
}
