"use client";

import Image from "next/image";
import { motion, useAnimation } from "framer-motion";
import { useEffect, useState } from "react";
import GradientButton from "@/components/ui/GradientButton";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";

export default function HeroSection() {
  const controls = useAnimation();
  const router = useRouter();

  // ✅ 슬라이드 이미지 경로 배열
  const slideImages = ["/images/magic.png", "/images/hero-illustration2.png"];
  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      controls.start("visible");
    }, 200);

    // ✅ 이미지 자동 슬라이드
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % slideImages.length);
    }, 3000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
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
      {/* <Image
        src="/images/hero1.svg"
        alt=""
        className="hidden sm:block absolute top-[70px] left-[-20px] w-28 md:w-36 opacity-40 animate-floating pointer-events-none"
        aria-hidden="true"
        width={100}
        height={100}
      />
      <Image
        src="/images/hero2.svg"
        alt=""
        className="hidden sm:block absolute bottom-[-30px] right-[-20px] w-32 md:w-40 opacity-40 animate-floating-reverse pointer-events-none"
        aria-hidden="true"
        width={100}
        height={100}
      />
      <Image
        src="/images/hero3.svg"
        alt=""
        className="hidden sm:block absolute top-[100px] right-8 w-24 md:w-32 opacity-30 rotate-12 pointer-events-none"
        aria-hidden="true"
        width={100}
        height={100}
      />
      <Image
        src="/images/hero5.svg"
        alt=""
        className="hidden sm:block absolute bottom-[-20px] left-6 w-20 md:w-28 opacity-30 pointer-events-none"
        aria-hidden="true"
        width={100}
        height={100}
      /> */}

      <motion.div
        className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-0"
        initial="hidden"
        animate={controls}
        variants={textAnimation}
      >
        {/* ✅ 텍스트 영역 */}
        <div className="flex-1 text-center lg:text-left space-y-6">
          <motion.h1
            className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white leading-snug mb-6"
            variants={wordAnimation}
          >
            긴 콘텐츠, <span className="text-primary">빠르게 이해하세요</span>
          </motion.h1>
          <motion.p
            className="text-lg md:text-xl text-gray-700 dark:text-gray-300 max-w-xl leading-relaxed mx-auto lg:mx-0 mb-6"
            variants={wordAnimation}
          >
            YouTube, 뉴스, 블로그, 논문까지 —
            <br />
            <strong className="text-black dark:text-white">Brify</strong>가
            요점만 뽑아 정리해드립니다.
            <br />
            텍스트뿐 아니라{" "}
            <strong className="text-black dark:text-white">다이어그램</strong>
            으로 시각화해 한눈에 이해!
          </motion.p>
          <motion.div variants={wordAnimation} className="mt-6">
            <div className="flex flex-r gap-2">
              <GradientButton
                label={
                  <span className="block leading-tight">
                    무료로 <br className="sm:hidden" />
                    핵심정리 시작하기
                  </span>
                }
                onClick={() => router.push("/summarize")}
              />
              <button
                onClick={() => router.push("/summarize")}
                className="group inline-flex text-lg font-bold items-center gap-2 px-5 py-3 text-white bg-primary rounded-lg shadow hover:bg-primary-hover transition-all duration-200"
              >
                <span>데모 보기</span>
                <span className="inline-flex items-center transition-transform duration-300 group-hover:translate-x-1">
                  <Icon icon="mdi:play-circle-outline" width={20} />
                </span>
              </button>
            </div>
            <motion.p
              className="mt-4 text-sm font-medium text-primary text-center lg:text-left"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              <span className="inline-block px-3 py-1 bg-primary/10 rounded-md text-primary font-semibold">
                youtube 링크 또는 파일만 있으면
              </span>{" "}
              <span className="font-bold">요약이 시작됩니다!</span>
            </motion.p>
          </motion.div>
        </div>

        {/* ✅ 이미지 슬라이드 영역 */}
        <motion.div className="flex-1 flex justify-center relative min-h-[400px]">
          {slideImages.map((src, index) => (
            <motion.div
              key={index}
              className="absolute w-full h-full flex justify-center items-center"
              initial={false}
              animate={{
                opacity: currentImage === index ? 1 : 0,
                scale: currentImage === index ? 1 : 0.95,
              }}
              transition={{
                opacity: { duration: 0.8 },
                scale: { duration: 0.8 },
              }}
            >
              <Image
                src={src}
                alt={`Brify 요약 서비스 이미지 ${index + 1}`}
                width={500}
                height={500}
                className="w-full max-w-sm md:max-w-md lg:max-w-lg h-auto"
                priority={index === 0}
              />
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}
