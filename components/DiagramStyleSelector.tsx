// 📁 components/DiagramStyleSelector.tsx

"use client";

import React from "react";
import { classicStyle, brutalistStyle, cuteStyle } from "@/styles/presets";

interface DiagramStyleSelectorProps {
  open: boolean;
  onSelect: (style: any) => void;
  onClose: () => void;
}

const styleOptions = [
  {
    id: "classic",
    label: "클래시크",
    style: classicStyle,
  },
  {
    id: "brutalist",
    label: "브루탈리즘",
    style: brutalistStyle,
  },
  {
    id: "cute",
    label: "귀여운 스타일",
    style: cuteStyle,
  },
];

export default function DiagramStyleSelector({ open, onSelect, onClose }: DiagramStyleSelectorProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-xl max-w-lg w-full">
        <h3 className="text-lg font-semibold mb-4">🖌️ 스타일 선택</h3>
        <div className="grid grid-cols-3 gap-4">
          {styleOptions.map(({ id, label, style }) => (
            <button
              key={id}
              onClick={() => {
                onSelect(style);
                onClose();
              }}
              className="flex flex-col items-center p-3 border rounded-lg hover:shadow-sm cursor-pointer"
              style={{ backgroundColor: style.node.backgroundColor }}
            >
              <div
                className="w-16 h-10 mb-1 rounded border"
                style={{
                  backgroundColor: style.node.backgroundColor,
                  borderColor: style.node.borderColor,
                  fontFamily: style.node.font,
                  boxShadow: style.node.shadow ? "2px 2px 6px rgba(0,0,0,0.2)" : "none",
                }}
              >
                <span className="text-xs inline-block p-1">노드</span>
              </div>
              <span className="text-sm text-gray-700 dark:text-white">{label}</span>
            </button>
          ))}
        </div>
        <div className="mt-6 text-right">
          <button onClick={onClose} className="text-sm text-gray-500 hover:underline">
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}