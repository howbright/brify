// app/types/diagram.ts
import type { Node as FlowNode, Edge as FlowEdge } from "@xyflow/react";

/** 노드 종류 */
export type NodeKind = "title" | "description";

/** React Flow 노드 data (렌더용) */
export type MyNodeData = {
  nodeType: NodeKind;
  title: string;
  description: string;
  /** 런타임에서만 주입되는 콜백 (DB 저장 X) */
  onUpdate?: (id: string, newText: string, type: NodeKind) => void;
  /** 하이라이트 표시 (서버 overlay -> normalize 시 주입) */
  highlighted?: boolean;
  /** 하이라이트 토글 콜백 (부모가 API 호출) */
  onHighlightChange?: (id: string, next: boolean) => void;
};

/** React Flow 노드/엣지 */
export type MyFlowNode = FlowNode<MyNodeData, "custom">;
export type MyFlowEdge = FlowEdge;

/** LLM이 준 평평한 트리 원본 (DB: diagram_json) */
export type OriginalDiagramNode = {
  id: string;
  title: string;
  description: string;
  nodeType: NodeKind;
  children: string[];
};

export type OriginalDiagram = {
  version: 1;
  type: "original";
  nodes: OriginalDiagramNode[];
};

/** 오버레이(선택): 좌표/텍스트 수정만 저장하고 싶을 때 */
export type Overlay = {
  version: 1;
  type: "overlay";
  positions: Record<string, { x: number; y: number }>;
  edits: Record<string, { title?: string; description?: string }>;
  /** 하이라이트 상태 저장(존재하면 true) */
  highlights?: Record<string, boolean>;
};

/** temp_diagram_json: React Flow 스냅샷 */
export type ReactFlowState = {
  version: 1;
  type: "reactflow";
  nodes: MyFlowNode[];
  edges: MyFlowEdge[];
};

/** 트리 형태(내부 변환 유틸에서 사용) */
export type TreeNode = {
  id: string;
  nodeType: NodeKind;
  title: string;
  description: string;
  children?: TreeNode[];
};

/** 타입 가드 */
export function isOriginal(v: any): v is OriginalDiagram {
  return v?.version === 1 && v?.type === "original" && Array.isArray(v?.nodes);
}
export function isFlowState(v: any): v is ReactFlowState {
  return (
    v?.version === 1 &&
    v?.type === "reactflow" &&
    Array.isArray(v?.nodes) &&
    Array.isArray(v?.edges)
  );
}
export function isOverlay(v: any): v is Overlay {
  return v?.version === 1 && v?.type === "overlay" && v?.positions && v?.edits;
}
