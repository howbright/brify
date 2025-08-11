import type { Node as FlowNode, Edge as FlowEdge } from "@xyflow/react";

/** 노드 종류 */
export type NodeKind = "title" | "description";

/** LLM이 준 원본 트리(정답 데이터) */
export type OriginalDiagramNode = {
  id: string;
  title: string;
  description: string;
  nodeType: NodeKind;
  /** 자식 노드 id 리스트 (배열 구조) */
  children: string[];
};

export type OriginalDiagram = {
  version: 1;
  type: "original";
  nodes: OriginalDiagramNode[];
};

/** UI 오버레이(사용자 편집본): 위치 + 텍스트 수정 */
export type Overlay = {
  version: 1;
  type: "overlay";
  positions: Record<string, { x: number; y: number }>;
  edits: Record<string, { title?: string; description?: string }>;
};

/** React Flow 노드 data (렌더용) */
export type MyNodeData = {
  nodeType: NodeKind;
  title: string;
  description: string;
  /** 런타임에서만 주입되는 콜백 (DB 저장 X) */
  onUpdate?: (id: string, newText: string, type: NodeKind) => void;
};

/** React Flow 노드/엣지 제네릭 */
export type MyFlowNode = FlowNode<MyNodeData, "custom">;
export type MyFlowEdge = FlowEdge;

/** 트리 형태(내부 변환 유틸에서 사용) */
export type TreeNode = {
  id: string;
  nodeType: NodeKind;
  title: string;
  description: string;
  children?: TreeNode[];
};
