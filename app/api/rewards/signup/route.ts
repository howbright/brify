// app/api/rewards/signup/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { adminSupabase } from "@/utils/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * POST /api/rewards/signup
 * ✅ body 필요 없음
 * - 현재 로그인된 유저(auth.uid)를 기준으로 가입 보상 지급
 * - 중복 판단: credit_transactions.reason === "signup_reward"
 */
export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.user?.id) {
      return NextResponse.json(
        { ok: false, error: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // 1) ✅ 중복 판단: signup_reward transaction이 이미 있는지 확인
    const { data: existingTx, error: existingErr } = await adminSupabase
      .from("credit_transactions")
      .select("id")
      .eq("user_id", userId)
      .eq("reason", "signup_reward")
      .limit(1);

    if (existingErr) {
      return NextResponse.json(
        { ok: false, error: existingErr.message },
        { status: 500 }
      );
    }

    if (existingTx && existingTx.length > 0) {
      return NextResponse.json(
        { ok: true, alreadyGranted: true },
        { status: 200 }
      );
    }

    // 2) 현재 잔액 읽기
    const { data: profile, error: profileErr } = await adminSupabase
      .from("profiles")
      .select("credits_free, credits_paid")
      .eq("id", userId)
      .maybeSingle();

    if (profileErr) {
      return NextResponse.json(
        { ok: false, error: profileErr.message },
        { status: 500 }
      );
    }

    const currentFree = Number(profile?.credits_free ?? 0);
    const currentPaid = Number(profile?.credits_paid ?? 0);

    const bonus = 10;
    const nextFree = currentFree + bonus;
    const nextPaid = currentPaid;
    const nextTotal = nextFree + nextPaid;

    // 3) profiles 업데이트 (없으면 만들어져 있을 거라 가정하지만, 안전하게 upsert도 가능)
    const { error: updateErr } = await adminSupabase
      .from("profiles")
      .update({ credits_free: nextFree })
      .eq("id", userId);

    if (updateErr) {
      return NextResponse.json(
        { ok: false, error: updateErr.message },
        { status: 500 }
      );
    }

    // 4) credit_transactions 로그 insert
    const { error: txErr } = await adminSupabase.from("credit_transactions").insert(
      {
        user_id: userId,
        tx_type: "bonus",
        source: "system",
        delta_total: bonus,
        delta_free: bonus,
        delta_paid: 0,
        balance_total_after: nextTotal,
        balance_free_after: nextFree,
        balance_paid_after: nextPaid,
        reason: "signup_reward",
        payment_id: null,
        summary_id: null,
      }
    );

    if (txErr) {
      return NextResponse.json(
        { ok: false, error: txErr.message },
        { status: 500 }
      );
    }

    // 5) notifications insert
    await adminSupabase.from("notifications").insert({
      user_id: userId,
      category: "system",
      status: "approved",
      event_type: "signup_reward",
      title_key: "notifications.signup_reward.title",
      message_key: "notifications.signup_reward.message",
      params: { credits: bonus },
      delta_credits: bonus,
      source: "system",
      entity_id: null,
      dedupe_key: `signup_reward:${userId}`, // optional
    });

    return NextResponse.json(
      { ok: true, alreadyGranted: false, granted: bonus },
      { status: 200 }
    );
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
