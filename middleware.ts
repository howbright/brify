// middleware.ts
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing'; // locales, defaultLocale 등이 정의된 파일

export default createMiddleware({
  ...routing,
  localeDetection: true,  // ✅ Accept-Language 헤더 또는 쿠키 기반 자동 감지
  localeCookie: true      // ✅ NEXT_LOCALE 쿠키 자동 감지
});

export const config = {
  // Match all pathnames except for:
  // - API routes
  // - Static files
  // - Special Next.js paths
  matcher: '/((?!api|trpc|_next|_vercel|.*\\..*).*)'
};
