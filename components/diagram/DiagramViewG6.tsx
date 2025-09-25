"use client";

import React, { useEffect, useMemo, useRef } from "react";
import { Graph, treeToGraphData } from "@antv/g6";
import { GData, normalizeGraphData, safeBuildTree } from "@/app/lib/g6/normalize";

export type LayoutType = "mindmap" | "tree" | "radial";
export type Direction = "H" | "LR" | "RL" | "TB" | "BT";

export interface OriginalDiagramNode {
  id: string;
  title: string;
  description: string;
  nodeType: "title" | "description";
  children: string[];
}

type Props = {
  data: { nodes: OriginalDiagramNode[] };
  layoutType: LayoutType;
  direction?: Direction; // mindmap/tree에서만 사용
  height?: number;
};

type TreeLike = {
  id: string;
  data: any;
  children?: TreeLike[];
};

/** flat nodes -> 트리 객체로 변환 */
function buildTree(nodes: OriginalDiagramNode[]): TreeLike {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  // 모든 child id 수집해서 루트 결정
  const childIds = new Set<string>();
  nodes.forEach((n) => n.children.forEach((c) => childIds.add(c)));
  const rootId = nodes.find((n) => !childIds.has(n.id))?.id ?? nodes[0]?.id;

  const toTree = (id: string): TreeLike => {
    const src = byId.get(id)!;
    return {
      id: src.id,
      data: {
        title: src.title,
        description: src.description,
        nodeType: src.nodeType,
      },
      children: (src.children || []).map(toTree),
    };
  };

  if (!rootId) throw new Error("nodes 데이터에 루트 후보가 없습니다.");
  return toTree(rootId);
}

/** 노드에 표시할 라벨 텍스트 */
function labelOf(d: any) {
  const info = d?.data ?? {};
  if (info.nodeType === "description")
    return info.description || info.title || d.id;
  return info.title || info.description || d.id;
}

/** 텍스트 길이에 따른 간단한 폭 추정 */
function widthByLabel(text: string) {
  const len = (text ?? "").length;
  // 한글 고려 약간 넉넉히
  const est = 12 * len * 0.7 + 24;
  return Math.max(120, Math.min(320, est));
}

export default function DiagramViewG6({
  data,
  layoutType,
  direction = "LR",
  height = 360,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<Graph | null>(null);

// ---- useMemo 부분: try/catch + 입력/출력 로그 -------------------------
const graphData = useMemo<GData>(() => {
  try {
    console.log("[graphData useMemo] start. input nodes:", data?.nodes?.length, data?.nodes?.slice?.(0, 3));
    const tree = safeBuildTree(data?.nodes ?? []);
    console.log("[graphData useMemo] tree root:", tree?.id, "children:", tree?.children?.length);
    const raw = treeToGraphData(tree);
    console.log("[graphData useMemo] raw graph:", {
      nodes: Array.isArray(raw?.nodes) ? raw.nodes.length : raw?.nodes,
      edges: Array.isArray(raw?.edges) ? raw.edges.length : raw?.edges,
    });
    const norm = normalizeGraphData(raw);
    console.log("[graphData useMemo] normalized:", { nodes: norm.nodes.length, edges: norm.edges.length });
    return norm;
  } catch (e: any) {
    console.error("[graphData useMemo][FATAL]", e);
    // 연착륙: 최소 그래프 반환해 렌더 자체는 살리기
    return { nodes: [{ id: "root", data: { title: "Fallback", nodeType: "title" } }], edges: [] };
  }
}, [data]);


useEffect(() => {
  const container = containerRef.current!;
  if (!container) return;

  const { width } = container.getBoundingClientRect();
  const h = height;

  graphRef.current?.destroy?.();

  const isVertical = direction === "TB" || direction === "BT";

  // 1) 레이아웃 구성 동일 (생략)
  const layout =
    layoutType === "radial"
      ? { type: "radial" as const, unitRadius: 120, preventOverlap: true }
      : layoutType === "mindmap"
      ? {
          type: "mindmap" as const,
          direction,
          getWidth: (d: any) => widthByLabel(labelOf(d)),
          getHeight: () => 40,
          getHGap: () => 36,
          getVGap: () => 18,
        }
      : {
          type: "compact-box" as const,
          direction: direction === "H" ? "LR" : direction,
          getWidth: (d: any) => widthByLabel(labelOf(d)),
          getHeight: () => 40,
          getHGap: () => 36,
          getVGap: () => 18,
        };

  // 2) 포트 정의 (placement + id)
  const ports =
    layoutType === "radial"
      ? [{ id: "center", placement: "center" as const }]
      : isVertical
      ? [
          { id: "top", placement: "top" as const },
          { id: "bottom", placement: "bottom" as const },
        ]
      : [
          { id: "left", placement: "left" as const },
          { id: "right", placement: "right" as const },
        ];

  // 3) 엣지에 사용할 포트 선택 (방향별로)
  const defaultSourcePort =
    layoutType === "radial" ? "center" : isVertical ? "bottom" : "right";
  const defaultTargetPort =
    layoutType === "radial" ? "center" : isVertical ? "top" : "left";

  // 4) treeToGraphData 결과에 포트를 명시적으로 주입
  const wiredData = {
    nodes: graphData.nodes.map((n: any) => ({
      ...n,
      // ✅ 노드에 포트 켜기
      style: {
        ...(n.style ?? {}),
        port: true,
        ports, // 여기에 실제 포트 배열을 붙여야 getPorts가 생김
        size: [widthByLabel(labelOf(n)), 40],
        radius: 8,
        stroke: "#CBD5E1",
        lineWidth: 1,
        fill:
          n?.data?.nodeType === "description" ? "#ffffff" : "#F8FAFC",
        labelText: labelOf(n),
        labelFontSize: 12,
        labelFill: "#0F172A",
        labelPadding: 8,
      },
      type: "rect",
    })),
    edges: graphData.edges.map((e: any) => ({
      ...e,
      // ✅ 엣지가 쓸 포트를 명시 (안 하면 내부 탐색 중 getPorts 경로로 들어감)
      sourcePort: e.sourcePort ?? defaultSourcePort,
      targetPort: e.targetPort ?? defaultTargetPort,
      // 엣지 타입은 포트 요구 적은 "quadratic" 또는 "polyline" 권장
      type: "quadratic",
      style: {
        stroke: "#94A3B8",
        lineWidth: 1,
      },
    })),
  };

  const graph = new Graph({
    container,
    width,
    height: h,
    autoFit: "view",
    data: wiredData,
    // behaviors, layout 동일
    behaviors: ["drag-canvas", "zoom-canvas", "drag-element"],
    layout,
  });

  graph.render();
  graphRef.current = graph;

  const ro = new ResizeObserver(([entry]) => {
    const w = entry.contentRect.width;
    graph.setSize(w, height);
    graph.render();
  });
  ro.observe(container);

  return () => {
    ro.disconnect();
    graph.destroy();
    graphRef.current = null;
  };
}, [graphData, layoutType, direction, height]);


  return <div ref={containerRef} style={{ width: "100%", height }} />;
}
