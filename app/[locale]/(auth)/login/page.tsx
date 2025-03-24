'use client';

import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import Image from 'next/image';

export default function Login() {
  const t = useTranslations('login');

  return (
    <section className="bg-white dark:bg-black text-gray-900 dark:text-white">
      <div className="max-w-screen-xl px-4 py-8 mx-auto sm:py-16 lg:py-24 pt-20 sm:pt-24 lg:pt-32">
        <div className="lg:grid lg:gap-20 lg:items-center lg:grid-cols-12">
          <div className="hidden col-span-6 mr-auto lg:block">
            <Link href="/" className="inline-flex items-center mb-10 text-3xl font-black uppercase tracking-tight">
              <Image
                src="/images/logo.svg"
                className="mr-3 h-12"
                alt="Brify Logo"
                width={300}
                height={300}
              />
            </Link>

            <div className="space-y-8">
              {[
                {
                  title: 'Get started quickly',
                  description:
                    'Integrate with developer-friendly APIs or choose pre-built solutions.',
                },
                {
                  title: 'Support any business model',
                  description:
                    'Host code that you don’t want to share with the world in private.',
                },
                {
                  title: 'Join millions of businesses',
                  description:
                    'Flowbite is trusted by ambitious startups and enterprises of every size.',
                },
              ].map((item, idx) => (
                <div key={idx} className="flex items-start">
                  <div className="w-5 h-5 mr-3 mt-1 border border-primary rounded-full bg-primary" />
                  <div>
                    <h3 className="text-lg font-bold">{item.title}</h3>
                    <p className="mt-1 text-gray-600 dark:text-gray-400 text-sm">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="w-full col-span-6 mx-auto border border-gray-900 dark:border-white/20 bg-white dark:bg-black rounded-sm shadow-none sm:max-w-lg">
            <div className="p-6 sm:p-8 space-y-6">
              <h1 className="text-2xl font-black uppercase tracking-tight">{t('title')}</h1>

              {/* 소셜 로그인 버튼 */}
              <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:space-x-4">
                {/* Google */}
                <Link
                  href="#"
                  className="flex items-center justify-center w-full border border-gray-900 rounded-sm py-2.5 px-5 text-sm font-medium hover:bg-black hover:text-white transition-colors"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    viewBox="0 0 21 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <g clipPath="url(#clip0)">
                      <path
                        d="M20.3081 10.2303C20.3081 9.55056 20.253 8.86711 20.1354 8.19836H10.7031V12.0492H16.1046C15.8804 13.2911 15.1602 14.3898 14.1057 15.0879V17.5866H17.3282C19.2205 15.8449 20.3081 13.2728 20.3081 10.2303Z"
                        fill="#3F83F8"
                      />
                      <path
                        d="M10.7019 20.0006C13.3989 20.0006 15.6734 19.1151 17.3306 17.5865L14.1081 15.0879C13.2115 15.6979 12.0541 16.0433 10.7056 16.0433C8.09669 16.0433 5.88468 14.2832 5.091 11.9169H1.76562V14.4927C3.46322 17.8695 6.92087 20.0006 10.7019 20.0006V20.0006Z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.08857 11.9169C4.66969 10.6749 4.66969 9.33008 5.08857 8.08811V5.51233H1.76688C0.348541 8.33798 0.348541 11.667 1.76688 14.4927L5.08857 11.9169V11.9169Z"
                        fill="#FBBC04"
                      />
                      <path
                        d="M10.7019 3.95805C12.1276 3.936 13.5055 4.47247 14.538 5.45722L17.393 2.60218C15.5852 0.904587 13.1858 -0.0287217 10.7019 0.000673888C6.92087 0.000673888 3.46322 2.13185 1.76562 5.51234L5.08732 8.08813C5.87733 5.71811 8.09302 3.95805 10.7019 3.95805V3.95805Z"
                        fill="#EA4335"
                      />
                    </g>
                    <defs>
                      <clipPath id="clip0">
                        <rect width="20" height="20" fill="white" transform="translate(0.5)" />
                      </clipPath>
                    </defs>
                  </svg>
                  {t('google')}
                </Link>

                {/* GitHub */}
                <Link
                  href="#"
                  className="flex items-center justify-center w-full border border-gray-900 rounded-sm py-2.5 px-5 text-sm font-medium hover:bg-black hover:text-white transition-colors"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M12.026 2c-5.509 0-9.974 4.465-9.974 9.974 0 4.406 2.857 8.145 6.821 9.465.499.09.679-.217.679-.481 0-.237-.008-.865-.011-1.696-2.775.602-3.361-1.338-3.361-1.338-.452-1.152-1.107-1.459-1.107-1.459-.905-.619.069-.605.069-.605 1.002.07 1.527 1.028 1.527 1.028.89 1.524 2.336 1.084 2.902.829.091-.645.351-1.085.635-1.334-2.214-.251-4.542-1.107-4.542-4.93 0-1.087.389-1.979 1.024-2.675-.101-.253-.446-1.268.099-2.64 0 0 .837-.269 2.742 1.021a9.582 9.582 0 0 1 2.496-.336 9.554 9.554 0 0 1 2.496.336c1.906-1.291 2.742-1.021 2.742-1.021.545 1.372.203 2.387.099 2.64.64.696 1.024 1.587 1.024 2.675 0 3.833-2.33 4.675-4.552 4.922.355.308.675.916.675 1.846 0 1.334-.012 2.41-.012 2.737 0 .267.178.577.687.479C19.146 20.115 22 16.379 22 11.974 22 6.465 17.535 2 12.026 2z"
                    ></path>
                  </svg>
                  {t('github')}
                </Link>
              </div>

              {/* Divider */}
              <div className="flex items-center text-xs font-semibold uppercase text-gray-500 tracking-wider">
                <div className="flex-grow border-t border-gray-300"></div>
                <span className="px-4">{t('or')}</span>
                <div className="flex-grow border-t border-gray-300"></div>
              </div>

              {/* 로그인 폼 */}
              <form className="space-y-5" action="#">
                <div>
                  <label htmlFor="email" className="block mb-1 text-sm font-medium">
                    {t('email.label')}
                  </label>
                  <input
                    type="email"
                    id="email"
                    placeholder={t('email.placeholder')}
                    className="w-full border border-gray-900 rounded-sm p-2.5 bg-white dark:bg-black dark:border-white/20 focus:outline-none focus:ring-1 focus:ring-black"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="password" className="block mb-1 text-sm font-medium">
                    {t('password.label')}
                  </label>
                  <input
                    type="password"
                    id="password"
                    placeholder={t('password.placeholder')}
                    className="w-full border border-gray-900 rounded-sm p-2.5 bg-white dark:bg-black dark:border-white/20 focus:outline-none focus:ring-1 focus:ring-black"
                    required
                  />
                </div>

                <div className="flex justify-between text-sm">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="w-4 h-4 border border-gray-900 dark:border-white/20"
                      required
                    />
                    {t('remember')}
                  </label>
                  <Link href="#" className="hover:underline">
                    {t('forgot')}
                  </Link>
                </div>

                <button
                  type="submit"
                  className="w-full bg-primary text-white border border-gray-900 rounded-sm py-2.5 text-sm font-bold uppercase hover:bg-white hover:text-black transition-colors"
                >
                  {t('submit')}
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
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
