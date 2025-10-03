// components/AuthRscRefresher.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function AuthRscRefresher() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
        console.log("supabase쪽에서 event 발생했음.", event)
      if (event === "SIGNED_OUT" || event === "TOKEN_REFRESHED") {
        // 서버 RSC 스냅샷 다시 뽑아오게
        router.refresh();
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [router]);

  return null;
}
