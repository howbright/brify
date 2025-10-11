// app/api/summary/utils.ts
// ✅ Route 파일이 아니라서 자유롭게 export 가능

// React Flow 스냅샷 형태인지 체크
export function isReactFlow(v: any) {
    return v && typeof v === "object" && Array.isArray(v.nodes) && Array.isArray(v.edges);
  }
  
  // (필요하면 사용) 원본 배열 형태인지 체크
  export function isOriginalArray(v: any) {
    return Array.isArray(v) && v.length > 0 && typeof v[0] === "object" && "id" in v[0];
  }
  
  // (필요하면 사용) 원본 오브젝트 형태인지 체크
  export function isOriginalObject(v: any) {
    return v && typeof v === "object" && v.type === "original" && Array.isArray(v.nodes);
  }
  
  // React Flow 스냅샷으로 보강(누락된 version/type 채움)
  export function toReactFlowState(raw: any) {
    if (!raw) return null;
    if (isReactFlow(raw)) {
      return {
        version: raw.version ?? 1,
        type: raw.type ?? "reactflow",
        nodes: raw.nodes,
        edges: raw.edges,
      };
    }
    return null;
  }
  
  /**
   * (옵션) 간단 레이아웃 변환기: original -> reactflow
   * - 필요 시 테스트/폴백 용도로 사용할 수 있어.
   * - 현재 route.ts에서는 `originalToReactFlow`(너가 만든 정식 변환기)를 사용하므로,
   *   이 old 함수는 사용하지 않으면 삭제해도 됨.
   */
  export function originalToReactFlow_old(original: any): {
    version: 1;
    type: "reactflow";
    nodes: any[];
    edges: any[];
  } {
    const items = isOriginalObject(original)
      ? original.nodes
      : (isOriginalArray(original) ? original : []);
  
    if (!Array.isArray(items) || items.length === 0) {
      return { version: 1, type: "reactflow", nodes: [], edges: [] };
    }
  
    // id -> node 맵
    const map = new Map(items.map((n: any) => [n.id, n]));
    // 자식 집합
    const childSet = new Set<string>();
    items.forEach((n: any) => (n.children || []).forEach((cid: string) => childSet.add(cid)));
  
    // 루트들
    const roots = items.filter((n: any) => !childSet.has(n.id));
  
    // BFS로 depth / order / levels
    const depth = new Map<string, number>();
    const order = new Map<string, number>();
    const levels: string[][] = [];
  
    const queue: string[] = roots.map((r: any) => r.id);
    roots.forEach((r: any) => {
      depth.set(r.id, 0);
      if (!levels[0]) levels[0] = [];
      order.set(r.id, levels[0].length);
      levels[0].push(r.id);
    });
  
    while (queue.length) {
      const pid = queue.shift()!;
      const p = map.get(pid);
      const d = depth.get(pid) ?? 0;
      (p?.children || []).forEach((cid: string) => {
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
  
    // 좌표 배치 (간단 버전)
    const X_STEP = 320;
    const Y_STEP = 120;
  
    const nodes = items.map((n: any) => {
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
  
    const edges: any[] = [];
    items.forEach((n: any) => {
      (n.children || []).forEach((cid: string) => {
        if (!map.has(cid)) return;
        edges.push({
          id: `e-${n.id}-${cid}`,
          source: n.id,
          target: cid,
        });
      });
    });
  
    return { version: 1, type: "reactflow", nodes, edges };
  }
  