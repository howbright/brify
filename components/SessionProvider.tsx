// components/SessionProvider.tsx
"use client";
import type { Session } from "@supabase/supabase-js";
import { createContext, useContext, useMemo } from "react";

type Ctx = { session: Session | null };
const SessionContext = createContext<Ctx>({ session: null });

export function SessionProvider({
  children,
  session,
}: {
  children: React.ReactNode;
  session: Session | null;
}) {
  const value = useMemo(() => ({ session }), [session]);

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  return useContext(SessionContext);
}
