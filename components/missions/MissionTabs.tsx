"use client";

import * as Tabs from "@radix-ui/react-tabs";
import type { ReactNode } from "react";

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
  participate: ReactNode;
  center: ReactNode;
}) {
  return (
    <Tabs.Root
      value={value}
      onValueChange={(v) => onValueChange(v as MissionTabsValue)}
      className="w-full"
    >
      {/* 탭 헤더: underline 네비게이션 스타일 */}
      <Tabs.List
        aria-label="미션 탭"
        className={cn(
          "relative flex items-center gap-6",
          "border-b border-slate-400 dark:border-white/20"
        )}
      >
        <TabTrigger value="participate">미션 참여</TabTrigger>
        <TabTrigger value="center">미션 센터</TabTrigger>
      </Tabs.List>

      {/* 콘텐츠 */}
      <Tabs.Content value="participate" className="mt-6 outline-none">
        {participate}
      </Tabs.Content>

      <Tabs.Content value="center" className="mt-6 outline-none">
        {center}
      </Tabs.Content>
    </Tabs.Root>
  );
}

function TabTrigger({
  value,
  children,
}: {
  value: MissionTabsValue;
  children: ReactNode;
}) {
  return (
    <Tabs.Trigger
      value={value}
      className={cn(
        "relative -mb-px",
        "px-0 pb-3 pt-2",
        "text-[14px] font-semibold tracking-[-0.01em]",
        // ✅ 글자색(비활성/호버/활성) — 검정 대신 컬러 톤
        "text-indigo-600/70 dark:text-indigo-200/70",
        "hover:text-indigo-700 dark:hover:text-indigo-100",
        "data-[state=active]:text-blue-700 dark:data-[state=active]:text-[rgb(var(--hero-b))]",
        // ✅ underline (active일 때만)
        "after:content-[''] after:absolute after:left-0 after:right-0 after:bottom-0 after:h-[2px] after:rounded-full",
        "after:bg-gradient-to-r after:from-blue-600 after:via-indigo-600 after:to-purple-600",
        "after:opacity-0 data-[state=active]:after:opacity-100",
        "after:scale-x-75 data-[state=active]:after:scale-x-100",
        "after:origin-center after:transition after:duration-200",
        // focus
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/25 dark:focus-visible:ring-[rgb(var(--hero-b))]/30",
        "select-none"
      )}
    >
      {children}
    </Tabs.Trigger>
  );
}
