"use client";

import { Icon } from "@iconify/react";
import clsx from "clsx";

export type SourceType = "youtube" | "website" | "file" | "audio" | "manual";

interface Props {
  selected: SourceType;
  onChange: (type: SourceType) => void;
}

const tabList: { type: SourceType; label: string; icon: string }[] = [
  { type: "youtube", label: "YouTube", icon: "mdi:youtube" },
  { type: "website", label: "웹사이트", icon: "mdi:web" },
  { type: "file", label: "문서", icon: "mdi:file-document" },
  { type: "audio", label: "오디오", icon: "mdi:music" },
  { type: "manual", label: "직접입력", icon: "mdi:pencil" },
];

export default function SourceTabs({ selected, onChange }: Props) {
  return (
    <div className="flex justify-center gap-2 flex-wrap mb-6">
      {tabList.map((tab) => (
        <button
          key={tab.type}
          onClick={() => onChange(tab.type)}
          className={clsx(
            "flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg border transition",
            selected === tab.type
              ? "bg-primary text-white border-primary"
              : "bg-white dark:bg-black border-gray-300 dark:border-white/20 text-gray-800 dark:text-white hover:border-primary"
          )}
        >
          <Icon icon={tab.icon} width={20} />
          {tab.label}
        </button>
      ))}
    </div>
  );
}
