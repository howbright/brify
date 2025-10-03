// components/SessionProvider.tsx
"use client";
import type { Session } from "@supabase/supabase-js";
import { createContext, useContext, useMemo } from "react";

type Ctx = { session: Session | null };
const SessionContext = createContext<Ctx>({ session: null });

export function SessionProvider({
  children,
  session, // ⬅️ 이름도 명확히 변경 (initial 아님)
}: {
  children: React.ReactNode;
  session: Session | null;
}) {
  const value = useMemo(() => ({ session }), [session]); // prop 변경 시 컨텍스트 업데이트
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  return useContext(SessionContext);
}
