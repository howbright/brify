"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import { Edge, Node } from "@xyflow/react";
import { treeToFlowElements } from "@/app/lib/gtp/transformTree";
import { MyNodeData, TreeNode } from "@/app/types/tree";
import DiagramView from "./diagram/DiagramView";
import SummaryFullDialog from "./SummaryFullDialog";
import SummaryContent from "./SummaryContent";
import { createClient } from "@/utils/supabase/client";

interface Props {
  text?: string;
  tree?: TreeNode | null | undefined;
  summaryId?: string;
  /** 어떤 뷰를 보여줄지 부모에서 지정: "text" | "diagram" */
  activeView?: "text" | "diagram";
}

export default function SummaryResult({
  text,
  tree,
  summaryId,
  activeView = "text", // 기본값: 텍스트 보기
}: Props) {
  const supabase = createClient();
  const [editedMarkdown, setEditedMarkdown] = useState(text ?? "");
  const [comments, setComments] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState<string>("");
  const [nodes, setNodes] = useState<Node<MyNodeData>[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [isFullDialogOpen, setIsFullDialogOpen] = useState(false);

  const commentRef = useRef<HTMLDivElement>(null);
  const diagramRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!tree) return;
    treeToFlowElements(tree).then(({ nodes, edges }) => {
      setNodes(nodes);
      setEdges(edges);
    });
  }, [tree]);

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
            onOpenFullView={() => setIsFullDialogOpen(true)}
            onSaveText={handleSaveText}
            scrollToComment={scrollToComment}
            scrollToTop={scrollToTop}
            scrollToDiagram={() => {}}
            fullMode={false}
          />
        </div>
      )}

      {activeView === "diagram" && tree && (
        <div className="mb-10">
          <DiagramView
            nodes={nodes}
            edges={edges}
            onFullViewDiagram={() => setIsFullDialogOpen(true)}
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

        <SummaryFullDialog
          open={isFullDialogOpen}
          onOpenChange={setIsFullDialogOpen}
          activeTab={activeView}
          onTabChange={() => {}} // 다이얼로그 내부 전환은 그대로 유지
          text={editedMarkdown}
          nodes={nodes}
          edges={edges}
          onSaveText={handleSaveText}
        />

        <form onSubmit={handleCommentSubmit} className="mb-6">
          <div className="py-2 px-4 mb-4 bg-white rounded-lg border border-gray-200">
            <label htmlFor="comment" className="sr-only">
              Your comment
            </label>
            <textarea
              id="comment"
              rows={6}
              className="w-full text-sm text-gray-900 border-0 focus:ring-0 focus:outline-none"
              placeholder="Write a comment..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="inline-flex items-center py-2.5 px-4 text-xs font-medium text-center text-white bg-blue-600 rounded-lg focus:ring-4 focus:ring-blue-300 hover:bg-blue-700"
          >
            Post comment
          </button>
        </form>
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
