'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export default function LoginForm() {
  const t = useTranslations('login');

  return (
    <form className="space-y-5" action="#">
      <div>
        <label htmlFor="email" className="block mb-1 text-sm font-medium">
          {t('email.label')}
        </label>
        <input
          type="email"
          id="email"
          placeholder={t('email.placeholder')}
          className="w-full border border-gray-900 rounded-lg p-2.5 bg-white dark:bg-black dark:border-white/20 focus:outline-none focus:ring-1 focus:ring-black"
          required
        />
      </div>

      <button
        type="submit"
        className="w-full bg-primary text-white border border-gray-900 rounded-lg py-2.5 text-sm font-bold uppercase hover:bg-white hover:text-black transition-colors"
      >
        매직링크 보내기
      </button>

      <p className="text-sm text-center text-gray-600 dark:text-gray-400">
        {t('signup.question')}{' '}
        <Link
          href="/signup"
          className="font-semibold hover:underline text-black dark:text-white"
        >
          {t('signup.link')}
        </Link>
      </p>
    </form>
  );
}
