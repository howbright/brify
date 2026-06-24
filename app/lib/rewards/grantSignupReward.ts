// app/lib/rewards/grantSignupReward.ts
import "server-only";
import { adminSupabase } from "@/utils/supabase/admin";

type GrantSignupRewardResult =
  | { ok: true; alreadyGranted: true; granted: 0 }
  | { ok: true; alreadyGranted: false; granted: number }
  | { ok: false; error: string; detail?: string };

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
    return { ok: true, alreadyGranted: true, granted: 0 };
  }

  return { ok: true, alreadyGranted: false, granted: rewardRow.granted };
}
