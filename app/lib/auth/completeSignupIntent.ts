import { grantSignupReward } from "@/app/lib/rewards/grantSignupReward";
import { adminSupabase } from "@/utils/supabase/admin";

type CompleteSignupIntentParams = {
  userId: string;
  email: string | null;
  locale: string;
  logPrefix: string;
};

export async function completeSignupIntent({
  userId,
  email,
  locale,
  logPrefix,
}: CompleteSignupIntentParams) {
  const { data: beforeProfile, error: beforeError } = await adminSupabase
    .from("profiles")
    .select("terms_accepted")
    .eq("id", userId)
    .maybeSingle();

  if (beforeError) {
    console.error(`${logPrefix} signup-intent-profile-read-failed`, {
      userId,
      error: beforeError.message,
    });
    return;
  }

  if (beforeProfile?.terms_accepted === true) {
    return;
  }

  const { error: upsertError } = await adminSupabase.from("profiles").upsert(
    {
      id: userId,
      email,
      locale,
      terms_accepted: true,
    },
    { onConflict: "id" }
  );

  if (upsertError) {
    console.error(`${logPrefix} signup-intent-profile-upsert-failed`, {
      userId,
      error: upsertError.message,
    });
    return;
  }

  const rewardResult = await grantSignupReward({
    userId,
    locale,
    reward: 15,
  });

  if (!rewardResult.ok) {
    console.error(`${logPrefix} signup-intent-reward-failed`, {
      userId,
      error: rewardResult.error,
      detail: rewardResult.detail,
    });
  }
}
