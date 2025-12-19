// app/auth/callback/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/";

  // signup 플로우 + 약관 동의 여부
  const flow = url.searchParams.get("flow"); // "signup"이면 회원가입
  const termsParam = url.searchParams.get("terms");
  const termsAccepted = termsParam === "1";
  const locale = url.searchParams.get("locale");

  const res = NextResponse.redirect(new URL(next, req.nextUrl));
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (cookiesToSet) =>
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options)
          ),
      },
    }
  );

  if (code) {
    // 세션 교환
    await supabase.auth.exchangeCodeForSession(code);

    // 🔹 구글 "회원가입" 플로우일 때만 profiles 생성 시도
    if (flow === "signup") {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // 이미 프로필 있으면 아무 것도 안 함 (회원가입은 1번만)
        const { data: existing, error: existingError } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", user.id)
          .maybeSingle();

        if (!existingError && !existing) {
          // 처음 가입하는 유저 → 프로필 한 번만 생성
          const { error: insertError } = await supabase.from("profiles").insert({
            id: user.id,
            email: user.email,
            locale: locale,
            terms_accepted: termsAccepted,
            credits_free: 5,
            credits_paid: 0,
          });

          if (insertError) {
            console.error("profiles insert error:", insertError.message);
          }
        }
      }
    }
  }

  return res;
}
