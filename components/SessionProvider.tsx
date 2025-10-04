// components/SessionProvider.tsx
"use client";
import type { Session } from "@supabase/supabase-js";
import { createContext, useContext, useMemo, useEffect, useState } from "react";

type Ctx = { session: Session | null; isLoading: boolean };
const SessionContext = createContext<Ctx>({ session: null, isLoading: true });

export function SessionProvider({
  children,
  session,
}: {
  children: React.ReactNode;
  session: Session | null;
}) {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  const value = useMemo(
    () => ({ session, isLoading: !hydrated }),
    [session, hydrated]
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession() {
  return useContext(SessionContext);
}
