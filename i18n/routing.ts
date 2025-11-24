import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  // ✅ 여기에 지원할 모든 언어 추가
  locales: ['en', 'ko'],

  // ✅ 기본 언어 설정 (예: 영어)
  defaultLocale: 'en',
});
