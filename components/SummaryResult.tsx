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
  overlay?: Overlay | null; // 서버에서 온 편집본 (nodes/edges)
  summaryId?: string;
  /** 어떤 뷰를 보여줄지 부모에서 지정: "text" | "diagram" */
  activeView?: "text" | "diagram";
}

// overlay를 안전하게 정규화(커스텀 노드 미등록 시 보이도록 label 보강)
function normalizeOverlay(ov: Overlay) {
  const nodes = (ov?.nodes ?? []).map((n: any) => {
    const data = n?.data ?? {};
    // 커스텀 노드 미등록 시 기본 노드에서도 텍스트가 보이도록 label 보강
    const label = data.label ?? data.title ?? data.description ?? "";
    // 커스텀 노드 미등록 대비: type이 "custom"이라도 DiagramView에서 nodeTypes를 등록했다면 그대로 사용
    // 여기서는 타입은 건드리지 않고 label만 채워줍니다.
    return {
      ...n,
      data: { ...data, label },
    };
  });

  const edges = Array.isArray(ov?.edges) ? ov.edges : [];
  return { nodes, edges };
}

export default function SummaryResult({
  text,
  tree,
  overlay,
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

  /**
   * 🔑 핵심 로직:
   * 1) overlay가 있으면 => overlay를 "그대로" 사용 (텍스트/포지션/스타일 포함)
   * 2) overlay가 없으면 => 트리에서 생성
   * 3) overlay가 일부만 있는 특별 케이스(예: 포지션만 담긴 경우)만 applyOverlayToFlow로 덮기
   */
  useEffect(() => {
    let cancelled = false;

    (async () => {
      // 1) overlay가 완전한 nodes/edges를 제공하는 정상 케이스
      if (overlay && Array.isArray(overlay.nodes) && Array.isArray(overlay.edges) && overlay.nodes.length > 0) {
        const normalized = normalizeOverlay(overlay);
        if (!cancelled) {
          setNodes(normalized.nodes as MyFlowNode[]);
          setEdges(normalized.edges as MyFlowEdge[]);
        }
        return;
      }

      // 2) overlay가 없거나 비어있으면, tree에서 생성
      if (tree) {
        const fromTree = await treeToFlowElements(tree);
        // 2-1) 어떤 환경에서는 overlay가 positions 같은 일부만 있을 수 있음 → 그때만 머지
        const merged =
          overlay && (overlay.nodes?.length || overlay.edges?.length)
            ? applyOverlayToFlow(fromTree.nodes, fromTree.edges, overlay)
            : fromTree;

        if (!cancelled) {
          setNodes(merged.nodes as MyFlowNode[]);
          setEdges(merged.edges as MyFlowEdge[]);
        }
        return;
      }

      // 3) 둘 다 없으면 초기화
      if (!cancelled) {
        setNodes([]);
        setEdges([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [tree, overlay]);

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

      {/* ⛳️ overlay가 있거나 tree가 있을 때 다이어그램을 보여줌 */}
      {activeView === "diagram" && (overlay || tree) && (
        <div className="mb-10" ref={diagramRef}>
          <DiagramView nodes={nodes} edges={edges} summaryId={summaryId || ""} />
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
