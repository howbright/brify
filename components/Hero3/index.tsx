'use client';

import Image from "next/image";
import Link from "next/link";
import { useTranslations } from 'next-intl';
import GradientButton from "../ui/GradientButton";

export default function Hero3() {
  const t = useTranslations('hero'); // 💬 'hero' namespace 사용

  return (
    <section className="relative pt-44 font-global bg-[#f4f7f8] text-[#1f1f1f] dark:bg-[#111827] dark:text-white py-28 px-4 overflow-visible">
      {/* 🎨 배경 SVGs */}
      <Image
        src="/images/hero1.svg"
        alt=""
        className="absolute top-[70px] left-[-20px] w-28 md:w-36 opacity-40 animate-floating pointer-events-none"
        aria-hidden="true"
        width={100}
        height={100}
      />
      <Image
        src="/images/hero2.svg"
        alt=""
        className="absolute bottom-[-30px] right-[-20px] w-32 md:w-40 opacity-40 animate-floating-reverse pointer-events-none"
        aria-hidden="true"
        width={100}
        height={100}
      />
      <Image
        src="/images/hero3.svg"
        alt=""
        className="absolute top-[100px] right-8 w-24 md:w-32 opacity-30 rotate-12 pointer-events-none"
        aria-hidden="true"
        width={100}
        height={100}
      />
      <Image
        src="/images/hero5.svg"
        alt=""
        className="absolute bottom-[-20px] left-6 w-20 md:w-28 opacity-30 pointer-events-none"
        aria-hidden="true"
        width={100}
        height={100}
      />

      {/* 🧠 콘텐츠 */}
      <div className="relative z-10 max-w-5xl mx-auto text-center flex flex-col items-center gap-10">
        <h1 className="text-5xl md:text-6xl font-extrabold leading-tight tracking-tight">
          {t('title1')}
          <br />
          <span className="bg-gradient-to-r leading-normal from-[#0ea5e9] via-[#3b82f6] to-[#6366f1] bg-clip-text text-transparent">
            {t('title2')}
          </span>
        </h1>

        <p className="text-lg md:text-xl leading-relaxed max-w-3xl text-[#444] dark:text-gray-300">
          {t('description1')}
          <br />
          <span className="font-semibold">
            {t('description2')}
          </span>
          <br />
          <span className="mt-4 inline-block">
            ⏱ <strong className="text-[#0ea5e9]">{t('benefits.time')}</strong>, 📚{" "}
            <strong className="text-[#3b82f6]">{t('benefits.knowledge')}</strong>, 🎯{" "}
            <strong className="text-[#6366f1]">{t('benefits.accuracy')}</strong>
          </span>
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center mt-4">
          <GradientButton label={t('button_summarize')}/>
          {/* <Link
            href="/summarize"
            className="px-8 py-4 text-lg font-semibold rounded-xl bg-[#1f1f1f] text-white transition
             hover:scale-105 hover:shadow-xl"
          >
            {t('button_summarize')}
          </Link> */}

          {/* <Link
            href="/guide"
            className="px-8 py-4 text-lg font-semibold rounded-xl border border-[#1f1f1f] text-[#1f1f1f] hover:scale-105 hover:shadow-xl transition dark:border-white dark:text-white dark:hover:bg-[#1f1f1f]"
          >
            {t('button_guide')}
          </Link> */}
        </div>
      </div>
    </section>
  );
}
