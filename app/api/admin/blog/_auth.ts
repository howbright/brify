import { createClient } from "@/utils/supabase/server";

export async function requireBlogAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { ok: false as const, status: 401, user: null };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || profile?.role !== "ADMIN") {
    return { ok: false as const, status: 403, user: null };
  }

  return { ok: true as const, status: 200, user };
}
