// app/auth/callback/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { adminSupabase } from "@/utils/supabase/admin";
import crypto from "crypto";
import { grantSignupReward } from "@/app/lib/rewards/grantSignupReward";

function signSignup(uid: string, next: string) {
  const secret = process.env.SIGNUP_COMPLETE_SECRET!;
  return crypto.createHmac("sha256", secret).update(`${uid}|${next}`).digest("hex");
}

// next 정규화: "/" 허용 + 오픈리다이렉트만 막기
function normalizeNext(nextRaw: string | null) {
  const next = (nextRaw ?? "").trim();
  if (!next || next === "/") return "/";

  // 내부 경로만 허용
  if (!next.startsWith("/")) return "/";

  // "//evil.com" 방지
  if (next.startsWith("//")) return "/";

  return next;
}

// base(쿠키 심긴 응답) -> 최종 redirect 응답으로 쿠키 복사
function redirectWithCookies(to: URL, base: NextResponse) {
  const r = NextResponse.redirect(to);

  for (const c of base.cookies.getAll()) {
    r.cookies.set(c.name, c.value, c);
  }

  return r;
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);

  const code = url.searchParams.get("code");

  // signupForm에서 보낸 값들
  const flow = url.searchParams.get("flow"); // "signup" 기대
  const terms = url.searchParams.get("terms"); // "1" 기대
  const localeFromQuery = url.searchParams.get("locale");

  // locale 우선순위: query > cookie > en
  const locale = localeFromQuery ?? req.cookies.get("NEXT_LOCALE")?.value ?? "en";

  // ✅ 너 말대로 "/"도 정상 (미들웨어가 locale 붙임)
  const next = normalizeNext(url.searchParams.get("next"));

  // ✅ NextResponse.next()는 app route에서 금지라서,
  //    쿠키를 심어둘 "base redirect response"를 하나 만든다.
  //    (일단 임시로 "/"로)
  const base = NextResponse.redirect(new URL("/", req.nextUrl));

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (cookiesToSet) =>
          cookiesToSet.forEach(({ name, value, options }) =>
            base.cookies.set(name, value, options)
          ),
      },
    }
  );

  // code 없으면 그냥 next로 (쿠키 없음)
  if (!code) {
    return NextResponse.redirect(new URL(next, req.nextUrl));
  }

  // 1) 세션 교환 (✅ base에 Set-Cookie 심김)
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) {
    console.error("exchangeCodeForSession error:", exchangeError.message);
    // exchange 실패면 쿠키도 의미 없으니 그냥 redirect
    return NextResponse.redirect(new URL(next, req.nextUrl));
  }

  // 2) 유저 확인
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error("getUser error:", userError?.message);
    // 쿠키는 생겼을 수도 있으니 복사해서 next로
    return redirectWithCookies(new URL(next, req.nextUrl), base);
  }

  // ✅ signup flow에서 terms=1로 왔을 때만 "약관동의 완료"
  const termsAcceptedFromSignup = flow === "signup" && terms === "1";

  // 3) profiles 상태 확인
  const { data: existing, error: existingError } = await adminSupabase
    .from("profiles")
    .select("id, terms_accepted")
    .eq("id", user.id)
    .maybeSingle();

  if (existingError) {
    console.error("profiles read error:", existingError.message);
    return redirectWithCookies(new URL(next, req.nextUrl), base);
  }

  const isFirstSignup = !existing;

  // 4) profiles 생성/업데이트
  if (isFirstSignup) {
    const { error: insertProfileError } = await adminSupabase.from("profiles").insert({
      id: user.id,
      locale,
      terms_accepted: termsAcceptedFromSignup,
      credits_free: 0,
      credits_paid: 0,
    });

    if (insertProfileError) {
      console.error("profiles insert error:", insertProfileError.message);
      // 경쟁조건 가능 -> 계속 진행
    }
  } else {
    if (termsAcceptedFromSignup && existing?.terms_accepted !== true) {
      const { error: updTermsError } = await adminSupabase
        .from("profiles")
        .update({ terms_accepted: true, locale })
        .eq("id", user.id);

      if (updTermsError) {
        console.error("profiles terms update error:", updTermsError.message);
      }
    }
  }

  // 5) 최종 terms_accepted 재확인
  const { data: finalProfile, error: finalProfileError } = await adminSupabase
    .from("profiles")
    .select("terms_accepted, credits_free, credits_paid")
    .eq("id", user.id)
    .maybeSingle();

  if (finalProfileError || !finalProfile) {
    console.error("final profile read error:", finalProfileError?.message ?? "NO_PROFILE");
    return redirectWithCookies(new URL(next, req.nextUrl), base);
  }

  const finalTermsAccepted = finalProfile.terms_accepted === true;

  // 6) terms 미동의면 complete로 (+ uid/sig) — ✅ 쿠키 유지
  if (!finalTermsAccepted) {
    const completeUrl = new URL(`/${locale}/signup/complete`, req.nextUrl);
    completeUrl.searchParams.set("next", next);

    const sig = signSignup(user.id, next);
    completeUrl.searchParams.set("uid", user.id);
    completeUrl.searchParams.set("sig", sig);

    // 보상 트리거용
    completeUrl.searchParams.set("flow", "signup");

    return redirectWithCookies(completeUrl, base);
  }

  // 7) terms 이미 true + signup에서 terms=1이면 보상 지급
  if (termsAcceptedFromSignup) {
    const rewardResult = await grantSignupReward({
      userId: user.id,
      locale,
      reward: 10,
    });

    if (!rewardResult.ok) {
      console.error("signup reward error:", rewardResult.error, rewardResult.detail);
    }
  }

  // 8) 최종 next로 (✅ 쿠키 유지)
  return redirectWithCookies(new URL(next, req.nextUrl), base);
}
