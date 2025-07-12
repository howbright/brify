import createMiddleware from 'next-intl/middleware';
import { type NextRequest } from 'next/server';
import { routing } from './i18n/routing';
import { updateSession } from './utils/supabase/middleware';

// 🌍 i18n 라우팅 미들웨어 생성
const handleI18nRouting = createMiddleware({
  ...routing,
  localeDetection: true,
  localeCookie: true,
});

// 🔒 Supabase 세션 처리 + 🌍 언어 라우팅
export async function middleware(request: NextRequest) {
  const response = handleI18nRouting(request);
  return await updateSession(request, response);
}

// ✅ 지원 언어에 맞춰 matcher 수정
export const config = {
    // Match all pathnames except for:
  // - API routes
  // - Static files
  // - Special Next.js paths
  matcher: '/((?!api|trpc|_next|_vercel|.*\\..*).*)'

  // matcher: [
    
  //   '/',
  //   '/(en|ko|ja|zh-CN|zh-TW|es|fr)/:path*',
  // ],
};
