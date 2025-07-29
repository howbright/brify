"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import { Edge, Node } from "@xyflow/react";
import { treeToFlowElements } from "@/app/lib/gtp/transformTree";
import { MyNodeData, TreeNode } from "@/app/types/tree";
import DiagramView from "./diagram/DiagramView";
import TooltipIconButton from "./TooltipIconButton";
import SummaryEditor from "./SummaryEditor";
import SummaryViewer from "./SummaryViewer";
import SummaryFullDialog from "./SummaryFullDialog";
import SummaryContent from "./SummaryContent";
import { createClient } from "@/utils/supabase/client";

interface Props {
  text?: string;
  tree?: TreeNode | null | undefined;
  summaryId?:string;
}

export default function SummaryResult({ text, tree, summaryId }: Props) {
  const supabase = createClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editedMarkdown, setEditedMarkdown] = useState(text ?? "");
  const [comments, setComments] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState<string>("");
  const [nodes, setNodes] = useState<Node<MyNodeData>[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [isFullDialogOpen, setIsFullDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"text" | "diagram">("text");

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

  const scrollToDiagram = () => {
    diagramRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    setComments((prev) => [...prev, inputValue.trim()]);
    setInputValue("");
  };

  async function saveSummaryToSupabase(id: string, markdown: string) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("summaries")
      .update({ detailed_summary_text: markdown, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      console.error("Supabase update error:", error);
      throw error;
    }
  }
  // **새로 만든 함수**
  const handleSaveText = async (markdown: string) => {
    setEditedMarkdown(markdown);
    try {
      if(!!summaryId){
        await saveSummaryToSupabase(summaryId, markdown);
      }
      console.log("Supabase 저장 완료");
    } catch (error) {
      console.error("저장 실패:", error);
    }
  };

  return (
    <div className="max-w-6xl mx-auto min-h-screen">
      <h2 className="text-2xl font-bold mb-6">핵심정리 결과</h2>

      <div className="relative mb-10">
        <SummaryContent
          initialText={editedMarkdown}
          onOpenFullView={() => {
            setActiveTab("text");
            setIsFullDialogOpen(true);
          }}
          onSaveText={handleSaveText}
          scrollToComment={scrollToComment}
          scrollToTop={scrollToTop}
          scrollToDiagram={scrollToDiagram}
          fullMode={false}
        />
      </div>

      {tree && (
        <div ref={diagramRef}>
          <DiagramView
            nodes={nodes}
            edges={edges}
            onFullViewDiagram={() => {
              setActiveTab("diagram");
              setIsFullDialogOpen(true);
            }}
          />
        </div>
      )}

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

        {/* 코멘트 폼 그대로 */}

        <SummaryFullDialog
          open={isFullDialogOpen}
          onOpenChange={setIsFullDialogOpen}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          text={editedMarkdown}
          nodes={nodes}
          edges={edges} onSaveText={handleSaveText}/>

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
            ></textarea>
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
