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

  const response = handleI18nRouting(request);
  response.headers.set("x-pathname", currentPath); // ✅ 추가
  return await updateSession(request, response);
}

export const config = {
  matcher: ["/((?!api|trpc|_next|_vercel|.*\\..*).*)", "/auth/:path*"],
};
