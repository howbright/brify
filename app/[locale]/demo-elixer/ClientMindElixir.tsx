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
  /** "light"면 화이트 모드 강제, "dark"면 다크 모드 강제 */
  mode?: "light" | "dark";
  /** MindElixir Theme 객체를 직접 넘기고 싶을 때 (mode보다 우선) */
  theme?: any;
};

export default function ClientMindElixir({ mode = "light", theme }: ClientMindElixirProps) {
  const elRef = useRef<HTMLDivElement>(null);
  const mindRef = useRef<any>(null);
  const meRef = useRef<any>(null); // MindElixir 모듈 참조

  // 최초 초기화
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

      // 초기 테마 결정: 커스텀 > mode(light/dark) > 기본
      const resolvedTheme =
        theme ?? (mode === "dark" ? MindElixir.DARK_THEME : MindElixir.THEME);

      const mind = new MindElixir({
        el: elRef.current,
        direction: MindElixir.LEFT,
        draggable: true,
        contextMenu: true,
        toolBar: true,
        keypress: true,
        theme: resolvedTheme,
      });

      mind.install(NodeMenu);

      const data = toMindElixirData(sampleNodes as OriginalDiagramNode[]);
      mind.init(data);

      mindRef.current = mind;
    })().catch((e) => console.error("[ME] init failed:", e));

    return () => {
      cancelled = true;
      try {
        mindRef.current?.destroy?.();
      } catch {}
      mindRef.current = null;
    };
  }, []); // mount 1회

  // mode / theme prop 바뀌면 런타임 테마 변경
  useEffect(() => {
    const mind = mindRef.current;
    const MindElixir = meRef.current;
    if (!mind || !MindElixir) return;

    const resolvedTheme =
      theme ?? (mode === "dark" ? MindElixir.DARK_THEME : MindElixir.THEME);

    const change = mind.changeTheme ?? mind.setTheme; // 버전 호환
    change?.(resolvedTheme);
  }, [mode, theme]);

  return <div ref={elRef} style={{ width: "100%", height: 560 }} />;
}
