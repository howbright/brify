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

async function ensureSignupRewardNotification(params: {
  userId: string;
  reward: number;
}) {
  const { userId, reward } = params;
  const dedupeKey = `signup_reward:${userId}`;

  const { data: existingNotification, error: existingNotificationError } =
    await adminSupabase
      .from("notifications")
      .select("id")
      .eq("dedupe_key", dedupeKey)
      .limit(1);

  if (existingNotificationError) {
    console.error("[notifications.signup_reward.check] FAILED", {
      message: existingNotificationError.message,
      details: (existingNotificationError as any).details,
      hint: (existingNotificationError as any).hint,
      code: (existingNotificationError as any).code,
      userId,
      dedupeKey,
    });
    return;
  }

  if (existingNotification && existingNotification.length > 0) {
    return;
  }

  const category: NotificationCategory = "system";
  const status: NotificationStatus = "approved";
  const eventType: NotificationEventType = "signup_bonus";

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
      dedupe_key: dedupeKey,
      is_read: false,
    })
    .select()
    .single();

  if (notifError?.code === "23505") {
    console.info("[notifications.signup_reward.insert] duplicate ignored", {
      userId,
      dedupeKey,
    });
  } else if (notifError) {
    console.error("[notifications.signup_reward.insert] FAILED", {
      message: notifError.message,
      details: (notifError as any).details,
      hint: (notifError as any).hint,
      code: (notifError as any).code,
      userId,
      reward,
      dedupeKey,
    });
  } else {
    console.log("[notifications.signup_reward.insert] OK", notifData);
  }
}

export async function grantSignupReward(params: {
  userId: string;
  locale?: string;
  reward?: number; // 기본 15
}): Promise<GrantSignupRewardResult> {
  const userId = params.userId;
  const reward = Number(params.reward ?? 15);

  if (!userId) return { ok: false, error: "MISSING_USER_ID" };
  if (!Number.isFinite(reward) || reward <= 0)
    return { ok: false, error: "BAD_REWARD" };

  const { data: rewardRows, error: rewardError } = await adminSupabase.rpc(
    "grant_signup_reward_once",
    {
      p_user_id: userId,
      p_reward: reward,
    }
  );

  if (rewardError) {
    return {
      ok: false,
      error: "SIGNUP_REWARD_RPC_FAILED",
      detail: rewardError.message,
    };
  }

  const rewardRow = Array.isArray(rewardRows) ? rewardRows[0] : null;
  if (!rewardRow) {
    return { ok: false, error: "SIGNUP_REWARD_EMPTY_RESULT" };
  }

  if (rewardRow.already_granted) {
    await ensureSignupRewardNotification({ userId, reward });
    return { ok: true, alreadyGranted: true, granted: 0 };
  }

  await ensureSignupRewardNotification({ userId, reward });

  return { ok: true, alreadyGranted: false, granted: rewardRow.granted };
}
