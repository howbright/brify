import { G6Edge, G6GraphData, G6Node, OriginalDiagramNode } from "@/app/lib/g6/types";

  
  /**
   * OriginalDiagramNode[] -> G6 그래프 데이터 변환
   * - 각 노드는 id 필수
   * - 엣지는 parent.children 으로부터 생성
   * - 누락된 자식 id는 경고만 찍고 스킵
   * - 중복 엣지 방지
   */
  export function toG6Data(original: OriginalDiagramNode[]): G6GraphData {
    const byId = new Map<string, OriginalDiagramNode>();
    for (const n of original) byId.set(n.id, n);
  
    // 1) nodes
    const nodes: G6Node[] = original.map((n) => ({
      id: n.id,
      data: {
        label: n.title || n.description || "", // 라벨 기본값
        title: n.title,
        description: n.description,
        nodeType: n.nodeType,
      },
      // 필요하면 nodeType에 따라 type/size/style 세팅 가능:
      // ...(n.nodeType === "title"
      //   ? { type: "rect", style: { size: [160, 44] } }
      //   : { type: "round-rect", style: { size: [240, 36] } })
    }));
  
    // 2) edges (parent -> child)
    const edgeSet = new Set<string>();
    const edges: G6Edge[] = [];
  
    for (const parent of original) {
      for (const childId of parent.children ?? []) {
        if (!byId.has(childId)) {
          console.warn(
            `[toG6Data] 자식 ID '${childId}'를 찾지 못했습니다. (parent: '${parent.id}')`
          );
          continue;
        }
        const key = `${parent.id}-->${childId}`;
        if (edgeSet.has(key)) continue;
        edgeSet.add(key);
  
        edges.push({
          id: key, // 디버깅 편의용
          source: parent.id,
          target: childId,
          data: {
            // 필요시 추가 메타
            parentNodeType: parent.nodeType,
          },
        });
      }
    }
  
    return { nodes, edges };
  }
  