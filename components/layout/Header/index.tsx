// components/layout/Header/index.tsx
import { createClient } from "@/utils/supabase/server";
import ClientHeaderShell from "./ClientHeaderShell";
import SupabaseAuthListener from "./SupabaseAuthListener";

export default async function Header() {
  const supabase = await createClient();

  // ✅ 인증 서버에 확인해서 user를 가져옴 (권장)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthed = !!user;
  const email = user?.email ?? null;

  return (
    <>
      <ClientHeaderShell isAuthed={isAuthed} email={email} />
      <SupabaseAuthListener />
    </>
  );
}
