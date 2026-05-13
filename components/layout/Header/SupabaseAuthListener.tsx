// components/layout/Header/SupabaseAuthListener.tsx
"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function SupabaseAuthListener() {
  const router = useRouter();
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);
  const refreshTimerRef = useRef<number | null>(null);

  if (!supabaseRef.current) {
    supabaseRef.current = createClient();
  }

  useEffect(() => {
    const supabase = supabaseRef.current!;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, _session) => {
      if (event === "INITIAL_SESSION" || event === "TOKEN_REFRESHED") {
        return;
      }

      if (
        event === "SIGNED_IN" ||
        event === "SIGNED_OUT" ||
        event === "USER_UPDATED" ||
        event === "PASSWORD_RECOVERY"
      ) {
        if (refreshTimerRef.current !== null) {
          window.clearTimeout(refreshTimerRef.current);
        }
        refreshTimerRef.current = window.setTimeout(() => {
          router.refresh();
          refreshTimerRef.current = null;
        }, 0);
      }
    });

    return () => {
      if (refreshTimerRef.current !== null) {
        window.clearTimeout(refreshTimerRef.current);
      }
      subscription.unsubscribe();
    };
  }, [router]);

  return null;
}
