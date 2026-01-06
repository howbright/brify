// app/auth/callback/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { adminSupabase } from "@/utils/supabase/admin";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/";

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
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
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

  // 3) profiles 존재 여부로 최초가입 판단
  const { data: existing, error: existingError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (existingError) {
    console.error("profiles select error:", existingError.message);
    return res;
  }

  const isFirstSignup = !existing;

  // 4) 최초가입이면 profiles 생성 + 가입보상 지급(서비스롤로 직접 처리)
  if (isFirstSignup) {
    const locale = req.cookies.get("NEXT_LOCALE")?.value ?? "en";

    // 4-1) profile 생성 (초기 크레딧은 0으로 두고, 보상 지급 로직이 10을 올림)
    const { error: insertProfileError } = await supabase.from("profiles").insert({
      id: user.id,
      email: user.email,
      locale,
      terms_accepted: true,
      credits_free: 0,
      credits_paid: 0,
    });

    // 경쟁조건(이미 만들어짐)도 있을 수 있으니 에러는 로그만
    if (insertProfileError) {
      console.error("profiles insert error:", insertProfileError.message);
    }

    // 4-2) ✅ 중복 체크: credit_transactions.reason='signup_reward'가 이미 있으면 지급 X
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

    if (!alreadyBonus) {
      // 4-3) 현재 balances 읽기 (서비스롤로 읽음)
      const { data: profile, error: profileError } = await adminSupabase
        .from("profiles")
        .select("credits_free, credits_paid")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError || !profile) {
        console.error("profile read error:", profileError?.message ?? "NO_PROFILE");
        return res;
      }

      const delta = 10;

      const oldFree = Number(profile.credits_free ?? 0);
      const oldPaid = Number(profile.credits_paid ?? 0);
      const newFree = oldFree + delta;
      const newPaid = oldPaid;
      const newTotal = newFree + newPaid;

      // 4-4) profiles 업데이트
      const { error: updError } = await adminSupabase
        .from("profiles")
        .update({ credits_free: newFree, credits_paid: newPaid })
        .eq("id", user.id);

      if (updError) {
        console.error("profile update error:", updError.message);
        return res;
      }

      // 4-5) credit_transactions 기록 (중요: 여기 reason에 signup_reward)
      const { error: txError } = await adminSupabase.from("credit_transactions").insert({
        user_id: user.id,
        tx_type: "bonus",
        source: "system",
        delta_total: delta,
        delta_free: delta,
        delta_paid: 0,
        balance_total_after: newTotal,
        balance_free_after: newFree,
        balance_paid_after: newPaid,
        reason: "signup_reward",
      });

      if (txError) {
        console.error("credit_transactions insert error:", txError.message);
        // 여기서 return 해도 되지만, 프로필은 이미 올랐으니… 정책적으로 선택
      }

      // 4-6) notifications insert
      const { error: nError } = await adminSupabase.from("notifications").insert({
        user_id: user.id,
        category: "system",
        status: "approved",
        event_type: "signup_reward",
        title_key: "notifications.signup_reward.title",
        message_key: "notifications.signup_reward.message",
        params: { credits: delta },
        delta_credits: delta,
        is_read: false,
        source: "system",
        dedupe_key: `signup_reward:${user.id}`, // 선택
      });

      if (nError) {
        console.error("notifications insert error:", nError.message);
      }
    }
  }

  return res;
}
