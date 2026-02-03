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

type AnyNode = {
  id: string;
  topic: string;
  root?: boolean;
  branchColor?: string;
  children?: AnyNode[];
};

function safePaletteFromThemeObj(themeObj: any) {
  const p = themeObj?.palette;
  if (Array.isArray(p) && p.length > 0) return p as string[];
  return ["#3b82f6", "#22c55e", "#a855f7", "#f97316", "#06b6d4"];
}

function toRgba(color: string, alpha: number) {
  const a = Math.max(0, Math.min(1, alpha));
  if (color.startsWith("#")) {
    const hex = color.replace("#", "");
    const full =
      hex.length === 3
        ? hex
            .split("")
            .map((c) => c + c)
            .join("")
        : hex;
    if (full.length === 6) {
      const r = parseInt(full.slice(0, 2), 16);
      const g = parseInt(full.slice(2, 4), 16);
      const b = parseInt(full.slice(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${a})`;
    }
  }
  if (color.startsWith("rgba(")) {
    const parts = color.replace("rgba(", "").replace(")", "").split(",");
    if (parts.length >= 3) {
      const r = Number(parts[0].trim());
      const g = Number(parts[1].trim());
      const b = Number(parts[2].trim());
      return `rgba(${r}, ${g}, ${b}, ${a})`;
    }
  }
  if (color.startsWith("rgb(")) {
    const parts = color.replace("rgb(", "").replace(")", "").split(",");
    if (parts.length >= 3) {
      const r = Number(parts[0].trim());
      const g = Number(parts[1].trim());
      const b = Number(parts[2].trim());
      return `rgba(${r}, ${g}, ${b}, ${a})`;
    }
  }
  return color;
}

function getMindData(mind: any): AnyNode | null {
  const raw =
    mind?.getAllData?.() ??
    mind?.getData?.() ??
    mind?.nodeData ??
    mind?.data ??
    mind?.root ??
    null;

  if (!raw) return null;

  // MindElixir getData/getAllData는 { nodeData, ... } 형태일 수 있음
  if (raw?.nodeData) return raw.nodeData as AnyNode;

  return raw as AnyNode;
}

/**
 * ✅ branchColor를 (깊이 상관없이) 채우고
 * ✅ DOM 노드(me-tpc[data-nodeid])에 --me-branch 를 심는다
 */
function applyBranchBorderColors(params: {
  mind: any;
  host: HTMLElement;
  palette: string[];
}) {
  const { mind, host, palette } = params;
  const data = getMindData(mind);
  if (!data) return;

  // 1) branchColor 채우기: 루트 자식은 팔레트, 아래는 부모색 상속
  const fill = (node: AnyNode, depth: number, mainIndex: number, inherit?: string) => {
    const isRoot = depth === 0;

    let myColor = node.branchColor;
    if (!myColor) {
      if (depth === 1) {
        myColor =
          palette[Math.abs(mainIndex) % palette.length] ||
          inherit ||
          "#94a3b8";
      } else {
        myColor =
          inherit ||
          palette[Math.abs(mainIndex) % palette.length] ||
          "#94a3b8";
      }
    }

    node.branchColor = myColor;

    node.children?.forEach((child, idx) => {
      const nextMainIndex = isRoot ? idx : mainIndex;
      fill(child, depth + 1, nextMainIndex, myColor);
    });
  };

  fill(data, 0, 0, data.branchColor);

  // 2) DOM 적용: me-tpc[data-nodeid] 우선
  const applyDom = (node: AnyNode, depth: number) => {
    const id = String(node.id);
    const altId = `me${id}`;
    const isLeaf = !node.children || node.children.length === 0;

    const el =
      host.querySelector<HTMLElement>(`me-tpc[data-nodeid="${id}"]`) ||
      host.querySelector<HTMLElement>(`[data-nodeid="${id}"]`) ||
      host.querySelector<HTMLElement>(`me-tpc[data-nodeid="${altId}"]`) ||
      host.querySelector<HTMLElement>(`[data-nodeid="${altId}"]`);

    if (el) {
      const c = node.branchColor || "#94a3b8";

      const inner =
        el.querySelector<HTMLElement>(".node") ||
        el.querySelector<HTMLElement>(".topic") ||
        el.querySelector<HTMLElement>("span");

      // ✅ CSS 변수로 색 주입 (CSS가 이걸 border-color로 사용)
      el.style.setProperty("--me-branch", c, "important");

      // ✅ 혹시 모를 경우 대비: border-color도 important로 찍어줌
      const leafBg = toRgba(c, 0.08);
      const borderColor = isLeaf ? "transparent" : c;
      el.style.setProperty("border-color", borderColor, "important");
      el.style.setProperty("border-style", "solid", "important");
      if (depth === 0) {
        el.style.setProperty("border-width", "0px", "important");
        el.style.setProperty("border-color", "transparent", "important");
      } else if (isLeaf) {
        el.style.setProperty("border-width", "0px", "important");
        el.style.setProperty("border-color", "transparent", "important");
      } else {
        el.style.setProperty("border-width", "1px", "important");
      }
      if (isLeaf) {
        el.style.setProperty("background-color", leafBg, "important");
        if (inner) {
          inner.style.setProperty("padding-left", "14px", "important");
          inner.style.setProperty("padding-right", "14px", "important");
        }
      }

      if (depth === 0) {
        // ✅ 루트 노드 강조: 진한 배경 + 흰색 텍스트
        el.style.setProperty("background-color", "rgba(15, 23, 42, 0.92)", "important");
        el.style.setProperty("color", "rgba(255, 255, 255, 0.96)", "important");
        if (inner) {
          inner.style.setProperty(
            "background-color",
            "rgba(15, 23, 42, 0.92)",
            "important"
          );
          inner.style.setProperty("color", "rgba(255, 255, 255, 0.96)", "important");
        }

      } else if (depth === 1) {
      }
    } else if (depth === 0) {
    }

    node.children?.forEach((child) => applyDom(child, depth + 1));
  };

  applyDom(data, 0);
}

export default function ClientMindElixir({
  mode = "auto",
  theme,
  zoomSensitivity = 0.3,
  dragButton = 0,
  fitOnInit = true,
  openMenuOnClick = true,
}: ClientMindElixirProps) {
  const elRef = useRef<HTMLDivElement>(null);
  const mindRef = useRef<any>(null);

  const { resolvedTheme } = useTheme();

  const [mounted, setMounted] = useState(false);
  const [ready, setReady] = useState(false);

  const initTokenRef = useRef(0);
  const hiddenTextRef = useRef<Set<HTMLElement>>(new Set());
  const hiddenTextStyleRef = useRef<Map<HTMLElement, { visibility: string; opacity: string }>>(
    new Map()
  );

  useEffect(() => setMounted(true), []);

  const effectiveMode = useMemo<"light" | "dark">(() => {
    if (mode === "light" || mode === "dark") return mode;
    if (!mounted) return "light";
    return resolvedTheme === "dark" ? "dark" : "light";
  }, [mode, resolvedTheme, mounted]);

  // ✅ 배경: 아이보리 톤 + 네모 도트
  const gridStyle = useMemo(() => {
    const isDark = effectiveMode === "dark";
    const dotColor = isDark ? "#cbd5f5" : "#64748b";
    const dotOpacity = isDark ? "0.10" : "0.12";
    const dotSize = isDark ? 22 : 20;
    const dotSvg = encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' width='${dotSize}' height='${dotSize}' viewBox='0 0 ${dotSize} ${dotSize}'><rect x='1' y='1' width='2' height='2' fill='${dotColor}' fill-opacity='${dotOpacity}'/></svg>`
    );
    const glow = isDark ? "rgba(59,130,246,0.08)" : "rgba(30,64,175,0.06)";

    return {
      backgroundColor: isDark ? "rgba(8,10,16,0.92)" : "#f4f4f4",
      backgroundImage: `
        radial-gradient(1200px 800px at 20% -10%, ${glow}, transparent 60%),
        url("data:image/svg+xml,${dotSvg}")
      `,
      backgroundSize: `100% 100%, ${dotSize}px ${dotSize}px`,
      backgroundPosition: "0 0, 0 0",
    } as React.CSSProperties;
  }, [effectiveMode]);

  useEffect(() => {
    if (!mounted) return;
    if (!elRef.current) return;

    let cancelled = false;
    const myToken = ++initTokenRef.current;

    try {
      mindRef.current?.destroy?.();
    } catch {}
    mindRef.current = null;

    setReady(false);

    let ro: ResizeObserver | null = null;
    let cleanupBus: (() => void) | null = null;
    let mo: MutationObserver | null = null;
    let rafLock = 0;
    let t1: number | null = null;

    (async () => {
      const mod = await import("mind-elixir");
      const MindElixir = mod.default;

      if (cancelled || myToken !== initTokenRef.current) return;
      if (!elRef.current) return;

      const resolvedThemeObj =
        theme ?? (effectiveMode === "dark" ? MindElixir.DARK_THEME : MindElixir.THEME);

      const mind = new MindElixir({
        el: elRef.current,
        direction: MindElixir.RIGHT,
        contextMenu: true,
        toolBar: true,
        keypress: true,
        draggable: true,
        editable: true,
        locale: "ko",
        scaleSensitivity: zoomSensitivity,
        mouseSelectionButton: dragButton,
        theme: resolvedThemeObj,
      });

      // ✅ 배경 투명(격자 레이어 보이게)
      elRef.current.style.background = "transparent";
      const surface = elRef.current;
      const meRoot =
        surface.querySelector<HTMLElement>(".mind-elixir") ??
        surface.querySelector<HTMLElement>(".mind-elixir-container");
      const meCanvas = surface.querySelector<HTMLElement>(".minder");
      const meContent = surface.querySelector<HTMLElement>(".mind-elixir-content");
      const meSvg = surface.querySelector<HTMLElement>("svg");
      const mapContainer = surface.querySelector<HTMLElement>(".map-container");
      const mapCanvas = surface.querySelector<HTMLElement>(".map-canvas");
      const meMain = surface.querySelector<HTMLElement>("me-main");
      const meRootEl = surface.querySelector<HTMLElement>("me-root");
      const meNodes = surface.querySelector<HTMLElement>("me-nodes");
      meRoot?.style.setProperty("background", "transparent", "important");
      meCanvas?.style.setProperty("background", "transparent", "important");
      meContent?.style.setProperty("background", "transparent", "important");
      meSvg?.style.setProperty("background", "transparent", "important");
      mapContainer?.style.setProperty("background", "transparent", "important");
      mapCanvas?.style.setProperty("background", "transparent", "important");
      meMain?.style.setProperty("background", "transparent", "important");
      meRootEl?.style.setProperty("background", "transparent", "important");
      meNodes?.style.setProperty("background", "transparent", "important");


      mind.init(sampled);
      mindRef.current = mind;

      const palette = safePaletteFromThemeObj(resolvedThemeObj);

      const apply = () => {
        if (!elRef.current) return;
        applyBranchBorderColors({ mind, host: elRef.current, palette });
      };

      // ✅ “렌더 타이밍” 커버
      const applySoon = () => {
        if (rafLock) cancelAnimationFrame(rafLock);
        rafLock = requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (cancelled || myToken !== initTokenRef.current) return;
            apply();
          });
        });
      };

      applySoon();
      t1 = window.setTimeout(apply, 500);

      // ✅ 패널 열고닫기/리사이즈 때도 유지
      ro = new ResizeObserver(() => applySoon());
      ro.observe(elRef.current);

      // ✅ MindElixir 내부 변화(노드 추가/편집/접기 등) 때도 유지
      const onOp = (op?: any) => {
        applySoon();
        const docEditablesAll = Array.from(document.querySelectorAll("[contenteditable]"));
        const hostEl = elRef.current;
        const tpcs = hostEl ? Array.from(hostEl.querySelectorAll("me-tpc")) : [];
        const docEditableRect = docEditablesAll[0]
          ? (docEditablesAll[0] as HTMLElement).getBoundingClientRect()
          : null;
        const tpcRects = tpcs
          .map((t) => {
            const rect = t.getBoundingClientRect();
            return {
              el: t,
              tpcClass: t.className?.toString() ?? "",
              rect,
            };
          })
          .filter((item) => item.rect.width > 0 && item.rect.height > 0);
        const overlaps = docEditableRect
          ? tpcRects.filter((item) => {
              const r = item.rect;
              return !(
                r.right < docEditableRect.left ||
                r.left > docEditableRect.right ||
                r.bottom < docEditableRect.top ||
                r.top > docEditableRect.bottom
              );
            })
          : [];
        const opName = op?.name ?? "";
        if (opName === "beginEdit" && docEditableRect) {
          overlaps.forEach((item) => {
            const text = item.el.querySelector<HTMLElement>("span.text");
            if (!text) return;
            if (!hiddenTextRef.current.has(text)) {
              hiddenTextStyleRef.current.set(text, {
                visibility: text.style.visibility || "",
                opacity: text.style.opacity || "",
              });
              hiddenTextRef.current.add(text);
            }
            text.style.visibility = "hidden";
            text.style.opacity = "0";
          });
        } else if (opName === "finishEdit" || opName === "cancelEdit" || opName === "endEdit") {
          hiddenTextRef.current.forEach((text) => {
            const prev = hiddenTextStyleRef.current.get(text);
            if (prev) {
              text.style.visibility = prev.visibility;
              text.style.opacity = prev.opacity;
            } else {
              text.style.visibility = "";
              text.style.opacity = "";
            }
          });
          hiddenTextRef.current.clear();
          hiddenTextStyleRef.current.clear();
        }
      };
      if (mind.bus?.addListener) {
        mind.bus.addListener("operation", onOp);
        cleanupBus = () => {
          try {
            mind.bus.removeListener?.("operation", onOp);
          } catch {}
        };
      }

      // ✅ DOM 변경 감지(접기/펼치기 후 재렌더 대응)
      mo = new MutationObserver(() => applySoon());
      mo.observe(elRef.current, {
        subtree: true,
        childList: true,
        attributes: true,
      });

      // ✅ 초기 뷰 세팅
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (cancelled || myToken !== initTokenRef.current) return;
          if (!elRef.current) return;

          const host = elRef.current;
          const cx = host.clientWidth / 2;
          const cy = host.clientHeight / 2;
          mind.scale(0.3, { x: cx, y: cy });
          mind.move(300, 30, true);

          if (fitOnInit) {
            (mind as any).fit?.();
            mind.toCenter?.();
          }

          // 한번 더 확실히
          applySoon();
          setReady(true);
        });
      });

      if (openMenuOnClick) {
        mind.bus?.addListener?.("operation", (op: any) => {
          if (op?.name !== "selectNode") return;

          const id = op?.data?.id ?? op?.obj?.id;
          if (!id) return;

          const host = elRef.current;
          const nodeEl =
            host?.querySelector<HTMLElement>(`me-tpc[data-nodeid="${id}"]`) ||
            host?.querySelector<HTMLElement>(`[data-nodeid="${id}"]`);

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
    })().catch((e) => {
      console.error("[ME] init failed:", e);
    });

    return () => {
      cancelled = true;
      if (t1) window.clearTimeout(t1);
      if (ro) ro.disconnect();
      if (mo) mo.disconnect();
      if (cleanupBus) cleanupBus();
      try {
        mindRef.current?.destroy?.();
      } catch {}
      mindRef.current = null;
    };
  }, [mounted, effectiveMode, theme, zoomSensitivity, dragButton, fitOnInit, openMenuOnClick]);

  return (
    <div className="relative w-full h-full me-surface">
      {/* ✅ 격자 배경 레이어 */}
      <div className="absolute inset-0" style={gridStyle} aria-hidden="true" />

      {/* ✅ 실제 캔버스 */}
      <div ref={elRef} className="relative w-full h-full" />

      {/* ✅ 스켈레톤 오버레이 */}
      {!ready && (
        <div className="absolute inset-0 overflow-hidden">
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
