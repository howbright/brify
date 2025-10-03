"use client";

import { useEffect, useRef } from "react";
import { sampleNodes } from "@/app/lib/g6/sampleData";

// 타입
type OriginalDiagramNode = {
  id: string;
  title: string;
  description: string;
  nodeType: "title" | "description";
  children: string[];
};

type MENode = {
  id: string;
  topic: string;
  children?: MENode[];
  root?: boolean;
  expanded?: boolean;
};
type MEData = { nodeData: MENode };

// OriginalDiagramNode[] -> Mind-Elixir 데이터로 변환
function toMindElixirData(nodes: OriginalDiagramNode[]): MEData {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const childSet = new Set<string>();
  nodes.forEach((n) => (n.children || []).forEach((c) => childSet.add(c)));
  const rootId = nodes.find((n) => !childSet.has(n.id))?.id ?? nodes[0].id;

  const build = (id: string): MENode => {
    const n = byId.get(id)!;
    const topic =
      (n.nodeType === "title" ? n.title : n.description) ||
      n.title ||
      n.description ||
      n.id;
    return {
      id: n.id,
      topic,
      expanded: true,
      children: (n.children || [])
        .map((cid) => (byId.has(cid) ? build(cid) : null))
        .filter(Boolean) as MENode[],
    };
  };

  const nodeData = build(rootId);
  nodeData.root = true;
  return { nodeData };
}

type ClientMindElixirProps = {
  mode?: "light" | "dark";
  theme?: any;
  /** 트랙패드/휠 확대 감도(작을수록 부드럽게). 예: 30~120 권장 */
  zoomSensitivity?: number;
  /** 캔버스 드래그 버튼: 0=왼쪽, 2=오른쪽(기본) */
  dragButton?: 0 | 2;
  /** 처음 로딩할 때 전체가 화면에 맞도록 */
  fitOnInit?: boolean;
   /** 좌클릭으로 선택 시, 컨텍스트 메뉴도 함께 열기 */
   openMenuOnClick?: boolean;
};

export default function ClientMindElixir({
  mode = "light",
  theme,
  zoomSensitivity = 0.3,
  dragButton = 2,
  fitOnInit = true,
  openMenuOnClick = true
}: ClientMindElixirProps) {
  const elRef = useRef<HTMLDivElement>(null);
  const mindRef = useRef<any>(null);
  const meRef = useRef<any>(null);

  useEffect(() => {
    if (!elRef.current) return;
    let cancelled = false;

    (async () => {
      const [{ default: MindElixir }, nodeMenuMod] = await Promise.all([
        import("mind-elixir"),
        import("@mind-elixir/node-menu"),
      ]);
      const NodeMenu = (nodeMenuMod as any).default ?? (nodeMenuMod as any);
      meRef.current = MindElixir;
      if (cancelled || !elRef.current) return;

      const resolvedTheme =
        theme ?? (mode === "dark" ? MindElixir.DARK_THEME : MindElixir.THEME);

      const mind = new MindElixir({
        el: elRef.current,
        direction: MindElixir.LEFT,
        contextMenu: true, //코어 우클릭 메뉴 비활성화
        toolBar: true,
        keypress: true,
        draggable: true, // 노드 드래그
        theme: resolvedTheme,
        // ✅ 추가된 옵션들
        scaleSensitivity: zoomSensitivity, // 확대/축소 감도 조절
        mouseSelectionButton: dragButton, // 캔버스 드래그 버튼 지정(0=좌, 2=우)
        alignment: "nodes", // 재정렬 시 전체 맵 기준 정렬
      });

      mind.install(NodeMenu);

      const data = toMindElixirData(sampleNodes as OriginalDiagramNode[]);
      mind.init(data);

      mind.bus?.addListener?.("operation", (op: any) => {
        if (op.name === "selectNode") console.log("select:", op.data?.id);
      });

      // ✅ 초기 로딩 시 전체가 보이도록
      if (fitOnInit) {
        mind.scaleFit(); // 모든 노드가 뷰에 꽉 차도록
        mind.toCenter(); // 중심 맞춤(선택)
      }

      mindRef.current = mind;
    })().catch((e) => console.error("[ME] init failed:", e));

    return () => {
      cancelled = true;
      try {
        mindRef.current?.destroy?.();
      } catch {}
      mindRef.current = null;
    };
  }, [zoomSensitivity, dragButton, fitOnInit, mode, theme]);

  // 테마 변경 실시간 반영(이전과 동일)
  useEffect(() => {
    const mind = mindRef.current;
    const MindElixir = meRef.current;
    if (!mind || !MindElixir) return;

    const resolvedTheme =
      theme ?? (mode === "dark" ? MindElixir.DARK_THEME : MindElixir.THEME);

    const change = mind.changeTheme ?? mind.setTheme;
    change?.(resolvedTheme);
  }, [mode, theme]);

  return (
    <div className="relative w-full" style={{ height: 560 }}>
      <div ref={elRef} className="w-full h-full" />
    </div>
  );
}
