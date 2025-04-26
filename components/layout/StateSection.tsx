"use client";

import { motion } from "framer-motion";
import CountUp from "react-countup";

const stats = [
  {
    value: "15,482+ 시간",
    title: "시간 절약",
    description: "여러분의 소중한 시간을 지켜드렸어요!",
  },
  {
    value: "24,317+ 건",
    title: "콘텐츠 요약",
    description: "다양한 콘텐츠를 명쾌하게 정리했습니다.",
  },
  {
    value: "87%",
    title: "이해도 향상",
    description: "더 빠르고 깊이 있게 이해하게 되었습니다.",
  },
];

export default function StatsSection() {
  return (
    <section className="relative bg-gradient-to-br from-[#dce3ea] via-[#d7d3f5] to-[#c4e0f9] py-20 px-4 overflow-hidden">
      {/* ✅ 흐릿한 도넛형 배경 */}
      <div className="absolute inset-0 flex justify-center items-center pointer-events-none">
        <div className="w-80 h-80 rounded-full bg-primary/10 blur-3xl opacity-30"></div>
      </div>

      <div className="max-w-6xl mx-auto text-center">
        <h2 className="text-2xl md:text-3xl font-semibold text-gray-800 dark:text-white mb-10">
          Brify와 함께한 <span className="text-primary">성과</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-5 flex flex-col gap-2"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <h3 className="text-3xl font-bold text-primary">
                <CountUp
                  start={0}
                  end={parseInt(stat.value.replace(/[^\d]/g, ""))}
                  duration={2}
                  separator=","
                  suffix={
                    stat.value.includes("%")
                      ? "% ▲"
                      : stat.value.replace(/\d|,/g, "")
                  }
                />
              </h3>
              <div className="h-1 w-12 bg-primary rounded-full mx-auto my-1" />
              <p className="text-base font-semibold text-gray-800 dark:text-gray-200">
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
