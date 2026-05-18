import { adminSupabase } from "@/utils/supabase/admin";

const PROFILE_SELECT =
  "terms_accepted, mind_theme_preference, credits_free, credits_paid";

type ProfileRow = {
  terms_accepted: boolean | null;
  mind_theme_preference: string | null;
  credits_free: number | null;
  credits_paid: number | null;
};

type ResolveTermsAccessParams = {
  userId: string;
  initialProfile: ProfileRow | null;
  initialProfileError: string | null;
  logPrefix: string;
  currentPath?: string;
};

export async function resolveTermsAccess({
  userId,
  initialProfile,
  initialProfileError,
  logPrefix,
  currentPath,
}: ResolveTermsAccessParams) {
  let resolvedProfile = initialProfile;

  if (!resolvedProfile || resolvedProfile.terms_accepted !== true) {
    const { data: fallbackProfile, error: fallbackError } = await adminSupabase
      .from("profiles")
      .select(PROFILE_SELECT)
      .eq("id", userId)
      .maybeSingle<ProfileRow>();

    if (!fallbackError && fallbackProfile) {
      resolvedProfile = fallbackProfile;
    }

    console.info(`${logPrefix} fallback-profile-check`, {
      userId,
      currentPath: currentPath ?? null,
      currentTermsAccepted: initialProfile?.terms_accepted ?? null,
      profileError: initialProfileError,
      fallbackTermsAccepted: fallbackProfile?.terms_accepted ?? null,
      fallbackCreditsFree: fallbackProfile?.credits_free ?? null,
      fallbackCreditsPaid: fallbackProfile?.credits_paid ?? null,
      fallbackError: fallbackError?.message ?? null,
    });
  }

  return resolvedProfile;
}
