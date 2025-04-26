"use client";

import { motion } from "framer-motion";
import { Icon } from "@iconify/react";
import CountUp from "react-countup";

const stats = [
  {
    icon: "mdi:clock-outline",
    value: "15,482시간",
    title: "시간 절약",
    description: "여러분의 소중한 시간을 지켜드렸어요!",
  },
  {
    icon: "mdi:book-outline",
    value: "24,317건",
    title: "콘텐츠 요약",
    description: "다양한 콘텐츠를 명쾌하게 정리했습니다.",
  },
  {
    icon: "mdi:lightbulb-on-outline",
    value: "87%",
    title: "이해도 향상",
    description: "더 빠르고 깊이 있게 이해하게 되었습니다.",
  },
];

export default function StatsSection() {
  return (
    <section className="relative bg-gradient-to-br from-[#dce3ea] via-[#d7d3f5] to-[#c4e0f9] py-24 px-4 overflow-hidden">
      {/* ✅ 흐릿한 도넛형 배경 */}
      <div className="absolute inset-0 flex justify-center items-center pointer-events-none">
        <div className="w-96 h-96 rounded-full bg-primary/10 blur-3xl opacity-30"></div>
      </div>

      <div className="max-w-6xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-12">
          Brify와 함께한 <span className="text-primary">성과</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-8 flex flex-col gap-4"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
            >
              <div className="flex justify-center">
                <Icon icon={stat.icon} width={36} className="text-primary" />
              </div>
              <h3 className="text-4xl font-bold text-gray-900 dark:text-white">
                <CountUp
                  start={0}
                  end={parseInt(stat.value.replace(/[^\d]/g, ""))}
                  duration={2}
                  separator=","
                  suffix={
                    stat.value.includes("%")
                      ? "%"
                      : stat.value.replace(/\d|,/g, "")
                  }
                />
              </h3>
              <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                {stat.title}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {stat.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
