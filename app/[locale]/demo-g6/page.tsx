"use client";

import { sampleNodes } from "@/app/lib/g6/sampleData";
import { Graph } from "@/components/diagram/G6";
import { buildTree, enhanceTreeSizes } from "@/utils/g6/calculator2"; // ✅ 트리/사이즈 주입 유틸
import type { GraphOptions, Graph as G6Graph, NodeData } from "@antv/g6";
import { useMemo } from "react";


export default function Page() {
  // 1) 배열 -> 트리 -> 사이즈/라벨 사전 주입
  const rawTree = useMemo(() => buildTree(sampleNodes), []);
  const treeData = useMemo(() => (rawTree ? enhanceTreeSizes(rawTree) : rawTree), [rawTree]);

  // 좌/우 판별 (style.x 없으면 d.x 사용)
  function getNodeSide(graph: G6Graph, datum: NodeData): "left" | "right" {
    const parent = graph.getParentData(datum.id as string, "tree");
    if (!parent) return "right";
    const px = (parent as any)?.style?.x ?? (parent as any)?.x ?? 0;
    const cx = (datum as any)?.style?.x ?? (datum as any)?.x ?? 0;
    return cx > px ? "right" : "left";
  }

  const COLORS = {
    titleFill: "#F3F4F6",
    titleStroke: "#334155",
    descFill: "#FFFFFF",
    descStroke: "#94A3B8",
    labelDark: "#0F172A",
  } as const;

  // enhanceTreeSizes에서 쓰는 것과 동일한 기본값
  const MIN_W = 140;
  const MIN_H = 44;
  const LINE_HEIGHT = 16;

  const baseOptions = useMemo<GraphOptions>(
    () => ({
      height: 560,                 // 확실히 보이게 높이 보장
      zoom: 1,
      zoomRange: [0.5, 3],
      autoFit: {
        type: "view",
        options: { when: "always", direction: "both" },
        animation: { duration: 800, easing: "ease-in-out" },
      },
      autoResize: true,
      padding: 20,

      // ✅ mindmap에는 반드시 "트리"를 넣자
      data: treeData,

      behaviors: ["drag-canvas", "zoom-canvas", "drag-element", "collapse-expand"],
      background: "#141414",

      node: {
        type: "rect",
        ports: [{ placement: "right" }, { placement: "left" }],
        // ✅ 여기선 "사전 주입된" size/_label만 사용 (렌더 때 재계산 금지)
        style(this: G6Graph, d: NodeData) {
          const raw: any = (d as any).data;
          const isTitle = raw?.nodeType === "title";
          const [w, h] =
            ((d as any)?.style?.size as [number, number]) ?? [MIN_W, MIN_H];

          const placement = getNodeSide(this, d);

          return {
            size: [w, h],
            radius: 10,
            stroke: isTitle ? COLORS.titleStroke : COLORS.descStroke,
            lineWidth: isTitle ? 1.5 : 1,
            fill: isTitle ? COLORS.titleFill : COLORS.descFill,
            clipContent: true,

            labelText: raw?._label ?? String(raw?.title ?? raw?.description ?? ""),
            labelPlacement: placement,
            labelFontSize: isTitle ? 13 : 12,
            labelFontWeight: isTitle ? 600 : 400,
            labelFill: COLORS.labelDark,
            labelLineHeight: LINE_HEIGHT,
            labelTextAlign: "center",
            labelTextBaseline: "middle",

            // ✅ 텍스트 삐져나옴 방지/가독성 향상
            labelBackground: true,
            labelPadding: [8, 12], // [vertical, horizontal]
          };
        },
        animation: { enter: false },
      },

      edge: {
        // 겹침 줄이려면 polyline도 좋음: type: "polyline", style: { radius: 6, offset: 12 }
        type: "cubic-horizontal",
        animation: { enter: false },
        style: { stroke: "#CBD5E1", lineWidth: 1 },
      },

      // ✅ 노드 크기/깊이/타입 기반 "가변 간격"
      layout: {
        type: "mindmap",
        direction: "H",
        getWidth: (d: any) => (d?.style?.size?.[0] ?? MIN_W),
        getHeight: (d: any) => (d?.style?.size?.[1] ?? MIN_H),
        getHGap: (d: any) => {
          const w = d?.style?.size?.[0] ?? MIN_W;
          const depth = d?.data?._depth ?? 0;
          // 폭이 클수록, 상위(depth 작을수록) 더 넓게
          const base = 56 + Math.min(80, Math.max(0, w - 160));
          const depthBonus = depth === 0 ? 40 : depth === 1 ? 20 : 0;
          return base + depthBonus;
        },
        getVGap: (d: any) => {
          const h = d?.style?.size?.[1] ?? MIN_H;
          const isTitle = d?.data?.nodeType === "title";
          return 12 + Math.min(32, Math.max(0, Math.round((h - MIN_H) * 0.5))) + (isTitle ? 6 : 0);
        },
      },
    }),
    [treeData]
  );

  const optionPresets = useMemo(
    (): { title: string; options: GraphOptions; theme: "dark" | "light" }[] => [
      {
        theme: "light",
        title: "mindmap",
        options: {
          ...baseOptions,
        },
      },
    ],
    [baseOptions]
  );

  const handleRender = (g: any) => {
    g.fitCenter?.();
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">G6 Layout Gallery</h1>
      <div className="w-full flex flex-col gap-6">
        {optionPresets.map(({ title, options, theme }, idx) => (
          <Card key={idx} title={title}>
            <div className="h-[560px]">
              <Graph options={options} theme={theme} onRender={handleRender} />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
      <div className="px-4 py-2 border-b bg-slate-50 text-sm font-medium text-slate-700">{title}</div>
      <div className="p-2">{children}</div>
    </div>
  );
}
