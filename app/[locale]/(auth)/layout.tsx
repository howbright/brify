'use client';

import { ReactNode } from 'react';
import Image from 'next/image';
import SimpleHeader from '@/components/layout/SimpleHeader.tsx';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <>
    <SimpleHeader/>
    <section className="relative pt-2 bg-[#f4f7f8] text-[#1f1f1f] dark:bg-[#111827] dark:text-white py-28 px-4 overflow-visible">
      {/* 🎨 공통 배경 SVG들 */}
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

      {/* 페이지별 콘텐츠 삽입 */}
      <div className="relative z-10">{children}</div>
    </section>
    </>
  );
}
