// app/lib/diagram/radial-layout.ts
import type { MyFlowEdge, MyFlowNode } from "@/app/types/diagram";

export type RadialOptions = {
  centerId?: string;         // 루트 강제 지정 (없으면 자동 추정)
  radiusStep?: number;       // 레벨 간 반지름(px)
  minAngleGap?: number;      // 같은 레벨 노드 최소 간격(라디안) - 기본 6도
  startAngle?: number;       // 시작 각도(라디안). 기본 -Math.PI/2 = 12시 방향
  clockwise?: boolean;       // 시계방향 배치 여부
};

function buildChildrenFromEdges(nodes: MyFlowNode[], edges: MyFlowEdge[]) {
  const ids = new Set(nodes.map(n => String(n.id)));
  const children = new Map<string, string[]>();
  const parent = new Map<string, string>();
  nodes.forEach(n => children.set(String(n.id), []));
  edges.forEach(e => {
    const s = String(e.source), t = String(e.target);
    if (!ids.has(s) || !ids.has(t)) return;
    children.get(s)!.push(t);
    parent.set(t, s);
  });
  const roots = nodes.map(n => String(n.id)).filter(id => !parent.has(id));
  return { children, parent, roots };
}

function calcSubtreeSize(
    nodeId: string,
    children: Map<string, string[]>,
    memo: Map<string, number> = new Map()
  ): number {
    if (memo.has(nodeId)) return memo.get(nodeId)!;
    const kids: string[] = children.get(nodeId) || [];
    const size: number = 1 + kids.reduce(
      (s, k) => s + calcSubtreeSize(k, children, memo),
      0
    );
    memo.set(nodeId, size);
    return size;
  }
  

const polar = (r:number, a:number) => ({ x: r*Math.cos(a), y: r*Math.sin(a) });

/**
 * 방사형(마인드맵) 좌표 계산: 섹터(가지) 보존 + 동심원 레벨 고정
 * nodes/edges는 React Flow 형식 그대로 넣고, position만 갱신해서 반환.
 */
export function radialMindmapLayoutForFlow(
  nodes: MyFlowNode[],
  edges: MyFlowEdge[],
  opts: RadialOptions = {}
): { nodes: MyFlowNode[]; edges: MyFlowEdge[] } {
  if (!nodes.length) return { nodes, edges };

  const { children, roots } = buildChildrenFromEdges(nodes, edges);
  const centerId = opts.centerId ?? (roots[0] ?? String(nodes[0].id));
  const radiusStep = opts.radiusStep ?? 220;
  const minGap = opts.minAngleGap ?? (6 * Math.PI/180); // 6도
  const startAngle = opts.startAngle ?? (-Math.PI/2);
  const clockwise = opts.clockwise ?? true;

  // 레벨(BFS)
  const depth = new Map<string, number>();
  const q = [centerId];
  depth.set(centerId, 0);
  while (q.length) {
    const p = q.shift()!;
    for (const c of (children.get(p) || [])) {
      if (!depth.has(c)) {
        depth.set(c, (depth.get(p) ?? 0) + 1);
        q.push(c);
      }
    }
  }

  // 서브트리 크기
  const subSize = new Map<string, number>();
  for (const n of nodes) calcSubtreeSize(String(n.id), children, subSize);

  // 각도 배분
  const aStart = new Map<string, number>();
  const aSpan  = new Map<string, number>();
  aStart.set(centerId, startAngle);
  aSpan.set(centerId, 2*Math.PI);

  (function assignAngles(id: string) {
    const kids = children.get(id) || [];
    if (!kids.length) return;
    const total = kids.reduce((s,k)=> s + (subSize.get(k) || 1), 0);
    const base = aStart.get(id)!;
    const span = aSpan.get(id)!;

    const totalGap = Math.max(0, (kids.length - 1) * minGap);
    const usable = Math.max(0, span - totalGap);

    let cur = base;
    const dir = clockwise ? 1 : -1;
    for (let i=0;i<kids.length;i++){
      const k = kids[i];
      const frac = (subSize.get(k) || 1) / total;
      const ks = usable * frac;
      aStart.set(k, cur);
      aSpan.set(k, ks);
      assignAngles(k);
      cur += dir * (ks + (i < kids.length-1 ? minGap : 0));
    }
  })(centerId);

  // 좌표 적용(섹터 중앙각, 레벨별 동일 반지름)
  const pos = new Map<string, {x:number; y:number}>();
  for (const n of nodes) {
    const id = String(n.id);
    const d = depth.get(id) ?? 0;
    const r = d * radiusStep;
    let ang = aStart.get(id)! + aSpan.get(id)!/2;
    if (!clockwise) ang = aStart.get(id)! - aSpan.get(id)!/2;
    pos.set(id, polar(r, ang));
  }

  const nextNodes = nodes.map(n => {
    const p = pos.get(String(n.id))!;
    return { ...n, position: p, dragging: false };
  });

  return { nodes: nextNodes, edges };
}
