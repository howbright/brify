"use client";

import { useState } from "react";
import type { Edge, Node as FlowNode } from "@xyflow/react";
import { MyNodeData } from "@/app/types/tree";
import DiagramView from "@/components/diagram/DiagramView";

interface Props {
  text: string;
  diagram?: {
    nodes: FlowNode<MyNodeData>[];
    edges: Edge[];
  };
}

export default function SummaryResult({ text, diagram }: Props) {
  const [tab, setTab] = useState<"text" | "diagram">("text");

  return (
    <div className="mt-10 space-y-4">
      {/* 탭 버튼 */}
      <div className="flex justify-center gap-4 mb-4">
        <button
          onClick={() => setTab("text")}
          className={`px-4 py-2 rounded font-semibold ${
            tab === "text"
              ? "bg-primary text-white"
              : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
          }`}
        >
          📄 텍스트 요약
        </button>
        <button
          onClick={() => setTab("diagram")}
          className={`px-4 py-2 rounded font-semibold ${
            tab === "diagram"
              ? "bg-primary text-white"
              : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
          }`}
        >
          🧠 다이어그램
        </button>
      </div>

      {/* 콘텐츠 뷰 */}
      {tab === "text" ? (
        <div className="bg-white dark:bg-black border border-gray-300 dark:border-white/20 rounded-lg p-6 text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-line">
          {text || "요약 결과가 여기에 표시됩니다."}
        </div>
      ) : (
        <div>
          {diagram ? (
            <DiagramView nodes={diagram.nodes} edges={diagram.edges} />
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400">
              다이어그램 요약 결과가 없습니다.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
