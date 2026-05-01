// components/layout/Header/index.tsx
import { createClient } from "@/utils/supabase/server";
import ClientHeaderShell from "./ClientHeaderShell";
import SupabaseAuthListener from "./SupabaseAuthListener";

export default async function Header() {
  let user: { email?: string | null } | null = null;
  try {
    const supabase = await createClient();
    // 인증 조회 실패 시에도 퍼블릭 페이지 렌더는 계속 진행
    const {
      data: { user: fetchedUser },
      error,
    } = await supabase.auth.getUser();
    if (error) {
      console.error("[Header] auth.getUser failed:", error.message);
    } else {
      user = fetchedUser;
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "unknown error";
    console.error("[Header] auth bootstrap failed:", message);
  }

  const isAuthed = !!user;
  const email = user?.email ?? null;

  return (
    <>
      <ClientHeaderShell isAuthed={isAuthed} email={email} />
      <SupabaseAuthListener />
    </>
  );
}
