"use client";

import { useInView } from "react-intersection-observer";
import { motion } from "framer-motion";
import SummaryActions, {SummaryActionsProps} from "./SummaryActions";

export default function SummaryActionsWrapper({
  text,
  mode,
  ...actions
}: SummaryActionsProps) {
  const { ref, inView } = useInView({
    threshold: 0.1, // 텍스트 요약 영역이 30% 보이면 inView = true
    triggerOnce: false,
  });

  return (
    <>
      {/* 감지할 대상 (텍스트 요약 끝나는 부분에 배치) */}
      <div ref={ref} className="h-10" />

      {/* SummaryActions: 뷰포트 조건 만족할 때만 표시 */}
      {inView && (
        <motion.div
          className="fixed bottom-6 inset-x-4 sm:inset-x-8 z-50"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-xl shadow-xl px-4 py-3 flex flex-wrap justify-center gap-3 overflow-x-auto">
            <SummaryActions mode={mode} text={text} {...actions} />
          </div>
        </motion.div>
      )}
    </>
  );
}
