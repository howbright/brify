"use client";

import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import Image from "next/image";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.6, ease: "easeOut" },
  }),
};

const cards = [
  {
    icon: "mdi:clock-outline",
    title: "관심은 많은데 시간이 부족할 때",
    desc: "긴 영상이나 글을 다 보기 어려울 때, 요점만 빠르게 파악하고 싶다면!",
  },
  {
    icon: "mdi:folder-multiple-outline",
    title: "자료는 많은데 정리가 안 될 때",
    desc: "블로그, 뉴스, 유튜브까지 뒤섞인 콘텐츠를 한눈에 정리하고 싶을 때",
  },
  {
    icon: "mdi:chart-box-outline",
    title: "효율적인 공부나 업무 정리가 필요할 때",
    desc: "다이어그램으로 정리하면 머릿속에 쏙쏙! 발표나 공부 준비에도 딱이에요.",
  },
];

export default function NeedsSection() {
  return (
    <motion.section
      className="relative z-20 pt-24 pb-44 px-4 bg-background text-text dark:bg-[#1a1a1a] overflow-hidden border-t border-border"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
    >
      {/* ✅ 노이즈 텍스처 */}
      <div className="absolute inset-0 z-0 opacity-[0.06] dark:opacity-[0.04] pointer-events-none">
        <Image
          src="/images/noise-texture.png"
          alt=""
          fill
          className="object-cover"
        />
      </div>

      {/* ✅ 배경 일러스트 */}
      <motion.div
        className="absolute -bottom-20 right-1/4 hidden lg:block z-0"
        variants={fadeUp}
        custom={cards.length + 1}
      >
        <div className="relative w-[380px] h-[380px]">
          <div className="absolute inset-0 bg-accent/40 rounded-full z-0 shadow-md" />
          <Image
            src="/images/needs-woman.png"
            alt="정리 고민 해결 일러스트"
            fill
            className="z-10 object-contain"
          />
        </div>
      </motion.div>

      {/* ✅ 타이틀 */}
      <motion.div
        variants={fadeUp}
        custom={0}
        className="relative z-10 max-w-5xl mx-auto text-center mb-16"
      >
        <h2 className="text-3xl md:text-4xl font-extrabold text-text mb-4">
          이런 상황, 겪고 계신가요?
        </h2>
        <p className="text-base md:text-lg text-muted-foreground">
          Brify는 시간 부족, 과도한 정보, 정리 어려움 등<br />
          현실적인 고민을 해결해드립니다.
        </p>
      </motion.div>

      {/* ✅ 카드 리스트 */}
      <div className="relative z-10 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10">
        {cards.map((card, i) => (
          <motion.div
            key={i}
            variants={fadeUp}
            custom={i + 1}
            whileHover={{ scale: 1.03 }}
            className="flex items-start gap-4 bg-card border border-border rounded-2xl p-6 shadow-md hover:shadow-lg transition-all"
          >
            <div className="min-w-[52px] h-[52px] rounded-full bg-primary/10 flex items-center justify-center">
              <Icon icon={card.icon} width={28} className="text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-text mb-1">
                {card.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {card.desc}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}
