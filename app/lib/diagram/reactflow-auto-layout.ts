/*
 * React Flow Auto-Layout utilities (ELK.js 2-pass)
 * -------------------------------------------------
 * 이 모듈은 original 데이터(노드/엣지 혹은 children 기반)를
 * React Flow 노드/엣지로 변환하고, ELK.js로 자동 배치를 수행한다.
 * - "간격만 정해서" 자동 배치 (direction, nodeNode, layer)
 * - 노드 내용에 따라 크기가 달라질 때 2-패스(측정 후 재배치) 지원
 * - original.edges가 있으면 우선 사용, 없으면 children로 생성
 * - Next.js 환경에서 SSR 안전을 위해 ELK를 동적 import
 *
 * 사용 순서 요약
 * 1) 초안 배치 (대략 크기) → setNodes/setEdges
 * 2) 렌더 후 실제 크기 측정 (getNodes) → sizeMap 구성
 * 3) sizeMap으로 재배치 → setNodes/setEdges → fitView
 */

// ======== 최소 타입 정의 (React Flow 타입 의존 회피용) ========
export type RFNode = {
    id: string;
    type?: string; //이건 뭐지? 
    position: { x: number; y: number };
    data?: any;
  };
  
  export type RFEdge = {
    id: string;
    source: string;
    target: string;
  };
  
  export type ReactFlowResult = {
    version: 1;
    type: "reactflow";
    nodes: RFNode[];
    edges: RFEdge[];
  };
  
  // ======== original 타입(예상 스키마) ========
  export type OriginalNode = {
    id: string;
    nodeType?: string; //아마도 title | description 일거야. 
    title?: string;
    description?: string;
    children?: string[];
    // 기타 필드 허용
    [key: string]: any; 
  };
  
  export type OriginalEdge = {
    id?: string;
    source: string;
    target: string;
    [key: string]: any;
  };
  
  export type OriginalGraph = {
    nodes: OriginalNode[];
    edges?: OriginalEdge[];
    [key: string]: any;
  };
  
  // ======== 유틸: 타입 가드 ========
  export function isOriginalObject(v: any): v is OriginalGraph {
    return v && typeof v === "object" && Array.isArray(v.nodes);
  }
  
  export function isOriginalArray(v: any): v is OriginalNode[] {
    return Array.isArray(v) && v.every((x) => x && typeof x === "object" && typeof x.id === "string");
  }
  
  // ======== 입력 파싱 & edges 생성/병합 ========
  export function extractItemsAndEdges(original: any): { items: OriginalNode[]; edges: RFEdge[] } {
    const items: OriginalNode[] = isOriginalObject(original)
      ? Array.isArray(original.nodes)
        ? original.nodes
        : []
      : isOriginalArray(original)
      ? original
      : [];
  
    let edges: RFEdge[] = [];
  
    if (isOriginalObject(original) && Array.isArray(original.edges)) {
      edges = original.edges
        .filter((e: any) => e?.source && e?.target)
        .map((e: OriginalEdge) => ({
          id: e.id ?? `e-${e.source}-${e.target}`,
          source: e.source,
          target: e.target,
        }));
    } else {
      const map = new Map(items.map((n) => [n.id, n]));
      items.forEach((n) => {
        (n.children || []).forEach((cid) => {
          if (!map.has(cid)) return;
          edges.push({ id: `e-${n.id}-${cid}`, source: n.id, target: cid });
        });
      });
    }
  
    return { items, edges };
  }
  
  // ======== ELK 로더 (SSR 안전: 동적 import) ========
  let elkInstancePromise: Promise<any> | null = null;
  
  export async function getElk() {
    if (typeof window === "undefined") {
      // SSR 환경: ELK 레이아웃은 스킵하고 호출부에서 폴백 사용
      throw new Error("ELK not available on server");
    }
    if (!elkInstancePromise) {
      elkInstancePromise = import("elkjs/lib/elk.bundled.js").then((m: any) => new m.default());
    }
    return elkInstancePromise;
  }
  
  // ======== 레이아웃 옵션 ========
  export type LayoutSpacing = {
    direction?: "DOWN" | "RIGHT" | "UP" | "LEFT";
    nodeNode?: number; // 같은 레벨 내 노드 간격
    layer?: number; // 레벨(레이어) 간 간격
  };
  
  export type SizeMap = Record<string, { width: number; height: number }>;
  
  const DEFAULT_NODE_W = 220;
  const DEFAULT_NODE_H = 80;
  
  // ======== ELK 레이아웃 ========
  export async function layoutWithElk(
    nodes: RFNode[],
    edges: RFEdge[],
    spacing: LayoutSpacing = {},
    sizeMap: SizeMap = {}
  ): Promise<{ nodes: RFNode[]; edges: RFEdge[] }> {
    const elk = await getElk();
  
    const graph = {
      id: "root",
      layoutOptions: {
        "elk.algorithm": "layered",
        "elk.direction": spacing.direction ?? "DOWN",
        "elk.spacing.nodeNode": String(spacing.nodeNode ?? 48),
        "elk.layered.spacing.nodeNodeBetweenLayers": String(spacing.layer ?? 120),
        "elk.edgeRouting": "ORTHOGONAL",
        "elk.layered.nodePlacement.strategy": "BRANDES_KOEPF",
      },
      children: nodes.map((n) => ({
        id: n.id,
        width: sizeMap[n.id]?.width ?? DEFAULT_NODE_W,
        height: sizeMap[n.id]?.height ?? DEFAULT_NODE_H,
      })),
      edges: edges.map((e) => ({ id: e.id, sources: [e.source], targets: [e.target] })),
    } as any;
  
    const res = await elk.layout(graph);
  
    const posById = new Map<string, { x: number; y: number }>();
    res.children?.forEach((c: any) => posById.set(c.id, { x: c.x ?? 0, y: c.y ?? 0 }));
  
    const laidOutNodes = nodes.map((n) => ({
      ...n,
      position: posById.get(n.id) ?? { x: 0, y: 0 },
    }));
  
    return { nodes: laidOutNodes, edges };
  }
  
  // ======== 폴백: 간단 BFS 레이아웃 (spacing만 반영) ========
  export function fallbackBfsLayout(items: OriginalNode[], edges: RFEdge[], spacing: LayoutSpacing = {}) {
    const X_STEP = spacing.nodeNode ?? 320;
    const Y_STEP = spacing.layer ?? 120;
  
    const map = new Map(items.map((n) => [n.id, n]));
    const childSet = new Set<string>();
    items.forEach((n) => (n.children || []).forEach((cid) => childSet.add(cid)));
    const roots = items.filter((n) => !childSet.has(n.id));
  
    const depth = new Map<string, number>();
    const order = new Map<string, number>();
    const levels: string[][] = [];
    const queue: string[] = roots.map((r) => r.id);
  
    roots.forEach((r) => {
      depth.set(r.id, 0);
      if (!levels[0]) levels[0] = [];
      order.set(r.id, levels[0].length);
      levels[0].push(r.id);
    });
  
    while (queue.length) {
      const pid = queue.shift()!;
      const d = depth.get(pid) ?? 0;
      const p = map.get(pid);
      (p?.children || []).forEach((cid) => {
        if (!map.has(cid)) return;
        if (!depth.has(cid)) {
          depth.set(cid, d + 1);
          if (!levels[d + 1]) levels[d + 1] = [];
          order.set(cid, levels[d + 1].length);
          levels[d + 1].push(cid);
          queue.push(cid);
        }
      });
    }
  
    const rfNodes: RFNode[] = items.map((n) => {
      const d = depth.get(n.id) ?? 0;
      const k = order.get(n.id) ?? 0;
      return {
        id: n.id,
        type: "custom",
        position: { x: k * X_STEP, y: d * Y_STEP },
        data: {
          nodeType: n.nodeType,
          title: n.title,
          description: n.description,
          label: n.title || n.description || "",
        },
      };
    });
  
    const rfEdges = edges;
    return { nodes: rfNodes, edges: rfEdges };
  }
  
  // ======== original → React Flow (ELK 적용) ========
  export async function originalToReactFlowAsync(
    original: any,
    opts?: { spacing?: LayoutSpacing; sizeMap?: SizeMap }
  ): Promise<ReactFlowResult> {
    const { items, edges } = extractItemsAndEdges(original);
    if (!Array.isArray(items) || items.length === 0) {
      return { version: 1, type: "reactflow", nodes: [], edges: [] };
    }
  
    // 1) RF 노드 변환 (좌표는 레이아웃에서 확정)
    const rfNodes: RFNode[] = items.map((n) => ({
      id: n.id,
      type: "custom",
      position: { x: 0, y: 0 },
      data: {
        nodeType: n.nodeType,
        title: n.title,
        description: n.description,
        label: n.title || n.description || "",
      },
    }));
  
    // 2) ELK 시도 → 실패 시 BFS 폴백
    try {
      const { nodes, edges: laidEdges } = await layoutWithElk(rfNodes, edges, opts?.spacing, opts?.sizeMap);
      return { version: 1, type: "reactflow", nodes, edges: laidEdges };
    } catch (e) {
      const { nodes, edges: laidEdges } = fallbackBfsLayout(items, edges, opts?.spacing);
      return { version: 1, type: "reactflow", nodes, edges: laidEdges };
    }
  }
  
  // ======== React 훅: 2-패스 자동 배치 (React Flow 통합) ========
  // 주의: 이 훅은 클라이언트 컴포넌트에서만 사용하세요.
  // 사용처에서: const { setNodes, setEdges, fitView, getNodes } = useReactFlow();
  //             useElkAutoLayout(original, { spacing })
  
  /*
  예시 사용법
  
  import { useEffect } from "react";
  import { useReactFlow } from "reactflow";
  import { originalToReactFlowAsync } from "./reactflow-auto-layout";
  
  export function useElkAutoLayout(original: any, spacing?: LayoutSpacing) {
    const { setNodes, setEdges, fitView, getNodes } = useReactFlow();
  
    useEffect(() => {
      (async () => {
        // 1) 초안 배치
        const draft = await originalToReactFlowAsync(original, { spacing });
        setNodes(draft.nodes);
        setEdges(draft.edges);
  
        // 2) 렌더 후 실제 크기 측정
        await new Promise((r) => requestAnimationFrame(r as any));
        const measured = getNodes();
        const sizeMap: SizeMap = {};
        measured.forEach((n: any) => {
          if (n?.id && n?.width && n?.height) {
            sizeMap[n.id] = { width: n.width, height: n.height };
          }
        });
  
        // 3) 실제 크기로 재배치
        const finalLayout = await originalToReactFlowAsync(original, { spacing, sizeMap });
        setNodes(finalLayout.nodes);
        setEdges(finalLayout.edges);
        fitView({ padding: 0.2 });
      })();
    // original이나 spacing이 자주 변한다면 디펜던시 조절
    }, [original, JSON.stringify(spacing)]);
  }
  */
  
  // ======== 간단 헬퍼: 즉시 변환(배치 포함) ========
  export async function originalToReactFlow(
    original: any,
    spacing?: LayoutSpacing,
    sizeMap?: SizeMap
  ): Promise<ReactFlowResult> {
    return originalToReactFlowAsync(original, { spacing, sizeMap });
  }
  
  // ======== 설치 가이드 (주석)
  /*
  설치:
    npm i elkjs
  또는
    yarn add elkjs
  
  Next.js 주의:
    - 이 파일을 클라이언트 측에서만 사용하는 훅/컴포넌트에서 import 하세요.
    - SSR에서 배치가 필요하면 fallbackBfsLayout 결과를 서버에서 먼저 내려주고,
      클라이언트에서 2-패스(ELK 재배치)를 씌우는 하이브리드 전략을 쓸 수 있습니다.
  */
  