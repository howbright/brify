// app/[locale]/(admin)/admin/layout.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

function parseAdminEmails(raw: string | undefined | null) {
  return (raw ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

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

  const admins = parseAdminEmails(process.env.ADMIN_EMAILS);
  const me = (user.email ?? "").trim().toLowerCase();

  // ✅ 환경변수 미설정 or 이메일 불일치 → 홈으로
  if (admins.length === 0 || !admins.includes(me)) {
    redirect("/");
  }

  return <>{children}</>;
}
