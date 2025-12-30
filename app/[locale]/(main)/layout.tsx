// app/[locale]/(main)/layout.ts
import { redirect } from "next/navigation";
import FooterNew from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import { createClient } from "@/utils/supabase/server";

export default async function MainLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const supabase = await createClient();

  // 서버에서 현재 유저 확인
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 미로그인 -> 로그인 페이지로
  if (!user) {
    redirect(`/login`);
  }

  return (
    <>
      <Header />
      <div>{children}</div>
      <FooterNew />
    </>
  );
}
