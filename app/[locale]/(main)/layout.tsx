// app/[locale]/(main)/layout.tsx
import { redirect } from "next/navigation";
import FooterNew from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import { createClient } from "@/utils/supabase/server";

export default async function MainLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params; // ✅ 필요하면 쓰고, 아니면 안 써도 됨

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login`); // ✅ locale 라우트면 이게 더 안전
    // locale 안 쓰고 싶으면 redirect("/login")도 가능하지만,
    // 너 구조상 /ko/login /en/login 이면 위가 맞음
  }

  return (
    <>
      <Header />
      <div>{children}</div>
      <FooterNew />
    </>
  );
}
