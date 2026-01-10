// app/lib/rewards/grantSignupReward.ts
import "server-only";
import { adminSupabase } from "@/utils/supabase/admin";
import type {
  NotificationCategory,
  NotificationStatus,
  NotificationEventType,
} from "@/app/types/notice";

type GrantSignupRewardResult =
  | { ok: true; alreadyGranted: true; granted: 0 }
  | { ok: true; alreadyGranted: false; granted: number }
  | { ok: false; error: string; detail?: string };

export async function grantSignupReward(params: {
  userId: string;
  locale?: string;
  reward?: number; // 기본 10
}): Promise<GrantSignupRewardResult> {
  const userId = params.userId;
  const locale = params.locale ?? "en";
  const reward = Number(params.reward ?? 10);

  if (!userId) return { ok: false, error: "MISSING_USER_ID" };
  if (!Number.isFinite(reward) || reward <= 0)
    return { ok: false, error: "BAD_REWARD" };

  // 1) ✅ 중복 판단
  const { data: existingTx, error: existingErr } = await adminSupabase
    .from("credit_transactions")
    .select("id")
    .eq("user_id", userId)
    .eq("reason", "signup_reward")
    .limit(1);

  if (existingErr) {
    return { ok: false, error: "TX_CHECK_FAILED", detail: existingErr.message };
  }

  if (existingTx && existingTx.length > 0) {
    return { ok: true, alreadyGranted: true, granted: 0 };
  }

  // 2) 현재 잔액 읽기
  const { data: profile, error: profileErr } = await adminSupabase
    .from("profiles")
    .select("credits_free, credits_paid")
    .eq("id", userId)
    .maybeSingle();

  if (profileErr) {
    return {
      ok: false,
      error: "PROFILE_READ_FAILED",
      detail: profileErr.message,
    };
  }

  const currentFree = Number(profile?.credits_free ?? 0);
  const currentPaid = Number(profile?.credits_paid ?? 0);

  const nextFree = currentFree + reward;
  const nextPaid = currentPaid;
  const nextTotal = nextFree + nextPaid;

  // 3) profiles 업데이트
  const { error: updateErr } = await adminSupabase
    .from("profiles")
    .update({ credits_free: nextFree, credits_paid: nextPaid, locale })
    .eq("id", userId);

  if (updateErr) {
    return {
      ok: false,
      error: "PROFILE_UPDATE_FAILED",
      detail: updateErr.message,
    };
  }

  // 4) credit_transactions 로그 insert
  const { error: txErr } = await adminSupabase
    .from("credit_transactions")
    .insert({
      user_id: userId,
      tx_type: "bonus",
      source: "system",
      delta_total: reward,
      delta_free: reward,
      delta_paid: 0,
      balance_total_after: nextTotal,
      balance_free_after: nextFree,
      balance_paid_after: nextPaid,
      reason: "signup_reward",
      payment_id: null,
      summary_id: null,
    });

  if (txErr) {
    return { ok: false, error: "TX_INSERT_FAILED", detail: txErr.message };
  }

  // ✅ 실수 방지: DB 제약과 동일한 union type을 써서 event_type을 고정
  const category: NotificationCategory = "system";
  const status: NotificationStatus = "approved";
  const eventType: NotificationEventType = "signup_bonus"; // 👈 여기서 signup_reward 같은 오타가 컴파일 에러로 잡힘

  // 5) notifications insert (실패해도 치명적이진 않게)
  const { data: notifData, error: notifError } = await adminSupabase
    .from("notifications")
    .insert({
      user_id: userId,
      category,
      status,
      event_type: eventType,
      title_key: "notifications.signup_reward.title",
      message_key: "notifications.signup_reward.message",
      params: { credits: reward },
      delta_credits: reward,
      source: "system",
      entity_id: null,
      dedupe_key: `signup_reward:${userId}`,
      is_read: false,
    })
    .select()
    .single();

  if (notifError) {
    console.error("[notifications.insert] FAILED", {
      message: notifError.message,
      details: (notifError as any).details,
      hint: (notifError as any).hint,
      code: (notifError as any).code,
      userId,
      reward,
      dedupe_key: `signup_reward:${userId}`,
    });
  } else {
    console.log("[notifications.insert] OK", notifData);
  }

  return { ok: true, alreadyGranted: false, granted: reward };
}
