"use client";

import { createClient } from "@/utils/supabase/client";
import { Icon } from "@iconify/react";
import { useEffect, useRef, useState } from "react";

import SummaryContent from "./SummaryContent";
import DiagramView from "./diagram/DiagramView";

import { applyOverlayToFlow } from "@/app/lib/diagram/overlay";
import { treeToFlowElements } from "@/app/lib/gtp/transformTree";
import type {
  MyFlowEdge,
  MyFlowNode,
  Overlay,
  TreeNode,
} from "@/app/types/diagram";

interface Props {
  text?: string;
  tree?: TreeNode | null | undefined;
  overlay?: Overlay | null; // ← 추가!
  summaryId?: string;
  /** 어떤 뷰를 보여줄지 부모에서 지정: "text" | "diagram" */
  activeView?: "text" | "diagram";
}

export default function SummaryResult({
  text,
  tree,
  overlay, // ← 추가!
  summaryId,
  activeView = "text",
}: Props) {
  const supabase = createClient();
  const [editedMarkdown, setEditedMarkdown] = useState(text ?? "");
  const [comments, setComments] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState<string>("");

  const [nodes, setNodes] = useState<MyFlowNode[]>([]);
  const [edges, setEdges] = useState<MyFlowEdge[]>([]);

  const commentRef = useRef<HTMLDivElement>(null);
  const diagramRef = useRef<HTMLDivElement>(null);

  // 트리 → 레이아웃 → overlay 덮어쓰기
  useEffect(() => {
    if (!tree) return;

    let cancelled = false;
    (async () => {
      const { nodes, edges } = await treeToFlowElements(tree);
      const merged = applyOverlayToFlow(nodes, edges, overlay); // ← overlay 적용
      if (!cancelled) {
        setNodes(merged.nodes);
        setEdges(merged.edges);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [tree, overlay]); // ← overlay 바뀌면 다시 머지

  const scrollToComment = () => {
    commentRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    setComments((prev) => [...prev, inputValue.trim()]);
    setInputValue("");
  };

  async function saveSummaryToSupabase(id: string, markdown: string) {
    const { error } = await supabase
      .from("summaries")
      .update({
        detailed_summary_text: markdown,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      console.error("Supabase update error:", error);
      throw error;
    }
  }

  const handleSaveText = async (markdown: string) => {
    setEditedMarkdown(markdown);
    try {
      if (summaryId) {
        await saveSummaryToSupabase(summaryId, markdown);
      }
      console.log("Supabase 저장 완료");
    } catch (error) {
      console.error("저장 실패:", error);
    }
  };

  return (
    <div className="min-h-screen">
      {/* ==== 현재 뷰에 따라 다르게 표시 ==== */}
      {activeView === "text" && (
        <div className="relative mb-10">
          <SummaryContent
            initialText={editedMarkdown}
            onSaveText={handleSaveText}
            scrollToComment={scrollToComment}
            scrollToTop={scrollToTop}
            scrollToDiagram={() => {}}
            fullMode={false}
          />
        </div>
      )}

      {activeView === "diagram" && tree && (
        <div className="mb-10" ref={diagramRef}>
          <DiagramView
            nodes={nodes}
            edges={edges}
            summaryId={summaryId || ""}
          />
        </div>
      )}

      {/* ==== 댓글 ==== */}
      <div ref={commentRef} className="mt-5">
        <ul className="space-y-2 mb-6">
          {comments.map((comment, index) => (
            <li
              key={index}
              className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded text-sm shadow-sm"
            >
              {comment}
            </li>
          ))}
        </ul>
      </div>

      <button
        onClick={scrollToComment}
        className="fixed bottom-6 right-6 bg-black text-white rounded-full p-3 shadow-lg hover:bg-gray-800 transition"
        aria-label="댓글로 이동"
      >
        <Icon icon="mdi:chevron-down" className="w-6 h-6" />
      </button>
    </div>
  );
}
