"use client";

import { useEffect, useMemo, useState } from "react";
import type { Edge, Node as FlowNode } from "@xyflow/react";
import { MyNodeData } from "@/app/types/tree";
import DiagramView from "@/components/diagram/DiagramView";
import ReactMarkdown from "react-markdown";

// 트리 → ReactFlow 변환 유틸
function buildReactFlowFromTree(tree: any): {
  nodes: FlowNode<MyNodeData>[];
  edges: Edge[];
} {
  const nodes: FlowNode<MyNodeData>[] = [];
  const edges: Edge[] = [];

  function traverse(node: any, parentId?: string, depth = 0, index = 0) {
    nodes.push({
      id: node.id,
      position: { x: depth * 300, y: index * 100 },
      data: { label: node.label },
    });

    if (parentId) {
      edges.push({
        id: `${parentId}-${node.id}`,
        source: parentId,
        target: node.id,
      });
    }

    node.children?.forEach((child: any, idx: number) =>
      traverse(child, node.id, depth + 1, idx)
    );
  }

  traverse(tree);

  return { nodes, edges };
}

interface Props {
  text: string;
  tree?: any;
}

export default function SummaryResult({ text, tree }: Props) {
  const [tab, setTab] = useState<"text" | "diagram">("text");

  const { nodes, edges } = useMemo(() => {
    if (!tree) return { nodes: [], edges: [] };
    return buildReactFlowFromTree(tree);
  }, [tree]);

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

      {/* 콘텐츠 */}
      {tab === "text" ? (
        <div
          id="textView"
          className="bg-white dark:bg-black border border-gray-300 dark:border-white/20 rounded-lg p-6 text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-line"
        >
          <ReactMarkdown
            components={{
              h3: ({ node, ...props }) => (
                <h3 className="text-lg font-bold" {...props} />
              ),
              p: ({ node, ...props }) => (
                <p className="text-base leading-relaxed" {...props} />
              ),
              ul: ({ node, ...props }) => (
                <ul className="list-disc list-inside" {...props} />
              ),
              li: ({ node, ...props }) => (
                <li className="text-base leading-relaxed" {...props} />
              ),
              blockquote: ({ node, ...props }) => (
                <blockquote
                  className="border-l-4 border-gray-300 dark:border-gray-600 pl-1 italic text-gray-600 dark:text-gray-300"
                  {...props}
                />
              )
            }}
          >
            {text || "요약 결과가 여기에 표시됩니다."}
          </ReactMarkdown>
        </div>
      ) : (
        <div>
          {nodes.length > 0 ? (
            <DiagramView nodes={nodes} edges={edges} />
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
