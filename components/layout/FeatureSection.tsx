"use client";

import Image from "next/image";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";

const features = [
  {
    icon: "mdi:format-text-variant",
    title: "긴 글, 핵심 요약",
    desc: "뉴스, 블로그, 논문까지 — 요점만 뽑아 한눈에 정리해드려요.",
    bg: "bg-[#fef7e8]/80",
  },
  {
    icon: "mdi:marker-check",
    title: "핵심 하이라이트",
    desc: "중요 문장에 자동 하이라이트를 적용해 집중도를 높여줍니다.",
    bg: "bg-[#eaf6ff]/80",
  },
  {
    icon: "mdi:share-variant",
    title: "간편 공유 & 다운로드",
    desc: "PDF 저장은 물론 링크로 요약 결과를 공유할 수 있어요.",
    bg: "bg-[#f3efff]/80",
  },
  {
    icon: "mdi:tag-text-outline",
    title: "자동 태그 분류",
    desc: "주제별 태그를 자동 추출해 이후 정리나 검색도 간편하게!",
    bg: "bg-[#e9fce9]/80",
  },
  {
    icon: "mdi:chart-timeline-variant-shimmer",
    title: "다이어그램 시각화",
    desc: "선택형 테마, 편집 가능, 이미지 저장까지 가능한 다이어그램.",
    bg: "bg-[#fff0f0]/80",
  },
  {
    icon: "mdi:chat-question-outline",
    title: "심화 학습 기능",
    desc: "ChatGPT 연동으로 요약에 대해 더 깊이 질문하고 배워보세요.",
    bg: "bg-[#f0faff]/80",
  },
];

export default function FeaturesSection() {
  return (
    <section className="relative z-10 py-24 px-4 bg-[#fdfaf6] dark:bg-[#111111]">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
        {/* ✅ 왼쪽: 이미지 (겹치기 + 애니메이션) */}
        <div className="relative w-full max-w-lg mx-auto h-[340px]">
          {/* 다이어그램 (뒤에 나타나야 하므로 먼저) */}
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.96 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.7, ease: "easeOut" }}
            viewport={{ once: true }}
            className="absolute top-10 left-10 w-full rounded-xl shadow-xl border border-gray-200 dark:border-white/10 z-20"
          >
            <Image
              src="/images/feature-diagram.png"
              alt="다이어그램"
              width={600}
              height={350}
              className="w-full h-auto rounded-xl"
            />
          </motion.div>

          {/* 요약 텍스트 (앞쪽에 먼저 보여짐) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            viewport={{ once: true }}
            className="absolute top-0 left-0 w-full rounded-xl overflow-hidden shadow-lg z-10"
          >
            <Image
              src="/images/feature-summary.png"
              alt="요약 텍스트"
              width={600}
              height={350}
              className="w-full h-auto border border-gray-200 dark:border-white/10 rounded-xl"
            />
          </motion.div>
        </div>

        {/* ✅ 오른쪽: 카드들 */}
        <div className="space-y-10">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-4">
              Brify는 이렇게 도와드려요
            </h2>
            <p className="text-base md:text-lg text-gray-600 dark:text-gray-300">
               효율적인 요약과 정리를 위한 다양한 기능을 만나보세요.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {features.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + index * 0.08 }}
                viewport={{ once: true }}
                className={`flex items-start gap-4 p-5 border border-gray-200 dark:border-white/10 ${item.bg} dark:bg-black rounded-xl shadow-xs`}
              >
                <Icon icon={item.icon} width={36} className="text-primary mt-1 shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
