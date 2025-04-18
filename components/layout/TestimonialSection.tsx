"use client";

import { Icon } from "@iconify/react";
import { motion } from "framer-motion";

const testimonials = [
  {
    name: "이민지",
    title: "대학원생 / 논문 정리",
    quote:
      "Brify 덕분에 긴 논문을 빠르게 요약하고 발표 준비까지 할 수 있었어요. 다이어그램 기능이 특히 유용했어요!",
  },
  {
    name: "정지훈",
    title: "마케터 / 콘텐츠 정리",
    quote:
      "블로그, 뉴스, 영상까지 한 번에 정리되는 게 정말 편해요. 시각화된 결과물 덕분에 팀과 공유도 쉬워졌습니다.",
  },
  {
    name: "김하늘",
    title: "개발자 / 기술 학습",
    quote:
      "긴 기술 문서나 영상도 핵심만 뽑아주니 학습 시간이 절약돼요. 추천 기능이 좋아서 계속 쓰게 됩니다!",
  },
];

function TestimonialCard({ name, title, quote }: { name: string; title: string; quote: string }) {
  return (
    <motion.div
      whileHover={{ scale: 1.03, rotate: -0.5 }}
      transition={{ type: "spring", stiffness: 300 }}
      className="bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 rounded-2xl shadow-xl p-6 border border-border hover:shadow-2xl hover:border-primary group"
    >
      <div className="flex gap-1 mb-4 text-yellow-400">
        {Array.from({ length: 5 }).map((_, i) => (
          <Icon key={i} icon="mdi:star" className="w-5 h-5 transition-transform group-hover:scale-110" />
        ))}
      </div>
      <p className="text-sm leading-relaxed mb-6 relative">
        <span className="text-xl font-serif text-gray-400 mr-1">“</span>
        {quote}
        <span className="text-xl font-serif text-gray-400 ml-1">”</span>
      </p>
      <div className="text-sm font-semibold flex items-center gap-2">
        <Icon icon="mdi:account-circle" className="w-5 h-5 text-primary transition-colors duration-200 group-hover:text-primary-600" />
        {name}
      </div>
      <div className="text-xs text-muted-foreground">{title}</div>
    </motion.div>
  );
}

export default function TestimonialSection() {
  return (
    <section className="relative bg-[#f5f6fc] dark:bg-[#121222] py-24 px-4 border-t border-border">
      <div className="max-w-5xl mx-auto text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-extrabold mb-4 text-text dark:text-white">
          사용자들의 진짜 이야기
        </h2>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Brify는 다양한 분야의 사용자에게 사랑받고 있어요.
          <br className="hidden md:block" />
          그 생생한 경험담을 확인해보세요.
        </p>
      </div>

      <div className="max-w-6xl mx-auto grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {testimonials.map((t, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * idx }}
            viewport={{ once: true }}
            className="group"
          >
            <TestimonialCard {...t} />
          </motion.div>
        ))}
      </div>
    </section>
  );
}
