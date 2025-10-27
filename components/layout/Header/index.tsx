// components/layout/Header/index.tsx
import { Link } from "@/i18n/navigation";
import { createClient } from "@/utils/supabase/server";
import ClientHeaderShell from "./ClientHeaderShell";

export default async function Header() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const isAuthed = !!session;
  const email = session?.user?.email ?? null;

  // 필요하면 여기에 서버에서 미리 불러올 내비 아이템을 구성해서 넘겨도 됨
  return <ClientHeaderShell isAuthed={isAuthed} email={email} />;
}
