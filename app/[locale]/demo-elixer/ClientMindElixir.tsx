"use client";

import { useEffect, useRef } from "react";
import { sampled, sData } from "@/app/lib/g6/sampleData"; // sampleNodes 미사용이면 제거
import "@mind-elixir/node-menu/dist/style.css";

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

// 필요 시에만 유지
// function toMindElixirData(nodes: OriginalDiagramNode[]): MEData { ... }

type ClientMindElixirProps = {
  mode?: "light" | "dark";
  theme?: any;
  /** 트랙패드/휠 확대 감도(작을수록 부드럽게). 예: 0.1~1 권장 */
  zoomSensitivity?: number;
  /** 캔버스 드래그 버튼: 0=왼쪽, 2=오른쪽(기본) */
  dragButton?: 0 | 2;
  /** 처음 로딩할 때 전체가 화면에 맞도록 */
  fitOnInit?: boolean;
  /** 좌클릭 선택 시 컨텍스트 메뉴도 함께 열기 */
  openMenuOnClick?: boolean;
};

export default function ClientMindElixir({
  mode = "light",
  theme,
  zoomSensitivity = 0.3,
  dragButton = 2,
  fitOnInit = true,
  openMenuOnClick = true,
}: ClientMindElixirProps) {
  const elRef = useRef<HTMLDivElement>(null);
  const mindRef = useRef<any>(null);
  const meRef = useRef<any>(null);

  useEffect(() => {
    if (!elRef.current) return;
    if (mindRef.current) return;
    let cancelled = false;

    (async () => {
      const [{ default: MindElixir }] = await Promise.all([
        import("mind-elixir"),
      ]);
      meRef.current = MindElixir;
      if (cancelled || !elRef.current) return;

      const resolvedTheme =
        theme ?? (mode === "dark" ? MindElixir.DARK_THEME : MindElixir.THEME);

      const mind = new MindElixir({
        el: elRef.current,
        direction: MindElixir.RIGHT,
        contextMenu: true, // 우클릭 메뉴 활성화 (주석 수정)
        toolBar: true,
        keypress: true,
        draggable: true,
        theme: resolvedTheme,
        editable: true,
        locale: "ko",
        // ✅ props 제대로 연결
        scaleSensitivity: zoomSensitivity,
        mouseSelectionButton: 0, // ← prop 반영
        // alignment: "nodes", // ❌ 미지원 가능성 높음 — 제거
      });

      const data = sampled;
      mind.init(data);

      //   mind.bus?.addListener?.("operation", (op: any) => {
      //     if (op.name === "selectNode") console.log("select:", op.data?.id);
      //   });

      //   // 선택 시 좌클릭으로 메뉴도 열고 싶다면(간단 구현 예)
      //   // 좌클릭 선택 시 우클릭 컨텍스트 메뉴를 강제로 띄우기
      //   if (openMenuOnClick) {
      //     mind.bus?.addListener?.("operation", (op: any) => {
      //       if (op?.name !== "selectNode") return;

      //       const id = op?.data?.id ?? op?.obj?.id;
      //       if (!id) return;

      //       // Mind-Elixir는 노드 루트 엘리먼트에 data-nodeid 속성이 붙습니다.
      //       const host = elRef.current;
      //       const nodeEl = host?.querySelector<HTMLElement>(
      //         `[data-nodeid="${id}"]`
      //       );
      //       if (!nodeEl) return;

      //       // 노드 가운데 근처 좌표로 contextmenu 이벤트를 쏩니다.
      //       const rect = nodeEl.getBoundingClientRect();
      //       const evt = new MouseEvent("contextmenu", {
      //         bubbles: true,
      //         cancelable: true,
      //         clientX: rect.left + rect.width / 2,
      //         clientY: rect.top + rect.height / 2,
      //       });
      //       nodeEl.dispatchEvent(evt);
      //     });
      //   }

      //   if (fitOnInit) {
      //     // ✅ 안전 가드: 메서드 존재할 때만 호출
      //     (mind as any).fit?.();
      //     mind.toCenter?.();
      //   }

      mindRef.current = mind;
    })().catch((e) => console.error("[ME] init failed:", e));

    return () => {
      cancelled = true;
      try {
        mindRef.current?.destroy?.();
      } catch {}
      mindRef.current = null;
    };
  }, [zoomSensitivity, dragButton, fitOnInit, mode, theme, openMenuOnClick]);

  // 테마 변경
  useEffect(() => {
    const mind = mindRef.current;
    const MindElixir = meRef.current;
    if (!mind || !MindElixir) return;

    const resolvedTheme =
      theme ?? (mode === "dark" ? MindElixir.DARK_THEME : MindElixir.THEME);

    const change = (mind as any).changeTheme ?? (mind as any).setTheme;
    change?.(resolvedTheme);
  }, [mode, theme]);

  return (
    <div className="relative w-full h-full">
      <div ref={elRef} className="w-full h-full" />
    </div>
  );
}
