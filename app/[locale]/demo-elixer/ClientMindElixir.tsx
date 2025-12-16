"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { sampled } from "@/app/lib/g6/sampleData";
import "@mind-elixir/node-menu/dist/style.css";

type ClientMindElixirProps = {
  mode?: "light" | "dark" | "auto";
  theme?: any;

  zoomSensitivity?: number; // scaleSensitivity
  dragButton?: 0 | 2; // mouseSelectionButton
  fitOnInit?: boolean;
  openMenuOnClick?: boolean;
};

export default function ClientMindElixir({
  mode = "auto",
  theme,
  zoomSensitivity = 0.3,
  dragButton = 0,
  fitOnInit = true,
  openMenuOnClick = false,
}: ClientMindElixirProps) {
  const elRef = useRef<HTMLDivElement>(null);
  const mindRef = useRef<any>(null);

  const { resolvedTheme } = useTheme();

  const [mounted, setMounted] = useState(false);
  const [ready, setReady] = useState(false);

  // init 경쟁상태 방지용 토큰
  const initTokenRef = useRef(0);

  useEffect(() => setMounted(true), []);

  const effectiveMode = useMemo<"light" | "dark">(() => {
    if (mode === "light" || mode === "dark") return mode;
    // mounted 전에는 값이 흔들릴 수 있으니까 light로 고정
    if (!mounted) return "light";
    return resolvedTheme === "dark" ? "dark" : "light";
  }, [mode, resolvedTheme, mounted]);

  // ✅ 테마가 바뀌면 changeTheme 대신 안전하게 re-init
  useEffect(() => {
    if (!mounted) return;
    if (!elRef.current) return;

    let cancelled = false;
    const myToken = ++initTokenRef.current;

    // 이전 인스턴스 정리
    try {
      mindRef.current?.destroy?.();
    } catch {}
    mindRef.current = null;

    setReady(false);

    (async () => {
      const mod = await import("mind-elixir");
      const MindElixir = mod.default;
      if (cancelled || myToken !== initTokenRef.current) return;
      if (!elRef.current) return;

      const resolvedThemeObj =
        theme ??
        (effectiveMode === "dark" ? MindElixir.DARK_THEME : MindElixir.THEME);

      const mind = new MindElixir({
        el: elRef.current,
        direction: MindElixir.RIGHT,
        contextMenu: false,
        toolBar: false,
        keypress: false,
        draggable: false,
        editable: false,
        locale: "ko",
        // ✅ 네가 원한 옵션들
        scaleSensitivity: zoomSensitivity,
        mouseSelectionButton: dragButton,

        theme: resolvedThemeObj,
      });

      mind.init(sampled);

      // ✅ 레이아웃 안정화 후 ready
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (cancelled || myToken !== initTokenRef.current) return;
          if (!elRef.current) return;

          // (네 기존 초기 시점 세팅 유지)
          const host = elRef.current;
          const cx = host.clientWidth / 2;
          const cy = host.clientHeight / 2;
          mind.scale(0.3, { x: cx, y: cy });
          mind.move(300, 30, true);

          setReady(true);
        });
      });

      if (openMenuOnClick) {
        mind.bus?.addListener?.("operation", (op: any) => {
          if (op?.name !== "selectNode") return;

          const id = op?.data?.id ?? op?.obj?.id;
          if (!id) return;

          const host = elRef.current;
          const nodeEl = host?.querySelector<HTMLElement>(`[data-nodeid="${id}"]`);
          if (!nodeEl) return;

          const rect = nodeEl.getBoundingClientRect();
          nodeEl.dispatchEvent(
            new MouseEvent("contextmenu", {
              bubbles: true,
              cancelable: true,
              clientX: rect.left + rect.width / 2,
              clientY: rect.top + rect.height / 2,
            })
          );
        });
      }

      if (fitOnInit) {
        (mind as any).fit?.();
        mind.toCenter?.();
      }

      mindRef.current = mind;
    })().catch((e) => {
      // 여기서도 ready false 유지 (스켈레톤 계속)
      console.error("[ME] init failed:", e);
    });

    return () => {
      cancelled = true;
      // 다음 init에서 destroy 하므로 여기선 토큰만 올려도 됨
    };
  }, [
    mounted,
    effectiveMode,
    theme,
    zoomSensitivity,
    dragButton,
    fitOnInit,
    openMenuOnClick,
  ]);

  return (
    <div className="relative w-full h-full">
      {/* ✅ 실제 캔버스 */}
      <div ref={elRef} className="w-full h-full" />

      {/* ✅ 스켈레톤 오버레이 */}
      {!ready && (
        <div className="absolute inset-0 rounded-2xl overflow-hidden">
          <div className="h-full w-full animate-pulse bg-black/5 dark:bg-white/5" />
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-6 top-6 h-3 w-40 rounded bg-black/10 dark:bg-white/10" />
            <div className="absolute left-6 top-12 h-3 w-28 rounded bg-black/10 dark:bg-white/10" />
            <div className="absolute left-10 top-24 h-24 w-56 rounded-xl bg-black/10 dark:bg-white/10" />
            <div className="absolute right-10 bottom-10 h-20 w-44 rounded-xl bg-black/10 dark:bg-white/10" />
          </div>
        </div>
      )}
    </div>
  );
}
