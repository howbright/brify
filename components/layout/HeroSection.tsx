"use client";

import Image from "next/image";
import { motion, useAnimation } from "framer-motion";
import { useEffect } from "react";
import GradientButton from "@/components/ui/GradientButton";

export default function HeroSection() {
  const controls = useAnimation();

  useEffect(() => {
    const timer = setTimeout(() => {
      controls.start("visible");
    }, 200);
    return () => clearTimeout(timer);
  }, [controls]);

  const textAnimation = {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: "easeOut", staggerChildren: 0.2 },
    },
  };

  const wordAnimation = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  return (
    <section className="relative z-20 bg-[#fdfaf6] py-24 px-4 overflow-hidden">
      {/* ✅ 배경 SVG */}
      <Image
        src="/images/hero1.svg"
        alt=""
        className="hidden sm:block  absolute top-[70px] left-[-20px] w-28 md:w-36 opacity-40 animate-floating pointer-events-none"
        aria-hidden="true"
        width={100}
        height={100}
      />
      <Image
        src="/images/hero2.svg"
        alt=""
        className="hidden sm:block  absolute bottom-[-30px] right-[-20px] w-32 md:w-40 opacity-40 animate-floating-reverse pointer-events-none"
        aria-hidden="true"
        width={100}
        height={100}
      />
      <Image
        src="/images/hero3.svg"
        alt=""
        className="hidden sm:block  absolute top-[100px] right-8 w-24 md:w-32 opacity-30 rotate-12 pointer-events-none"
        aria-hidden="true"
        width={100}
        height={100}
      />
      <Image
        src="/images/hero5.svg"
        alt=""
        className="hidden sm:block  absolute bottom-[-20px] left-6 w-20 md:w-28 opacity-30 pointer-events-none"
        aria-hidden="true"
        width={100}
        height={100}
      />

      <motion.div
        className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-12"
        initial="hidden"
        animate={controls}
        variants={textAnimation}
      >
        {/* ✅ 텍스트 영역 */}
        <div className="flex-1 text-center lg:text-left space-y-6">
          <motion.h1
            className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white leading-tight"
            variants={wordAnimation}
          >
            긴 콘텐츠, <span className="text-primary">빠르게 이해하세요</span>
          </motion.h1>
          <motion.p
            className="text-lg md:text-xl text-gray-700 dark:text-gray-300 max-w-xl leading-relaxed mx-auto lg:mx-0"
            variants={wordAnimation}
          >
            YouTube, 뉴스, 블로그, 논문까지 —
            <br />
            <strong className="text-black dark:text-white">Brify</strong>가 요점만 뽑아 정리해드립니다.
            <br />
            텍스트뿐 아니라 <strong className="text-black dark:text-white">다이어그램</strong>으로 시각화해 한눈에 이해!
          </motion.p>
          <motion.div variants={wordAnimation}>
            <GradientButton label="YouTube 링크 붙여넣고 시작하기" />
          </motion.div>
        </div>

        {/* ✅ 일러스트 영역 */}
        <motion.div
          className="flex-1 flex justify-center"
          animate={{
            y: [0, -6, 0, 6, 0],
            rotate: [0, -1, 0, 1, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <Image
            src="/images/hero-illustration2.png"
            alt="Brify 요약 서비스 일러스트"
            width={500}
            height={500}
            className="w-full max-w-sm md:max-w-md lg:max-w-lg h-auto"
            priority
          />
        </motion.div>
      </motion.div>
    </section>
  );
}
