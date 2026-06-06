import { createClient } from "@/utils/supabase/server";

export function parseAdminEmails(raw: string | undefined | null) {
  return (raw ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

export async function requireBlogAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { ok: false as const, status: 401, user: null };
  }

  const admins = parseAdminEmails(process.env.ADMIN_EMAILS);
  const email = (user.email ?? "").trim().toLowerCase();

  if (admins.length === 0 || !admins.includes(email)) {
    return { ok: false as const, status: 403, user: null };
  }

  return { ok: true as const, status: 200, user };
}
