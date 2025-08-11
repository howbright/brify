// 📁 lib/diagram/overlay.ts
import type {
    MyFlowNode,
    MyFlowEdge,
    MyNodeData,
    Overlay,
  } from "@/app/types/diagram";
  
  /**
   * ELK로 배치된 nodes/edges에 overlay(positions/edits)를 반영한다.
   * - positions: 노드 좌표 덮어쓰기
   * - edits:     제목/설명 텍스트 덮어쓰기
   */
  export function applyOverlayToFlow(
    nodes: MyFlowNode[],
    edges: MyFlowEdge[],
    overlay?: Overlay | null
  ): { nodes: MyFlowNode[]; edges: MyFlowEdge[] } {
    if (!overlay) return { nodes, edges };
  
    const { positions = {}, edits = {} } = overlay;
  
    const mergedNodes: MyFlowNode[] = nodes.map((n) => {
      const pos = positions[n.id];
      const edit = edits[n.id];
  
      const nextData: MyNodeData = {
        ...n.data,
        title: edit?.title ?? n.data.title,
        description: edit?.description ?? n.data.description,
      };
  
      return {
        ...n,
        position: pos ? { x: pos.x, y: pos.y } : n.position,
        data: nextData,
      };
    });
  
    // edges는 overlay에 영향 없음 (필요시 여기서도 머지 로직 추가 가능)
    return { nodes: mergedNodes, edges };
  }
  
  /**
   * 현재 화면의 nodes 상태로부터 overlay(positions + edits 전체)를 생성한다.
   * - positions: 모든 노드의 현재 좌표 저장
   * - edits:     모든 노드의 현재 텍스트(title/description) 저장
   *   (diff를 원하면 여기서 원본과 비교 후 달라진 항목만 넣도록 변경 가능)
   */
  export function buildOverlayFromFlow(flowNodes: MyFlowNode[]): Overlay {
    const positions: Overlay["positions"] = {};
    const edits: Overlay["edits"] = {};
  
    for (const n of flowNodes) {
      positions[n.id] = { x: n.position.x, y: n.position.y };
      edits[n.id] = {
        title: n.data.title,
        description: n.data.description,
      };
    }
  
    return {
      version: 1,
      type: "overlay",
      positions,
      edits,
    };
  }
  