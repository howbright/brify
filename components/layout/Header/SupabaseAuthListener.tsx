// components/layout/Header/SupabaseAuthListener.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function SupabaseAuthListener() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, _session) => {
      // 로그인/로그아웃/OTP 인증/구글 로그인 등 auth 상태가 바뀔 때마다
      // 서버 컴포넌트들을 다시 불러오게 함 → Header도 다시 렌더
      router.refresh();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router, supabase]);

  return null;
}
