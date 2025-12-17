"use client";

import * as Tabs from "@radix-ui/react-tabs";
import { motion } from "framer-motion";

function cn(...xs: Array<string | false | undefined | null>) {
  return xs.filter(Boolean).join(" ");
}

type MissionTabsValue = "participate" | "center";

export default function MissionTabs({
  value,
  onValueChange,
  participate,
  center,
}: {
  value: MissionTabsValue;
  onValueChange: (v: MissionTabsValue) => void;
  participate: React.ReactNode;
  center: React.ReactNode;
}) {
  const activeIndex = value === "participate" ? 0 : 1;

  return (
    <Tabs.Root value={value} onValueChange={(v) => onValueChange(v as MissionTabsValue)}>
      {/* 탭 헤더 */}
      <div className="flex items-center justify-between gap-3">
        <Tabs.List
          className={cn(
            "relative inline-flex items-center",
            "rounded-2xl border border-neutral-200/80 dark:border-white/15",
            "bg-white/55 dark:bg-black/20 backdrop-blur",
            "p-1"
          )}
          aria-label="미션 탭"
        >
          {/* 움직이는 active 배경(세련된 느낌 핵심) */}
          <motion.div
            className={cn(
              "absolute top-1 bottom-1 rounded-xl",
              "bg-white/90 dark:bg-white/10",
              "shadow-sm",
              "border border-neutral-200/70 dark:border-white/10"
            )}
            animate={{ x: activeIndex === 0 ? 0 : "100%" }}
            transition={{ type: "spring", stiffness: 520, damping: 42 }}
            style={{
              width: "calc(50% - 0px)",
              left: 4,
            }}
            aria-hidden
          />

          <Tabs.Trigger
            value="participate"
            className={cn(
              "relative z-10",
              "px-4 py-2 rounded-xl",
              "text-[13px] font-semibold",
              "transition-all",
              "text-neutral-600 dark:text-neutral-300",
              "data-[state=active]:text-neutral-900 dark:data-[state=active]:text-neutral-50",
              "hover:text-neutral-900 dark:hover:text-neutral-50",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/25 dark:focus-visible:ring-[rgb(var(--hero-b))]/30",
              "active:scale-[0.99]"
            )}
          >
            미션 참여
          </Tabs.Trigger>

          <Tabs.Trigger
            value="center"
            className={cn(
              "relative z-10",
              "px-4 py-2 rounded-xl",
              "text-[13px] font-semibold",
              "transition-all",
              "text-neutral-600 dark:text-neutral-300",
              "data-[state=active]:text-neutral-900 dark:data-[state=active]:text-neutral-50",
              "hover:text-neutral-900 dark:hover:text-neutral-50",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/25 dark:focus-visible:ring-[rgb(var(--hero-b))]/30",
              "active:scale-[0.99]"
            )}
          >
            미션 센터
          </Tabs.Trigger>
        </Tabs.List>
      </div>

      {/* 콘텐츠 */}
      <Tabs.Content value="participate" className="mt-5">
        {participate}
      </Tabs.Content>

      <Tabs.Content value="center" className="mt-5">
        {center}
      </Tabs.Content>
    </Tabs.Root>
  );
}
