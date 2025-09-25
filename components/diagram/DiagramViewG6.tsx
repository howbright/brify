"use client";

import React, { useEffect, useMemo, useRef } from "react";
import { Graph, treeToGraphData } from "@antv/g6";
import {
  GData,
  normalizeGraphData,
  safeBuildTree,
} from "@/app/lib/g6/normalize";
import { calcWrapped, measureTextWidth, PADDING_B, PADDING_L, PADDING_R, PADDING_T, wrapByWidth } from "@/utils/g6/calcuator";

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
      console.log(
        "[graphData useMemo] start. input nodes:",
        data?.nodes?.length,
        data?.nodes?.slice?.(0, 3)
      );
      const tree = safeBuildTree(data?.nodes ?? []);
      console.log(
        "[graphData useMemo] tree root:",
        tree?.id,
        "children:",
        tree?.children?.length
      );
      const raw = treeToGraphData(tree);
      console.log("[graphData useMemo] raw graph:", {
        nodes: Array.isArray(raw?.nodes) ? raw.nodes.length : raw?.nodes,
        edges: Array.isArray(raw?.edges) ? raw.edges.length : raw?.edges,
      });
      const norm = normalizeGraphData(raw);
      console.log("[graphData useMemo] normalized:", {
        nodes: norm.nodes.length,
        edges: norm.edges.length,
      });
      return norm;
    } catch (e: any) {
      console.error("[graphData useMemo][FATAL]", e);
      // 연착륙: 최소 그래프 반환해 렌더 자체는 살리기
      return {
        nodes: [{ id: "root", data: { title: "Fallback", nodeType: "title" } }],
        edges: [],
      };
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
        // 고정 높이 40이 너무 낮으면 줄바꿈 때려도 밖으로 보일 수 있어.
        // 일단 기본 44~56 추천. (줄 수에 따라 늘리고 싶으면 아래에 동적 높이 로직 예시 추가)
        size: (d: any) => [
          Math.min(320, Math.max(140, widthByLabel(labelOf(d)))),
          48,
        ],

        radius: 8,
        stroke: "#CBD5E1",
        lineWidth: 1,
        fill: (d: any) =>
          d?.data?.nodeType === "description" ? "#ffffff" : "#F8FAFC",

        // ✅ 라벨 설정
        labelText: (d: any) => labelOf(d),
        labelPlacement: "center",
        labelPadding: 0, // 라벨 자체 패딩은 0으로 두고…
        padding: [6, 10, 6, 10], // 노드(박스) 내부 여백으로 확보하는 게 깔끔함
        labelFontSize: 12,
        labelFill: "#0F172A",
        labelLineHeight: 16,
        labelWordWrap: true, // ✅ 줄바꿈
        labelMaxWidth: "100%", // ✅ 노드 폭에 맞춰
        clipContent: true, // ✅ 넘치면 클립

        // (선택) 가운데 정렬 명시
        labelTextAlign: "center",
        labelTextBaseline: "middle",
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

    // 줄바꿈/크기 계산용 상수
    const FONT = "12px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
    const LINE_HEIGHT = 16;
    const PADDING_X = 20; // 좌우 패딩 합
    const MIN_W = 140;
    const MAX_W = 420; // 노드 최대 폭 (원하면 조절)

  // 줄바꿈/사이즈 계산은 그대로 사용한다고 가정:
// - calcWrapped(d) => { label, width, height }
// - PADDING_* / LINE_HEIGHT / FONT 상수 동일

const graph = new Graph({
  container,
  width,
  height: h,
  // ❌ autoFit 일단 끄고, 진짜 사이즈가 적용되는지 먼저 확인
  // autoFit: "view",
  data: graphData,

  node: {
    type: "rect",
    style: {
      // ✅ v5 안정: size로 지정
      size: (d: any) => {
        const { width, height } = calcWrapped(d);
        // 혹시 계산값이 0/NaN 나오면 기본값으로 안전장치
        const w = Number.isFinite(width) && width > 0 ? width : 160;
        const h2 = Number.isFinite(height) && height > 0 ? height : 48;
        return [w, h2];
      },

      radius: 8,
      stroke: "#CBD5E1",
      lineWidth: 1,
      fill: (d: any) => (d?.data?.nodeType === "description" ? "#ffffff" : "#F8FAFC"),

      // padding은 label 배치엔 큰 영향이 없을 수 있으니 당장은 빼고 테스트
      // padding: [PADDING_T, PADDING_R, PADDING_B, PADDING_L],
      clipContent: true,

      // ✅ 라벨: 우리가 \n으로 줄바꿈, wordWrap/ellipsis 끔
      labelText: (d: any) => {
        const { label } = calcWrapped(d);
        return label;
      },
      labelPlacement: "center",
      labelFontSize: 12,
      labelFill: "#0F172A",
      labelLineHeight: LINE_HEIGHT,
      labelWordWrap: false,      // 자동 줄바꿈 OFF
      labelMaxWidth: undefined,  // ellipsis 유발 방지
      labelTextAlign: "center",
      labelTextBaseline: "middle",
    },
  },

  edge: {
    type: "cubic-horizontal",
    style: {
      stroke: "#94A3B8",
      lineWidth: 1.2,
      endArrow: false,
    },
  },

  behaviors: ["drag-canvas", "zoom-canvas", "drag-element"],
  layout,
});

// ✅ autoFit 끄고 나서, 첫 렌더 후 화면에 맞추고 싶으면 fitCenter만 사용
graph.render();
graph.fitCenter();   // 필요하면 유지, 너무 작으면 이 줄도 잠깐 주석처리해서 차이 확인

    

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
