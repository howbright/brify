// components/layout/OnboardingHeader.tsx
import { createClient } from "@/utils/supabase/server";
import OnboardingHeaderClient from "./OnboardingHeaderClient";

export default async function OnboardingHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <OnboardingHeaderClient email={user?.email ?? null} />;
}
