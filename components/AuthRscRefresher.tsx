// components/AuthRscRefresher.tsx
"use client";

import { useEffect } from "react";
import { useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { useSession } from "@/components/SessionProvider";

export default function AuthRscRefresher() {
  const router = useRouter();
  const { session: serverSession } = useSession();
  const refreshTimerRef = useRef<number | null>(null);
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);

  if (!supabaseRef.current) {
    supabaseRef.current = createClient();
  }

  useEffect(() => {
    const supabase = supabaseRef.current!;
    const getSignupIntentCookie = () =>
      document.cookie
        .split("; ")
        .find((row) => row.startsWith("brify_signup_terms="))
        ?.split("=")[1] === "1";

    const resolveLocaleFromPath = () => {
      const segment = window.location.pathname.split("/").filter(Boolean)[0];
      return segment === "ko" || segment === "en" || segment === "fr" ? segment : "ko";
    };

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user && getSignupIntentCookie()) {
        window.location.assign(
          `/auth/signup-redirect?locale=${encodeURIComponent(resolveLocaleFromPath())}`
        );
        return;
      }

      if (event === "INITIAL_SESSION") {
        if (session?.user && !serverSession?.user) {
          if (refreshTimerRef.current !== null) {
            window.clearTimeout(refreshTimerRef.current);
          }
          refreshTimerRef.current = window.setTimeout(() => {
            router.refresh();
            refreshTimerRef.current = null;
          }, 0);
        }
        return;
      }

      // 주기적 TOKEN_REFRESHED는 불필요한 RSC refresh를 만들 수 있으니 건너뛴다.
      if (event === "TOKEN_REFRESHED") {
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
        // 세션 쿠키 반영 직후 한 번만 새로고침해 헤더/RSC 인증 상태를 맞춘다.
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
      sub.subscription.unsubscribe();
    };
  }, [router, serverSession?.user]);

  return null;
}
