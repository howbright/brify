import { headers } from "next/headers";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AppShell from "@/components/layout/AppShell";
import { createClient } from "@/utils/supabase/server";

function shouldUseAuthedShell(pathname: string, locale: string) {
  return (
    pathname === `/${locale}/pricing` ||
    pathname === `/${locale}/blog` ||
    pathname.startsWith(`/${locale}/blog/`)
  );
}

export default async function PublicLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const h = await headers();
  const pathname = (h.get("x-pathname") ?? "").split("?")[0] || `/${locale}`;

  let email: string | null = null;
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (!error && user) {
      email = user.email ?? null;
    }
  } catch {
    email = null;
  }

  if (email && shouldUseAuthedShell(pathname, locale)) {
    return (
      <AppShell locale={locale} email={email}>
        <div className="[&>div]:!pt-4 [&>div]:md:!pt-4 [&>main]:!pt-4 [&>main]:md:!pt-4">
          {children}
        </div>
        <Footer />
      </AppShell>
    );
  }

  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
    </>
  );
}
