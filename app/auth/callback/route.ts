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
  for (const c of base.cookies.getAll()) r.cookies.set(c.name, c.value, c);
  return r;
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);

  const code = url.searchParams.get("code");

  // signup/complete에서 보낸 값들 (terms 완료 후 다시 callback로 보내는 흐름 포함)
  const flow = url.searchParams.get("flow"); // "signup" 기대
  const terms = url.searchParams.get("terms"); // "1" 기대
  const localeFromQuery = url.searchParams.get("locale");

  // locale 우선순위: query > cookie > en
  const locale = localeFromQuery ?? req.cookies.get("NEXT_LOCALE")?.value ?? "en";

  // ✅ "/"도 정상 (미들웨어가 locale 붙임)
  const next = normalizeNext(url.searchParams.get("next"));

  // ✅ app route에서 NextResponse.next() 금지 → 쿠키 심을 base response 준비
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

  // 0) ✅ code가 있으면(= OAuth 콜백) 세션 교환해서 쿠키 심기
  if (code) {
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (exchangeError) {
      console.error("exchangeCodeForSession error:", exchangeError.message);
      // 교환 실패면 쿠키도 의미 없을 수 → 그냥 next로
      return NextResponse.redirect(new URL(next, req.nextUrl));
    }
  }

  // 1) ✅ (code 유무 상관없이) 현재 세션에서 유저 확인 (OTP도 여기로 들어오게 됨)
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  // 세션이 없으면: 통합게이트 입장 불가
  // 정책: 그냥 next로 보내기보단 로그인으로 보내는 게 일반적
  if (userError || !user) {
    // 필요하면 next 유지해서 로그인으로
    const loginUrl = new URL(`/${locale}/login`, req.nextUrl);
    if (next) loginUrl.searchParams.set("next", next);
    return redirectWithCookies(loginUrl, base);
  }

  // ✅ signup flow에서 terms=1로 왔을 때만 "약관동의 완료"로 간주
  const termsAcceptedFromSignup = flow === "signup" && terms === "1";
  const userEmail = user.email ?? null;

  // 2) profiles 상태 확인
  const { data: existing, error: existingError } = await adminSupabase
    .from("profiles")
    .select("id, terms_accepted, email")
    .eq("id", user.id)
    .maybeSingle();

  if (existingError) {
    console.error("profiles read error:", existingError.message);
    return redirectWithCookies(new URL(next, req.nextUrl), base);
  }

  const isFirstSignup = !existing;

  // 3) profiles 생성/업데이트 (경쟁조건 고려)
  if (isFirstSignup) {
    const { error: insertProfileError } = await adminSupabase.from("profiles").insert({
      id: user.id,
      email: userEmail,
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
    const shouldUpdateTerms = termsAcceptedFromSignup && existing?.terms_accepted !== true;
    const shouldBackfillEmail = existing?.email !== userEmail;

    if (shouldUpdateTerms || shouldBackfillEmail) {
      const updatePayload: {
        terms_accepted?: boolean;
        locale?: string;
        email?: string | null;
      } = {};

      if (shouldUpdateTerms) {
        updatePayload.terms_accepted = true;
        updatePayload.locale = locale;
      }

      if (shouldBackfillEmail) {
        updatePayload.email = userEmail;
      }

      const { error: updTermsError } = await adminSupabase
        .from("profiles")
        .update(updatePayload)
        .eq("id", user.id);

      if (updTermsError) {
        console.error("profiles terms update error:", updTermsError.message);
      }
    }
  }

  // 4) 최종 terms_accepted 재확인
  const { data: finalProfile, error: finalProfileError } = await adminSupabase
    .from("profiles")
    .select("terms_accepted, email")
    .eq("id", user.id)
    .maybeSingle();

  if (finalProfileError || !finalProfile) {
    console.error("final profile read error:", finalProfileError?.message ?? "NO_PROFILE");
    return redirectWithCookies(new URL(next, req.nextUrl), base);
  }

  const finalTermsAccepted = finalProfile.terms_accepted === true;

  // 5) ✅ terms 미동의면 complete로 (OTP/Google 동일)
  if (!finalTermsAccepted) {
    const completeUrl = new URL(`/${locale}/signup/complete`, req.nextUrl);
    completeUrl.searchParams.set("next", next);

    const sig = signSignup(user.id, next);
    completeUrl.searchParams.set("uid", user.id);
    completeUrl.searchParams.set("sig", sig);

    // 보상 트리거용 (complete에서 terms=1 후 callback로 돌아올 때 사용)
    completeUrl.searchParams.set("flow", "signup");

    return redirectWithCookies(completeUrl, base);
  }

  // 6) ✅ terms 완료된 “이번 흐름”에서만 보상 지급 (중복 방지는 grantSignupReward 내부가 처리)
  if (termsAcceptedFromSignup) {
    const rewardResult = await grantSignupReward({
      userId: user.id,
      locale,
      reward: 15,
    });

    if (!rewardResult.ok) {
      console.error("signup reward error:", rewardResult.error, rewardResult.detail);
    }
  }

  // 7) 최종 next로 (✅ 쿠키 유지)
  return redirectWithCookies(new URL(next, req.nextUrl), base);
}
