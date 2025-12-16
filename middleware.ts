import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";
import { updateSession } from "./utils/supabase/middleware";

// 🌍 i18n 라우팅 미들웨어 생성
const handleI18nRouting = createMiddleware({
  ...routing,
  localeDetection: true,
  localeCookie: true,
});

// 🔒 Supabase 세션 처리 + 🌍 언어 라우팅
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // ✅ /auth/* 는 i18n 라우팅을 건너뛰고, 세션 갱신만
  if (pathname.startsWith("/auth")) {
    const res = NextResponse.next();
    return await updateSession(request, res);
  }

  const response = handleI18nRouting(request);
  return await updateSession(request, response);
}

// ✅ 지원 언어에 맞춰 matcher 수정
export const config = {
  matcher: ["/((?!api|trpc|_next|_vercel|.*\\..*).*)", "/auth/:path*"],
};

// matcher: [

//   '/',
//   '/(en|ko)/:path*',
// ],
