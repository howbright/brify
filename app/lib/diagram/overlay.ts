// app/lib/diagram/overlay.ts
import type {
    MyFlowNode,
    MyFlowEdge,
    MyNodeData,
    Overlay,
  } from "@/app/types/diagram";
  
  /**
   * base nodes/edges(ELK 등으로 생성된 레이아웃)에 overlay(positions + edits)를 적용한다.
   * - positions: 좌표 덮어쓰기
   * - edits:     제목/설명 텍스트 덮어쓰기
   * MyNodeData에 정의된 필드만 건드린다 (label 같은 확장 필드 추가 X).
   */
  export function applyOverlayToFlow(
    nodes: MyFlowNode[],
    edges: MyFlowEdge[],
    overlay?: Overlay | null
  ): { nodes: MyFlowNode[]; edges: MyFlowEdge[] } {
    if (!overlay) return { nodes, edges };
  
    const positions = overlay.positions ?? {};
    const edits = overlay.edits ?? {};
  
    const mergedNodes: MyFlowNode[] = nodes.map((n) => {
      const pos = positions[n.id];
      const edit = edits[n.id];
  
      // 기존 데이터 유지
      const prev = (n.data ?? {}) as MyNodeData;
  
      // overlay 값이 있을 때만 덮어쓰기
      const nextData: MyNodeData = {
        ...prev,
        title:
          edit && typeof edit.title === "string" ? edit.title : prev.title,
        description:
          edit && typeof edit.description === "string"
            ? edit.description
            : prev.description,
      };
  
      // 좌표도 검증 후 반영
      const nextPos =
        pos &&
        typeof pos.x === "number" &&
        typeof pos.y === "number" &&
        Number.isFinite(pos.x) &&
        Number.isFinite(pos.y)
          ? { x: pos.x, y: pos.y }
          : n.position;
  
      return { ...n, position: nextPos, data: nextData };
    });
  
    return { nodes: mergedNodes, edges };
  }
  