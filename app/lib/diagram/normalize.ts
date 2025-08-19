// app/lib/summary/normalize.ts
import {
    isFlowState,
    isOriginal,
    type OriginalDiagram,
    type ReactFlowState,
    type MyFlowNode,
    type MyFlowEdge,
    type TreeNode,
  } from "@/app/types/diagram";
  import { treeToFlowElements } from "@/app/lib/gtp/transformTree"; // 이미 프로젝트에 있음
  
  /** 서버 응답 타입 (API /api/summary 의 result) */
  export interface ApiSummary {
    id: string;
    user_id: string | null;
    created_at: string | null;
  
    source_type: string;
    source_title: string | null;
    source_url: string | null;
  
    summary_text: string | null;
    detailed_summary_text: string | null;
  
    diagram_json: OriginalDiagram | null;       // DB 원본
    original_text?: string | null;              // (있을 수도 있음)
  
    status: string;
    lang: string | null;
    is_public: boolean | null;
    updated_at: string | null;
  
    category: any | null; // enum import가 순환될 경우 any로
  
    keywords: { id: number; name: string; lang: string }[];
  
    original_diagram_json: OriginalDiagram | null;
    temp_diagram_json: ReactFlowState | null;         // ✅ ReactFlow 스냅샷
    effective_diagram_json: ReactFlowState | null;
    diagram_source: "overlay" | "original" | "none";
  }
  
  /** 정규화 결과 */
  export type NormalizeResult = {
    api: ApiSummary;
    tree: TreeNode[];            // React Flow 변환 전 트리
    flowState: ReactFlowState | null; // 서버에서 온 스냅샷 (있으면 우선 사용)
    nodes: MyFlowNode[];
    edges: MyFlowEdge[];
  };
  
  /** Summary 응답을 tree/nodes/edges로 정규화 */
  export async function normalizeSummary(api: ApiSummary): Promise<NormalizeResult> {
    const effective = api.effective_diagram_json;
  
    // 1) temp/reactflow 스냅샷이 있으면 그대로 사용
    if (isFlowState(effective)) {
      const nodes = effective.nodes ?? [];
      const edges = effective.edges ?? [];
      return {
        api,
        tree: [],                 // 스냅샷을 쓰는 경우 트리는 비워도 됨(선택)
        flowState: effective,
        nodes,
        edges,
      };
    }
  
    // 2) 그렇지 않으면 original 트리 사용 → React Flow elements 변환
    const original = isOriginal(effective)
      ? effective
      : api.original_diagram_json;
  
    if (isOriginal(original)) {
      // convertToTree(original) 대신, 프로젝트에 맞게 treeToFlowElements 입력 형태를 맞춰줘
      // 여기서는 original(nodes배열)로부터 내부 util이 받을 TreeNode[]로 변환했다고 가정
      // treeToFlowElements(TreeNode[] | TreeNode) 시그니처는 네 프로젝트 것 그대로 사용
      const tree = convertOriginalToTree(original);
      const { nodes, edges } = await treeToFlowElements(tree);
      return { api, tree, flowState: null, nodes, edges };
    }
  
    // 3) 어떤 것도 없으면 빈 값
    return { api, tree: [], flowState: null, nodes: [], edges: [] };
  }
  
  /** OriginalDiagram → TreeNode[] 변환기 (간단 구현) */
  function convertOriginalToTree(original: OriginalDiagram): TreeNode[] {
    // flat nodes -> id로 map
    const map = new Map<string, TreeNode>();
    original.nodes.forEach((n) => {
      map.set(n.id, { id: n.id, nodeType: n.nodeType, title: n.title, description: n.description, children: [] });
    });
    // children 연결
    original.nodes.forEach((n) => {
      const parent = map.get(n.id)!;
      n.children.forEach((cid) => {
        const child = map.get(cid);
        if (child) parent.children!.push(child);
      });
    });
    // 루트 추정: 누군가의 child에 등장하지 않은 것들
    const childSet = new Set(original.nodes.flatMap((n) => n.children));
    const roots = original.nodes.filter((n) => !childSet.has(n.id)).map((n) => map.get(n.id)!);
    return roots.length ? roots : Array.from(map.values());
  }
  