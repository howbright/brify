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
    const graph = new G6Graph({
        container: containerRef.current!,
         ...rest, theme,
         plugins: ['minimap', 'contextmenu', 'fullscreen', 'history'],
      });
    graphRef.current = graph;

    let cancelled = false;
    graph
      .render()
      .then(() => {
        // 렌더 후 테마 확실히 적용
        graph.setTheme(theme); // 'dark' 적용
        // 현재 테마 확인해보고 싶으면: console.log(graph.getTheme());
        if (!cancelled) onRender?.(graph);
      })
      .catch((e) => console.debug(e));


    return () => {
      const graph = graphRef.current;
      if (graph) {
        graph.destroy();
        onDestroy?.();
        graphRef.current = null;
      }
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
