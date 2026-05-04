// components/layout/Header/SupabaseAuthListener.tsx
"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function SupabaseAuthListener() {
  const router = useRouter();
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);
  const didReceiveFirstEventRef = useRef(false);

  if (!supabaseRef.current) {
    supabaseRef.current = createClient();
  }

  useEffect(() => {
    const supabase = supabaseRef.current!;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, _session) => {
      // 모바일 첫 진입 2~3초 뒤 재로딩 방지:
      // 초기 auth 이벤트(INITIAL_SESSION 등)는 한 번 무시한다.
      if (!didReceiveFirstEventRef.current) {
        didReceiveFirstEventRef.current = true;
        return;
      }

      // 실제 화면 동기화가 필요한 경우만 refresh
      if (event === "SIGNED_OUT") {
        router.refresh();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  return null;
}
