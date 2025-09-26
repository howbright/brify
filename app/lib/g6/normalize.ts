// app/lib/g6/normalize.ts

// ---- 타입 정의 (필요 시 별도 types.ts로 빼도 됨) --------------------
export type LayoutType = "mindmap" | "tree" | "radial";
export type Direction = "H" | "LR" | "RL" | "TB" | "BT";
// ---- 타입 정의 상단 근처에 추가 ----
export type Point = [number, number] | [number, number, number] | Float32Array;


export interface OriginalDiagramNode {
  id: string;
  title: string;
  description: string;
  nodeType: "title" | "description";
  children: string[];
}

// TreeLike: buildTree → treeToGraphData로 넘기기 전에 쓰는 구조
type TreeLike = {
  id: string;
  data: any;
  children?: TreeLike[];
};


// ---- 안전한 트리 빌더 (throw 대신 경고 + 연착륙) -------------------
export function safeBuildTree(nodes: OriginalDiagramNode[]): TreeLike {
    try {
      if (!Array.isArray(nodes) || nodes.length === 0) {
        console.error("[safeBuildTree] nodes 비었음:", nodes);
        // 연착륙: 더미 루트
        return { id: "root", data: { title: "Empty", nodeType: "title" }, children: [] };
      }
  
      const byId = new Map(nodes.map(n => [n.id, n]));
      const childIds = new Set<string>();
      nodes.forEach(n => (n.children || []).forEach(c => childIds.add(c)));
  
      const rootId = nodes.find(n => !childIds.has(n.id))?.id ?? nodes[0]?.id;
      if (!rootId) {
        console.error("[safeBuildTree] 루트 후보 없음. nodes[0]로 대체", nodes[0]);
      }
  
      const toTree = (id: string, depth = 0, seen = new Set<string>()): TreeLike => {
        const src = byId.get(id);
        if (!src) {
          console.warn("[safeBuildTree] 존재하지 않는 child id 건너뜀:", id);
          return { id, data: { title: id, nodeType: "title" }, children: [] };
        }
        if (seen.has(id)) {
          console.warn("[safeBuildTree] 사이클 감지. id:", id);
          return { id, data: { title: src.title, nodeType: src.nodeType }, children: [] };
        }
        seen.add(id);
        return {
          id: src.id,
          data: { title: src.title, description: src.description, nodeType: src.nodeType },
          children: (src.children || []).map(c => toTree(c, depth + 1, seen)),
        };
      };
  
      return toTree(rootId!);
    } catch (e) {
      console.error("[safeBuildTree][FATAL]", e);
      // 연착륙
      return { id: "root", data: { title: "Error", nodeType: "title" }, children: [] };
    }
  }
  
  // ---- treeToGraphData 결과 정규화 + 디버그 로그 -----------------------
  type ID = string;
  export type GNode = { id: ID; data?: any; style?: any; type?: string };
  export type GEdge = { id?: string; source: ID; target: ID; data?: any; style?: any, controlPoints?: Point[]; };
  export type GData = { nodes: GNode[]; edges: GEdge[] };
  
  export function normalizeGraphData(raw: any): GData {
    const issues: string[] = [];
    const log  = (...a: any[]) => console.log("[normalizeGraphData]", ...a);
    const warn = (...a: any[]) => { issues.push("WARN: " + a.map(String).join(" ")); console.warn("[normalizeGraphData][warn]", ...a); };
    const err  = (...a: any[]) => { issues.push("ERROR: " + a.map(String).join(" ")); console.error("[normalizeGraphData][ERROR]", ...a); };
  
    try {
      if (!raw || typeof raw !== "object") {
        err("raw is not object:", raw);
        return { nodes: [], edges: [] };
      }
      const rawNodes = Array.isArray(raw.nodes) ? raw.nodes : [];
      const rawEdges = Array.isArray(raw.edges) ? raw.edges : [];
      log(`incoming nodes=${rawNodes.length}, edges=${rawEdges.length}`);
  
      // nodes
      const seen = new Set<string>();
      const nodes: GNode[] = rawNodes.map((n: any, idx: number) => {
        const rawId = (n && (n.id ?? n?.data?.id)) ?? idx;
        const id = String(rawId);
        if (rawId == null) warn(`node[${idx}] no id; fallback index=${idx}`);
        if (typeof rawId !== "string") warn(`node[${idx}] id coerced to string:`, rawId);
        if (seen.has(id)) warn(`duplicate node id: "${id}"`);
        seen.add(id);
        return { id, data: n?.data, style: n?.style, type: n?.type };
      });
  
      const idSet = new Set(nodes.map(n => n.id));
      if (nodes.length === 0) warn("no nodes after normalization");
  
      // edges
      const edges: GEdge[] = [];
      rawEdges.forEach((e: any, i: number) => {
        let src: any = e?.source;
        let tgt: any = e?.target;
        if (typeof src !== "string") {
          const cand = (src && (src.id ?? src?.data?.id));
          if (cand == null) err(`edge[${i}] invalid source`, src);
          src = cand != null ? String(cand) : undefined;
        }
        if (typeof tgt !== "string") {
          const cand = (tgt && (tgt.id ?? tgt?.data?.id));
          if (cand == null) err(`edge[${i}] invalid target`, tgt);
          tgt = cand != null ? String(cand) : undefined;
        }
        if (!src || !tgt) {
          warn(`edge[${i}] dropped; missing endpoint src="${src}" tgt="${tgt}"`);
          return;
        }
        if (!idSet.has(src) || !idSet.has(tgt)) {
          warn(`edge[${i}] orphan; srcIn=${idSet.has(src)} tgtIn=${idSet.has(tgt)} src="${src}" tgt="${tgt}"`);
          return;
        }
      
        const id = e?.id ? String(e.id) : `${src}->${tgt}#${i}`;
      
        // ✅ controlPoints 정규화: 객체 {x,y} → [x, y] 로 바꾸고, 튜플/Float32Array는 그대로 사용
        let cps: Point[] | undefined;
        if (Array.isArray(e?.controlPoints)) {
          cps = (e.controlPoints as any[])
            .map((p, j) => {
              // [x,y] 또는 [x,y,z]
              if (Array.isArray(p)) {
                if (p.length === 2) return [Number(p[0]), Number(p[1])] as [number, number];
                if (p.length >= 3)  return [Number(p[0]), Number(p[1]), Number(p[2])] as [number, number, number];
                return null;
              }
              // Float32Array
              if (p instanceof Float32Array) return p as Float32Array;
              // { x, y } or { x, y, z }
              if (p && typeof p === "object" && typeof p.x === "number" && typeof p.y === "number") {
                const z = typeof (p as any).z === "number" ? (p as any).z : undefined;
                return (z != null)
                  ? ([p.x, p.y, z] as [number, number, number])
                  : ([p.x, p.y] as [number, number]);
              }
              warn(`edge[${i}] controlPoints[${j}] ignored; invalid shape:`, p);
              return null;
            })
            .filter(Boolean) as Point[];
          // 빈 배열이면 undefined로
          if (cps && cps.length === 0) cps = undefined;
        }
      
        edges.push({
          id,
          source: src,
          target: tgt,
          data: e?.data,
          style: e?.style,
          controlPoints: cps, // ✅ 보존!
        });
      });
  
      log(`normalized nodes=${nodes.length}, edges=${edges.length}${issues.length ? `, issues=${issues.length}` : ""}`);
      return { nodes, edges };
    } catch (e) {
      console.error("[normalizeGraphData][FATAL]", e);
      console.error("[normalizeGraphData][FATAL] raw snapshot:", {
        nodes: Array.isArray(raw?.nodes) ? raw.nodes.slice(0, 5) : raw?.nodes,
        edges: Array.isArray(raw?.edges) ? raw.edges.slice(0, 5) : raw?.edges,
      });
      return { nodes: [], edges: [] };
    }
  }
  
  