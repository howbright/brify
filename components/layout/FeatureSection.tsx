"use client";

import Image from "next/image";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";

const features = [
  {
    icon: "mdi:format-text-variant",
    title: "긴 글, 핵심 요약",
    desc: "뉴스, 블로그, 논문까지 — 요점만 뽑아 한눈에 정리해드려요.",
  },
  {
    icon: "mdi:marker-check",
    title: "핵심 하이라이트",
    desc: "중요 문장에 자동 하이라이트를 적용해 집중도를 높여줍니다.",
  },
  {
    icon: "mdi:share-variant",
    title: "간편 공유 & 다운로드",
    desc: "PDF 저장은 물론 링크로 요약 결과를 공유할 수 있어요.",
  },
  {
    icon: "mdi:tag-text-outline",
    title: "자동 태그 분류",
    desc: "주제별 태그를 자동 추출해 이후 정리나 검색도 간편하게!",
  },
  {
    icon: "mdi:chart-timeline-variant-shimmer",
    title: "다이어그램 시각화",
    desc: "선택형 테마, 편집 가능, 이미지 저장까지 가능한 다이어그램.",
  },
  {
    icon: "mdi:chat-question-outline",
    title: "심화 학습 기능",
    desc: "ChatGPT 연동으로 요약에 대해 더 깊이 질문하고 배워보세요.",
  },
];

export default function FeaturesSection() {
  return (
    <section className="relative z-10 py-24 px-4 bg-[#f3f4ff] dark:bg-[#121222] border-t border-gray-200 dark:border-white/10">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
        {/* ✅ 이미지 겹치기 */}
        <div className="relative w-full max-w-lg mx-auto h-[360px]">
          {/* 뒷쪽 다이어그램 - 기울임 */}
          <motion.div
            initial={{ opacity: 0, y: 60, rotate: -3, scale: 0.96 }}
            whileInView={{ opacity: 1, y: 0, rotate: -3, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.7, ease: "easeOut" }}
            viewport={{ once: true }}
            className="absolute top-16 left-14 w-full rounded-xl shadow-xl border border-border z-10"
          >
            <Image
              src="/images/feature-summary.png"
              alt="다이어그램"
              width={600}
              height={350}
              className="w-full h-auto rounded-xl"
            />
          </motion.div>

          {/* 앞쪽 요약 텍스트 - 반대 기울임 */}
          <motion.div
            initial={{ opacity: 0, y: 30, rotate: 2 }}
            whileInView={{ opacity: 1, y: 0, rotate: 2 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            viewport={{ once: true }}
            className="absolute top-0 left-0 w-full rounded-xl overflow-hidden shadow-lg z-20 border border-border"
          >
            <Image
              src="/images/feature-diagram.png"
              alt="요약 텍스트"
              width={600}
              height={350}
              className="w-full h-auto rounded-xl"
            />
          </motion.div>
        </div>

        {/* ✅ 텍스트 및 기능 카드 */}
        <div className="space-y-6">
          <div className="text-center lg:text-left mb-6">
            <h2 className="text-3xl md:text-4xl font-extrabold text-text dark:text-white mb-4 leading-snug">
              Brify는 이렇게<br className="lg:hidden" /> 도와드려요
            </h2>
            <p className="text-base md:text-lg text-muted-foreground">
              효율적인 요약과 정리를 위한 기능들을 지금 바로 만나보세요.
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
                className="flex items-start gap-4 p-5 bg-card dark:bg-[#1c1c2c] border border-border rounded-xl shadow-sm hover:shadow-md transition-all"
              >
                <div className="min-w-[52px] h-[52px] rounded-full bg-primary/10 flex items-center justify-center">
                  <Icon icon={item.icon} width={28} className="text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-text dark:text-foreground mb-1">
                    {item.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}