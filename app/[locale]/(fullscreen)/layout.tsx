import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/utils/supabase/server";

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
    const h = await headers();
    const currentPath = normalizeNext(h.get("x-pathname"));

    redirect(
      `/${locale}/signup/complete?next=${encodeURIComponent(currentPath)}`
    );
  }

  return <>{children}</>;
}
