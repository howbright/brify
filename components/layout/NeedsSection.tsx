"use client";

import Image from "next/image";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.5, ease: "easeOut" },
  }),
};

export default function NeedsSection() {
  return (
    <section className="relative z-10 bg-gradient-to-b from-[#fffdf7] to-[#fdf0e6] dark:bg-[#1a1a1a] py-24 px-4">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeUp}
        custom={0}
        className="max-w-5xl mx-auto text-center mb-14"
      >
        <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-4">
          이런 상황, 겪고 계신가요?
        </h2>
        <p className="text-base md:text-lg text-gray-700 dark:text-gray-300">
          Brify는 시간 부족, 과도한 정보, 정리 어려움 등<br />
          현실적인 고민을 해결해드립니다.
        </p>
      </motion.div>

      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-12">
        {/* ✅ 카드 리스트 */}
        <div className="flex-1 space-y-6 w-full">
          {[ // 카드 데이터 배열
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
          ].map((card, i) => (
            <motion.div
              key={i}
              className="flex items-start gap-4 bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl p-5 shadow-sm"
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={i + 1}
            >
              <Icon icon={card.icon} width={24} className="text-primary mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  {card.title}
                </h3>
                <p className="text-sm text-gray-700 dark:text-gray-300">{card.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ✅ 일러스트 */}
        <motion.div
          className="flex-1 flex justify-center"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          custom={4}
          viewport={{ once: true }}
        >
          <Image
            src="/images/needs-illustration.png"
            alt="정리 고민 해결 일러스트"
            width={350}
            height={350}
            className="w-full max-w-xs h-auto"
          />
        </motion.div>
      </div>
    </section>
  );
}
