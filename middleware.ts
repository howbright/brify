import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";
import { updateSession } from "./utils/supabase/middleware";

// 🌍 i18n 라우팅 미들웨어 생성
const handleI18nRouting = createMiddleware({
  ...routing,
  localeDetection: false,
  localeCookie: true,
});

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // ✅ next로 쓰기 좋은 "현재 경로(+쿼리)" (locale prefix 포함된 최종 pathname이 필요하면,
  // handleI18nRouting 이후의 response url을 쓰는 방식도 가능하지만, 일단 이걸로 충분)
  const currentPath = pathname + (search || "");

  // ✅ /auth/* 는 i18n 라우팅을 건너뛰고, 세션 갱신만
  if (pathname.startsWith("/auth")) {
    const res = NextResponse.next();
    res.headers.set("x-pathname", currentPath); // ✅ 추가
    return await updateSession(request, res);
  }

  // When locale prefix is missing (e.g. "/maps"), prefer NEXT_LOCALE cookie
  // so users stay on their selected language after auth redirects.
  const hasLocalePrefix = routing.locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)
  );
  if (!hasLocalePrefix) {
    const cookieLocale = request.cookies.get("NEXT_LOCALE")?.value;
    const isSupportedLocale =
      !!cookieLocale && routing.locales.includes(cookieLocale as (typeof routing.locales)[number]);
    if (isSupportedLocale) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = `/${cookieLocale}${pathname === "/" ? "" : pathname}`;
      const redirectResponse = NextResponse.redirect(redirectUrl);
      redirectResponse.headers.set("x-pathname", currentPath);
      return await updateSession(request, redirectResponse);
    }
  }

  const response = handleI18nRouting(request);
  response.headers.set("x-pathname", currentPath); // ✅ 추가
  return await updateSession(request, response);
}

export const config = {
  matcher: ["/((?!api|trpc|_next|_vercel|.*\\..*).*)", "/auth/:path*"],
};
