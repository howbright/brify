// components/SummaryResult.tsx
"use client";

import { createClient } from "@/utils/supabase/client";
import { Icon } from "@iconify/react";
import { useEffect, useRef, useState } from "react";
import SummaryContent from "./SummaryContent";
import DiagramView from "./diagram/DiagramView";

type ReactFlowState = {
  version: 1;
  type: "reactflow";
  nodes: any[];
  edges: any[];
};

interface Props {
  summaryId?: string;
  text?: string;
  diagram?:  ReactFlowState | null;
  activeView?: "text" | "diagram";
}

export default function SummaryResult({
  summaryId,
  text,
  diagram,
  activeView = "text",
}: Props) {
  const supabase = createClient();
  const [editedMarkdown, setEditedMarkdown] = useState(text ?? "");
  const [nodes, setNodes] = useState<any[]>([]);
  const [edges, setEdges] = useState<any[]>([]);
  const [comments, setComments] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState<string>("");

  const commentRef = useRef<HTMLDivElement>(null);
  const diagramRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (diagram && Array.isArray(diagram.nodes) && Array.isArray(diagram.edges)) {
      setNodes(diagram.nodes);
      setEdges(diagram.edges);
    } else {
      setNodes([]);
      setEdges([]);
    }
  }, [diagram]);

  const handleSaveText = async (markdown: string) => {
    setEditedMarkdown(markdown);
    if (!summaryId) return;
    try {
      const { error } = await supabase
        .from("summaries")
        .update({ detailed_summary_text: markdown, updated_at: new Date().toISOString() })
        .eq("id", summaryId);
      if (error) throw error;
      console.log("Supabase 저장 완료");
    } catch (e) {
      console.error("저장 실패:", e);
    }
  };

  return (
    <div className="min-h-screen">
      {activeView === "text" && (
        <div className="relative mb-10">
          <SummaryContent
            initialText={editedMarkdown}
            onSaveText={handleSaveText}
            scrollToComment={() => commentRef.current?.scrollIntoView({ behavior: "smooth" })}
            scrollToTop={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            scrollToDiagram={() => {}}
            fullMode={false}
          />
        </div>
      )}

      {activeView === "diagram" && diagram && (
        <div className="mb-10" ref={diagramRef}>
          <DiagramView nodes={nodes} edges={edges} summaryId={summaryId || ""} />
        </div>
      )}

      <div ref={commentRef} className="mt-5">
        {/* ... 댓글 UI 그대로 ... */}
      </div>

      <button
        onClick={() => commentRef.current?.scrollIntoView({ behavior: "smooth" })}
        className="fixed bottom-6 right-6 bg-black text-white rounded-full p-3 shadow-lg hover:bg-gray-800 transition"
        aria-label="댓글로 이동"
      >
        <Icon icon="mdi:chevron-down" className="w-6 h-6" />
      </button>
    </div>
  );
}
