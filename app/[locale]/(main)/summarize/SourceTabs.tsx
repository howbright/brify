"use client";

import { SourceType } from "@/app/types/sourceType";
import { Icon } from "@iconify/react";
import clsx from "clsx";

interface Props {
  selected: SourceType;
  onChange: (type: SourceType) => void;
}

const tabList: { type: SourceType; label: string; icon: string }[] = [
  { type: SourceType.YOUTUBE, label: "YouTube", icon: "mdi:youtube" },
  { type: SourceType.MANUAL, label: "직접입력", icon: "mdi:pencil" },
  { type: SourceType.FILE, label: "문서", icon: "mdi:file-document" },
  { type: SourceType.WEBSITE, label: "웹사이트", icon: "mdi:web" },
];

export default function SourceTabs({ selected, onChange }: Props) {
  return (
    <div className="flex justify-center gap-2 flex-wrap mb-3 p-4 rounded-2xl">
      {tabList.map((tab) => (
        <button
          key={tab.type}
          onClick={() => onChange(tab.type)}
          className={clsx(
            "flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg border transition",
            selected === tab.type
              ? "bg-primary text-white border-primary" // ✅ 선택된 탭 → 파란색 버튼
              : "bg-white dark:bg-black border-primary text-primary hover:bg-primary/10 dark:hover:bg-primary/20" // ✅ 비선택 탭 → 흰배경 + 파란테두리 + 파란글씨
          )}
        >
          <Icon icon={tab.icon} width={20} />
          {tab.label}
        </button>
      ))}
    </div>
  );
}
