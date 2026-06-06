// app/[locale]/(admin)/admin/layout.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ✅ 미로그인 → 로그인 페이지로
  if (!user) {
    redirect("/ko/login?next=/admin");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  // ✅ ADMIN role이 아니면 홈으로
  if (profileError || profile?.role !== "ADMIN") {
    redirect("/");
  }

  return <>{children}</>;
}
