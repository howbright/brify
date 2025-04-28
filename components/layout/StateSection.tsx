"use client";

import { motion } from "framer-motion";
import CountUp from "react-countup";

const stats = [
  { value: "15,482+ 시간", unit: "시간", title: "시간 절약" },
  { value: "24,317+ 건", unit: "건", title: "콘텐츠 요약" },
  { value: "87% ▲", unit: "% ▲", title: "이해도 향상" },
];

export default function StatsSection() {
  return (
    <section className="z-20 bg-gradient-to-r from-[#e8f0fc] via-[#dbe9f8] to-primary/10 py-10 px-4 text-gray-800">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-around items-center gap-6 md:gap-0 text-center">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <h3 className="text-2xl font-bold text-[#3366ff]">
              <CountUp
                start={0}
                end={parseInt(stat.value.replace(/[^\d]/g, ""))}
                duration={2}
                separator=","
              />
              <span className="ml-1">{stat.value.replace(/\d|,/g, "")}</span>
            </h3>
            <p className="text-sm text-gray-700 mt-1">{stat.title}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
