import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

function isAdminEmail(email: string | null) {
  if (!email) return false;
  const raw = process.env.ADMIN_EMAILS ?? "";
  const list = raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.toLowerCase());
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

  if (!user) redirect("/login");

  const email = user.email ?? null;
  if (!isAdminEmail(email)) redirect("/"); // 또는 notFound()

  return <>{children}</>;
}
