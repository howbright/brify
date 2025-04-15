"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import GradientButton from "../ui/GradientButton";
import { motion, useAnimation } from "framer-motion";
import { useEffect } from "react";

export default function Hero3() {
  const t = useTranslations("hero");
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

  const specialAnimation = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: {
      scale: [1.2, 1], // 확대 후 축소
      opacity: 1,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  return (
    <section className="relative pt-20 font-global bg-[#f4f7f8] text-[#1f1f1f] dark:bg-[#111827] dark:text-white px-4 overflow-visible">
      {/* 배경 SVG들 */}
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

      {/* 콘텐츠 */}
      <motion.div
        className="relative z-10 max-w-5xl mx-auto text-center flex flex-col items-center gap-10"
        initial="hidden"
        animate={controls}
        variants={textAnimation}
      >
        <motion.div
          className="relative z-10 max-w-5xl mx-auto text-center flex flex-col items-center gap-10"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: {
              transition: {
                staggerChildren: 0.2,
              },
            },
          }}
        >
          {/* ✅ 제목 */}
          <motion.h1
            className="text-5xl md:text-6xl font-extrabold leading-tight tracking-tight"
            variants={{
              hidden: { opacity: 0, y: 40 },
              visible: {
                opacity: 1,
                y: 0,
                transition: { duration: 0.6, ease: "easeOut" },
              },
            }}
          >
            {t("title1")}
          </motion.h1>

          {/* ✅ 강조되는 텍스트에 개별 애니메이션 */}
          <motion.span
            variants={{
              hidden: { scale: 0.9, opacity: 0 },
              visible: {
                scale: [1.1, 1],
                opacity: 1,
                transition: { duration: 0.6, ease: "easeOut" },
              },
            }}
            className="bg-gradient-to-r leading-tight from-[#0ea5e9] via-[#3b82f6] to-[#6366f1] bg-clip-text text-transparent text-5xl md:text-6xl font-extrabold tracking-tight"
          >
            {t("title2")}
          </motion.span>
        </motion.div>

        <motion.p
          className="text-lg md:text-xl leading-normal max-w-3xl text-[#444] dark:text-gray-300"
          variants={wordAnimation}
        >
          {t("description1")}
          <br />
          <span>
            {t.rich("description2", {
              ai: (chunks) => (
                <span className="text-[#0ea5e9] font-semibold">{chunks}</span>
              ),
            })}
          </span>
          <br />
          <span>
            {t.rich("description3", {
              text: (chunks) => (
                <span className="text-[#3b82f6] font-semibold inline-block pulse-glow">
                  {chunks}
                </span>
              ),
              diagram: (chunks) => (
                <span className="text-[#6366f1] font-semibold inline-block pulse-glow">
                  {chunks}
                </span>
              ),
              br: () => <br />,
            })}
          </span>
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row gap-4 w-full justify-center mt-4"
          variants={wordAnimation}
        >
          <GradientButton label={t("button_summarize")} />
        </motion.div>

        {/* AI 요약기 이미지 등장 애니메이션 */}
        <motion.div
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
            src="/images/hero-main2.png"
            alt=""
            className="pointer-events-none"
            width={550}
            height={550}
            aria-hidden="true"
          />
        </motion.div>
      </motion.div>
    </section>
  );
}
