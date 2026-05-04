// components/AuthRscRefresher.tsx
"use client";

import { useEffect } from "react";
import { useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function AuthRscRefresher() {
  const router = useRouter();
  const didReceiveFirstEventRef = useRef(false);
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);

  if (!supabaseRef.current) {
    supabaseRef.current = createClient();
  }

  useEffect(() => {
    const supabase = supabaseRef.current!;
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      // 모바일 첫 진입 직후 INITIAL_SESSION/TOKEN_REFRESHED로 인한
      // 불필요한 refresh(체감상 자동 재로딩)를 방지한다.
      if (!didReceiveFirstEventRef.current) {
        didReceiveFirstEventRef.current = true;
        return;
      }

      if (event === "SIGNED_OUT") {
        // 로그아웃 시에만 서버 RSC 스냅샷 갱신
        router.refresh();
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [router]);

  return null;
}
