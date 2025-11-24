import { ReactNode } from 'react';
import Image from 'next/image';
// import SimpleHeader from '@/components/layout/SimpleHeader.tsx';
import Header from '@/components/layout/Header';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <>
    <Header/>
    <section className="relative pt-2 bg-[#f4f7f8] text-[#1f1f1f] dark:bg-[#111827] dark:text-white py-28 px-4 overflow-visible">
      {/* 페이지별 콘텐츠 삽입 */}
      <div className="relative z-10">{children}</div>
    </section>
    </>
  );
}
