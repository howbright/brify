// app/auth/callback/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { adminSupabase } from "@/utils/supabase/admin";
import crypto from "crypto";
import { grantSignupReward } from "@/app/lib/rewards/grantSignupReward";

function signSignup(uid: string, next: string) {
  const secret = process.env.SIGNUP_COMPLETE_SECRET!;
  return crypto
    .createHmac("sha256", secret)
    .update(`${uid}|${next}`)
    .digest("hex");
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);

  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/";

  // signupForm에서 보낸 값들
  const flow = url.searchParams.get("flow"); // "signup" 기대
  const terms = url.searchParams.get("terms"); // "1" 기대
  const localeFromQuery = url.searchParams.get("locale");

  // locale 우선순위: query > cookie > en
  const locale =
    localeFromQuery ?? req.cookies.get("NEXT_LOCALE")?.value ?? "en";

  // 기본은 next로 보내되, 아래에서 complete로 바꿀 수 있음
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

  if (!code) return res;

  // 1) 세션 교환
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(
    code
  );
  if (exchangeError) {
    console.error("exchangeCodeForSession error:", exchangeError.message);
    return res;
  }

  // 2) 유저 확인
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error("getUser error:", userError?.message);
    return res;
  }

  // ✅ signup flow에서 terms=1로 왔을 때만 "약관동의 완료"로 인정
  const termsAcceptedFromSignup = flow === "signup" && terms === "1";

  // 3) 현재 profiles 상태 확인 (admin으로 안전하게)
  const { data: existing, error: existingError } = await adminSupabase
    .from("profiles")
    .select("id, terms_accepted")
    .eq("id", user.id)
    .maybeSingle();

  if (existingError) {
    console.error("profiles read error:", existingError.message);
    return res;
  }

  const isFirstSignup = !existing;

  // 4) profiles 생성 or 업데이트
  if (isFirstSignup) {
    // ✅ 최초 가입: terms=1이면 true로 생성
    // ⚠️ email unique 문제 있었으면 여기서 email 빼도 됨 (권장)
    const { error: insertProfileError } = await adminSupabase
      .from("profiles")
      .insert({
        id: user.id,
        // email: user.email, // 필요하면 유지. email unique 때문에 터진 적 있으면 제거 권장.
        locale,
        terms_accepted: termsAcceptedFromSignup,
        credits_free: 0,
        credits_paid: 0,
      });

    if (insertProfileError) {
      console.error("profiles insert error:", insertProfileError.message);
      // 여기서 return은 하지 말고 계속 진행 (경쟁조건 가능)
    }
  } else {
    // ✅ 기존 유저: signup에서 terms=1로 왔으면 true로 올려줌
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

  // 5) ✅ 최종 terms_accepted 재확인 (insert/update 경쟁조건 대비)
  const { data: finalProfile, error: finalProfileError } = await adminSupabase
    .from("profiles")
    .select("terms_accepted, credits_free, credits_paid")
    .eq("id", user.id)
    .maybeSingle();

  if (finalProfileError || !finalProfile) {
    console.error(
      "final profile read error:",
      finalProfileError?.message ?? "NO_PROFILE"
    );
    return res;
  }

  const finalTermsAccepted = finalProfile.terms_accepted === true;

  // 6) ✅ terms_accepted가 true가 아니면 무조건 complete로 (+ uid/sig)
  if (!finalTermsAccepted) {
    const completeUrl = new URL(`/${locale}/signup/complete`, req.nextUrl);
    completeUrl.searchParams.set("next", next);

    // ✅ complete에서 세션 없이도 처리할 수 있도록 uid + sig 전달
    const sig = signSignup(user.id, next);
    completeUrl.searchParams.set("uid", user.id);
    completeUrl.searchParams.set("sig", sig);

    // (선택) 디버깅/분기용
    completeUrl.searchParams.set("flow", flow ?? "");

    return NextResponse.redirect(completeUrl);
  }

  // ==========================
  // 7) ✅ 여기부터는 terms_accepted=true 상태
  //    - signup에서 terms=1인 경우 "가입보상 지급"까지 포함
  // ==========================

  // 7-1) 중복 체크
  const { data: alreadyBonus, error: bonusCheckError } = await adminSupabase
    .from("credit_transactions")
    .select("id")
    .eq("user_id", user.id)
    .eq("reason", "signup_reward")
    .limit(1)
    .maybeSingle();

  if (bonusCheckError) {
    console.error("signup bonus check error:", bonusCheckError.message);
    return res;
  }

  // 7-2) ✅ "signup에서 terms=1로 왔을 때"만 보상 지급 트리거
  const shouldGiveSignupReward = termsAcceptedFromSignup;

  if (shouldGiveSignupReward) {
    const rewardResult = await grantSignupReward({
      userId: user.id,
      locale,
      reward: 10,
    });

    if (!rewardResult.ok) {
      // 여기선 흐름을 막지 말지(권장: 막지 말고 로그만)
      console.error(
        "signup reward error:",
        rewardResult.error,
        rewardResult.detail
      );
    }
  }

  // 8) ✅ 최종: next로 이동
  return res;
}
