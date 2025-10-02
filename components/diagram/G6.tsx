"use client";
import type { GraphOptions } from "@antv/g6";
import { Graph as G6Graph } from "@antv/g6";
import { useEffect, useRef } from "react";

export interface GraphProps {
  options: GraphOptions;
  onRender?: (graph: G6Graph) => void;
  onDestroy?: () => void;
  theme?: "light" | "dark";  // 필요하면 prop로 분리
}

export const Graph = ({ options, onRender, onDestroy, theme = "dark" }: GraphProps) => {
  const graphRef = useRef<G6Graph | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const { theme: _ignoredTheme, ...rest } = options;
  
    if (!containerRef.current) return;
  
    // plugins 같은 건 일단 제거(문자열 지정하면 실패). 필요하면 실제 인스턴스로.
    const { plugins: _ignoredPlugins, ...safeRest } = rest as any;
  
    const graph = new G6Graph({
      container: containerRef.current,
      ...safeRest,
      theme,
    });
    graphRef.current = graph;
  
    let cancelled = false;
    (async () => {
      try {
        // ⬇️ 데이터가 들어있는지 로그
        console.log("[G6] init options.data =", safeRest.data);
        // ⬇️ 초기에도 명시적으로 setData → render
        if (safeRest.data) {
          await graph.setData(safeRest.data);
        }
        await graph.render();
        if (cancelled) return;
        graph.setTheme(theme);
        console.log("[G6] rendered OK");
        onRender?.(graph);
      } catch (e) {
        console.error("[G6] render failed:", e);
      }
    })();
  
    return () => {
      cancelled = true;
      if (graph && !graph.destroyed) {
        graph.destroy();
        onDestroy?.();
      }
      graphRef.current = null;
    };
  }, []);
  // 옵션 변경(테마 제외) — render() 호출 금지
  useEffect(() => {
    const graph = graphRef.current;
    if (!graph || graph.destroyed) return;
    const { theme: _ignored, ...rest } = options;
    graph.setOptions(rest);
  }, [options]);

  // 테마만 바뀔 때
  useEffect(() => {
    const graph = graphRef.current;
    if (!graph || graph.destroyed) return;
    graph.setTheme(theme);
    // 배경도 함께 바꿔주면 체감 확실
    graph.setOptions({ background: theme === "dark" ? "#141414" : "#ffffff" });
  }, [theme]);
  
  return <div ref={containerRef} style={{ width: "100%", height: "100%", backgroundColor: "#141414" }}/>;
};
