// app/[locale]/(onboarding)/layout.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import OnboardingHeader from "@/components/layout/OnboardingLayout";

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 온보딩 페이지는 "로그인"은 되어 있어야 의미가 있음
  if (!user) redirect(`/login`);

  return (
    <>
      <OnboardingHeader />
      <div>{children}</div>
    </>
  );
}
