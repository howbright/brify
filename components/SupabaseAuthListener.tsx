"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export function SupabaseAuthListener() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, _session) => {
      // 로그인/로그아웃/토큰 갱신 등 auth 상태 바뀔 때마다
      // 서버 컴포넌트들 다시 불러오게 함 → 헤더에 최신 user 반영
      router.refresh();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router, supabase]);

  return null;
}
