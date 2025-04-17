'use client';

import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import {
  Modal,
  ModalContent,
  ModalClose,
} from '@/components/ui/modal';
import { X } from 'lucide-react';

export default function LoginPromptModal({ show, onClose }: { show: boolean; onClose: () => void }) {
  const t = useTranslations('login');

  return (
    <Modal open={show} onOpenChange={onClose}>
      <ModalContent className="relative bg-[#f4f7f8] text-[#1f1f1f] dark:bg-[#111827] dark:text-white px-4 overflow-hidden rounded-lg max-w-5xl w-full mx-auto">
        {/* ✖ 닫기 버튼 */}
        <ModalClose asChild>
          <button
            className="absolute top-4 right-4 z-10 text-gray-500 hover:text-red-500"
            aria-label="닫기"
          >
            <X className="w-6 h-6" />
          </button>
        </ModalClose>

        {/* 배경 SVG */}
        <Image
          src="/images/hero1.svg"
          alt=""
          className="absolute top-[30px] left-[-20px] w-28 md:w-36 opacity-40 animate-floating pointer-events-none"
          aria-hidden="true"
          width={100}
          height={100}
        />
        <Image
          src="/images/hero2.svg"
          alt=""
          className="absolute bottom-[30px] right-[-20px] w-32 md:w-40 opacity-40 animate-floating-reverse pointer-events-none"
          aria-hidden="true"
          width={100}
          height={100}
        />
        <Image
          src="/images/hero3.svg"
          alt=""
          className="absolute top-[50px] right-8 w-24 md:w-32 opacity-30 rotate-12 pointer-events-none"
          aria-hidden="true"
          width={100}
          height={100}
        />
        <Image
          src="/images/hero5.svg"
          alt=""
          className="absolute bottom-[20px] left-6 w-20 md:w-28 opacity-30 pointer-events-none"
          aria-hidden="true"
          width={100}
          height={100}
        />

        <div className="max-w-(--breakpoint-xl) w-full mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 items-center py-20">
          {/* 좌측 설명 */}
          <div className="px-6 md:px-12">
            <Link href="/" className="inline-flex items-center mb-10 text-3xl font-black uppercase tracking-tight">
              <Image
                src="/images/logo.png"
                className="mr-3 h-12"
                alt="Brify Logo"
                width={300}
                height={300}
              />
            </Link>

            <h2 className="text-3xl font-extrabold mb-6 leading-tight">
              Brify는 단순한 핵심정리기가 아닙니다.
            </h2>

            <ul className="space-y-4 text-gray-700 dark:text-gray-300 text-base">
              <li>💡 당신의 시간과 집중을 아껴주는 AI 비서</li>
              <li>⏱ 긴 글을 10초 안에 핵심정리</li>
              <li>📺 뉴스, 블로그, 논문, 유튜브까지 지원</li>
              <li>🎯 더 빠르게 이해하고, 더 똑똑하게 선택</li>
            </ul>
          </div>

          {/* 우측 로그인 폼 */}
          <div className="px-6 md:px-12 w-full max-w-lg mx-auto border border-gray-900 dark:border-white/20 bg-white dark:bg-black rounded-lg shadow-lg">
            <div className="p-6 sm:p-8 space-y-6">
              <h1 className="text-2xl font-black uppercase tracking-tight">{t('title')}</h1>

              {/* 소셜 로그인 */}
              <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:space-x-4">
                <Link
                  href="#"
                  className="flex items-center justify-center w-full border border-gray-900 rounded-lg py-2.5 px-5 text-sm font-medium hover:bg-black hover:text-white transition-colors"
                >
                  <Image src="/images/google-icon.svg" alt="Google" width={20} height={20} className="mr-2" />
                  {t('google')}
                </Link>
                <Link
                  href="#"
                  className="flex items-center justify-center w-full border border-gray-900 rounded-lg py-2.5 px-5 text-sm font-medium hover:bg-black hover:text-white transition-colors"
                >
                  <Image src="/images/apple-icon.svg" alt="Apple" width={20} height={20} className="mr-2" />
                  Sign in with Apple
                </Link>
              </div>

              {/* 구분선 */}
              <div className="flex items-center text-xs font-semibold uppercase text-gray-500 tracking-wider">
                <div className="grow border-t border-gray-300"></div>
                <span className="px-4">{t('or')}</span>
                <div className="grow border-t border-gray-300"></div>
              </div>

              {/* 이메일 로그인 */}
              <form className="space-y-5" action="#">
                <div>
                  <label htmlFor="email" className="block mb-1 text-sm font-medium">
                    {t('email.label')}
                  </label>
                  <input
                    type="email"
                    id="email"
                    placeholder={t('email.placeholder')}
                    className="w-full border border-gray-900 rounded-lg p-2.5 bg-white dark:bg-black dark:border-white/20 focus:outline-hidden focus:ring-1 focus:ring-black"
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
            </div>
          </div>
        </div>
      </ModalContent>
    </Modal>
  );
}
