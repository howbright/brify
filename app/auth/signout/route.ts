// app/auth/signout/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function POST(req: NextRequest) {
  const requestedLocale = req.nextUrl.searchParams.get("locale");
  const allowedLocales = new Set(["ko", "en", "fr"]);
  const locale =
    requestedLocale && allowedLocales.has(requestedLocale)
      ? requestedLocale
      : "en";

  // Use 303 after POST so the browser follows with GET.
  const res = NextResponse.redirect(new URL(`/${locale}`, req.nextUrl), 303);
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (cookiesToSet) => cookiesToSet.forEach(({name, value, options}) =>
          res.cookies.set(name, value, options)
        ),
      },
    }
  );
  await supabase.auth.signOut();
  return res;
}
