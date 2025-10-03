// app/auth/callback/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/";

  const res = NextResponse.redirect(new URL(next, req.nextUrl));
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

  if (code) await supabase.auth.exchangeCodeForSession(code); // 🔐 서버에서 교환
  return res; // <- 이 응답에 쿠키가 실려 나감
}
