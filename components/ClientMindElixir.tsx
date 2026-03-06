"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTheme } from "next-themes";
import { sampled } from "@/app/lib/g6/sampleData";
import {
  DEFAULT_THEME_NAME,
  MIND_THEME_BY_NAME,
} from "@/components/maps/themes";
import { useMindThemePreference } from "@/components/maps/MindThemePreferenceProvider";

type ClientMindElixirProps = {
  mode?: "light" | "dark" | "auto";
  theme?: any;
  data?: any;
  placeholderData?: any;
  loading?: boolean;
  editMode?: "view" | "edit";
  onChange?: (op: any) => void;
  onViewModeEditAttempt?: () => void;

  zoomSensitivity?: number; // scaleSensitivity
  dragButton?: 0 | 2; // mouseSelectionButton
  fitOnInit?: boolean;
  openMenuOnClick?: boolean;
};

export type ClientMindElixirHandle = {
  expandAll: () => void;
  collapseAll: () => void;
  expandOneLevel: () => void;
  collapseOneLevel: () => void;
  expandToLevel: (level: number) => void;
  collapseToLevel: (level: number) => void;
  setPanMode: (enabled: boolean) => void;
  setEditMode: (enabled: boolean) => void;
  getSnapshot: () => any | null;
};

type AnyNode = {
  id: string;
  topic: string;
  root?: boolean;
  branchColor?: string;
  children?: AnyNode[];
  expanded?: boolean;
};

function normalizeMindData(raw: any): { data: any; node: AnyNode } | null {
  if (!raw) return null;
  if (raw?.nodeData) return { data: raw, node: raw.nodeData as AnyNode };
  return { data: { nodeData: raw }, node: raw as AnyNode };
}

function cloneMindData<T>(data: T): T {
  try {
    if (typeof structuredClone === "function") return structuredClone(data);
  } catch {}
  try {
    return JSON.parse(JSON.stringify(data)) as T;
  } catch {
    return data;
  }
}

function getMaxDepth(node: AnyNode, depth = 0): number {
  if (!node.children || node.children.length === 0) return depth;
  let max = depth;
  for (const child of node.children) {
    max = Math.max(max, getMaxDepth(child, depth + 1));
  }
  return max;
}

function getMaxExpandedDepth(node: AnyNode, depth = 0): number {
  const isExpanded = node.expanded !== false;
  if (!isExpanded || !node.children || node.children.length === 0) return depth;
  let max = depth;
  for (const child of node.children) {
    max = Math.max(max, getMaxExpandedDepth(child, depth + 1));
  }
  return max;
}

function setAllExpanded(node: AnyNode, expanded: boolean) {
  node.expanded = expanded;
  node.children?.forEach((child) => setAllExpanded(child, expanded));
}

function setExpandedToLevel(node: AnyNode, level: number, depth = 0) {
  node.expanded = depth < level;
  node.children?.forEach((child) => setExpandedToLevel(child, level, depth + 1));
}

function clearAutoBranchColors(node: AnyNode, palette: string[] | null) {
  if (!palette || palette.length === 0) return;
  if (node.branchColor && palette.includes(node.branchColor)) {
    delete node.branchColor;
  }
  node.children?.forEach((child) => clearAutoBranchColors(child, palette));
}

function centerMap(mind: any) {
  if (!mind) return;
  requestAnimationFrame(() => {
    if (typeof mind.toCenter === "function") {
      mind.toCenter();
      return;
    }
    if (typeof mind.scaleFit === "function") {
      mind.scaleFit();
    }
  });
}

function parseScale(transform: string | null) {
  if (!transform) return null;
  const m = transform.match(/scale\(([^)]+)\)/);
  if (!m) return null;
  const v = Number(m[1]);
  return Number.isFinite(v) ? v : null;
}

const PAN_MODE_CLASS = "me-pan-mode";
const VIEW_MODE_CLASS = "me-view-mode";
const BLOCKED_OPS = [
  "addChild",
  "insertParent",
  "insertSibling",
  "removeNodes",
  "moveUpNode",
  "moveDownNode",
  "createSummary",
  "createArrow",
  "editSummary",
  "editArrowLabel",
  "beginEdit",
  "moveNodeBefore",
  "moveNodeAfter",
  "moveNodeIn",
];

const ClientMindElixir = forwardRef<ClientMindElixirHandle, ClientMindElixirProps>(
  function ClientMindElixir(
    {
      mode = "auto",
      theme,
      data,
      placeholderData,
      loading = false,
      editMode = "edit",
      onChange,
      onViewModeEditAttempt,
      zoomSensitivity = 0.1,
      dragButton = 0,
      fitOnInit = true,
      openMenuOnClick = true,
    },
    ref
  ) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const elRef = useRef<HTMLDivElement>(null);
  const mindRef = useRef<any>(null);
  const currentLevelRef = useRef(0);

  const { resolvedTheme } = useTheme();

  const [mounted, setMounted] = useState(false);
  const [ready, setReady] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedRect, setSelectedRect] = useState<DOMRect | null>(null);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const selectedNodeIdRef = useRef<string | null>(null);
  const selectedNodeElRef = useRef<HTMLElement | null>(null);
  const handleFocusClick = () => {
    const mind = mindRef.current;
    const nodeId = selectedNodeIdRef.current;
    if (!mind || !nodeId) return;
    let el = selectedNodeElRef.current;
    if (!el) {
      try {
        el =
          mind.findEle?.(nodeId) ||
          elRef.current?.querySelector<HTMLElement>(
            `me-tpc[data-nodeid="${nodeId}"]`
          ) ||
          elRef.current?.querySelector<HTMLElement>(
            `[data-nodeid="${nodeId}"]`
          ) ||
          null;
      } catch {
        el = null;
      }
    }
    if (!el) return;
    if (mind.isFocusMode) {
      mind.cancelFocus?.();
      setIsFocusMode(false);
      return;
    }
    mind.focusNode?.(el);
    setIsFocusMode(true);
  };
  const handleExitFocus = () => {
    const mind = mindRef.current;
    if (!mind) return;
    mind.cancelFocus?.();
    setIsFocusMode(false);
  };

  const initTokenRef = useRef(0);
  const defaultThemeRef = useRef<{ light: any; dark: any } | null>(null);
  const onChangeRef = useRef<typeof onChange | null>(null);

  useEffect(() => {
    onChangeRef.current = onChange ?? null;
  }, [onChange]);

  useEffect(() => {
    selectedNodeIdRef.current = selectedNodeId;
  }, [selectedNodeId]);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const host = elRef.current;
    if (!wrapper || !host) return;

    const handleDblClick = (e: MouseEvent) => {
      if (editMode !== "view") return;
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const isNode =
        target.closest?.("me-tpc") || target.closest?.("[data-nodeid]");
      if (!isNode) return;
      onViewModeEditAttempt?.();
    };

    host.addEventListener("dblclick", handleDblClick);
    return () => {
      host.removeEventListener("dblclick", handleDblClick);
    };
  }, [editMode, onViewModeEditAttempt]);

  const updateSelectedRect = (nodeId: string | null) => {
    const wrapper = wrapperRef.current;
    const host = elRef.current;
    if (!wrapper || !host || !nodeId) {
      setSelectedRect(null);
      return;
    }
    const nodeEl =
      host.querySelector<HTMLElement>(`me-tpc[data-nodeid="${nodeId}"]`) ||
      host.querySelector<HTMLElement>(`[data-nodeid="${nodeId}"]`);
    if (!nodeEl) {
      setSelectedRect(null);
      selectedNodeElRef.current = null;
      return;
    }
    const rect = nodeEl.getBoundingClientRect();
    const hostRect = wrapper.getBoundingClientRect();
    const relativeRect = new DOMRect(
      rect.left - hostRect.left,
      rect.top - hostRect.top,
      rect.width,
      rect.height
    );
    setSelectedRect(relativeRect);
    selectedNodeElRef.current = nodeEl;
  };

  useEffect(() => {
    const host = elRef.current;
    if (!host) return;

    const handleClick = (e: MouseEvent) => {
      const el = e.target as HTMLElement | null;
      if (!el) return;
      const nodeEl =
        el.closest?.("me-tpc[data-nodeid]") ??
        el.closest?.("me-tpc") ??
        el.closest?.("[data-nodeid]");
      if (!nodeEl || !(nodeEl instanceof HTMLElement)) {
        setSelectedNodeId(null);
        setSelectedRect(null);
        selectedNodeElRef.current = null;
        return;
      }
      const nodeId = nodeEl.getAttribute("data-nodeid");
      if (!nodeId) return;
      setSelectedNodeId(nodeId);
      selectedNodeElRef.current = nodeEl;
      requestAnimationFrame(() => updateSelectedRect(nodeId));
    };

    host.addEventListener("click", handleClick);
    return () => {
      host.removeEventListener("click", handleClick);
    };
  }, []);
  const lastTransformRef = useRef<string | null>(null);
  const lastScaleRef = useRef<number | null>(null);

  useEffect(() => setMounted(true), []);

  const { profileThemeName } = useMindThemePreference();

  const effectiveMode = useMemo<"light" | "dark">(() => {
    if (mode === "light" || mode === "dark") return mode;
    if (!mounted) return "light";
    return resolvedTheme === "dark" ? "dark" : "light";
  }, [mode, resolvedTheme, mounted]);

  const profileTheme = useMemo(() => {
    if (!profileThemeName) return null;
    if (profileThemeName === DEFAULT_THEME_NAME) return null;
    return MIND_THEME_BY_NAME[profileThemeName] ?? null;
  }, [profileThemeName]);

  const resolveThemeObj = useMemo(() => {
    return (
      defaults: { light: any; dark: any } | null,
      modeValue: "light" | "dark"
    ) => {
      const fallback = defaults?.[modeValue];
      if (theme === null) return fallback;
      return theme ?? profileTheme ?? fallback;
    };
  }, [theme, profileTheme]);

  const initialData = useMemo(() => {
    return data ?? placeholderData ?? sampled;
  }, [data, placeholderData]);

  function applyEditMode(mind: any, enabled: boolean) {
    if (!mind) return;

    if (!mind.__originalBefore) {
      mind.__originalBefore = { ...(mind.before ?? {}) };
    }

    const original = mind.__originalBefore as Record<string, any>;
    const nextBefore: Record<string, any> = { ...original };

    BLOCKED_OPS.forEach((op) => {
      nextBefore[op] = async (...args: any[]) => {
        if (!enabled) return false;
        const fn = original[op];
        if (typeof fn === "function") {
          return await fn.apply(mind, args);
        }
        return true;
      };
    });

    mind.before = nextBefore;

    if (elRef.current) {
      elRef.current.classList.toggle(VIEW_MODE_CLASS, !enabled);
    }
  }

  useImperativeHandle(
    ref,
    () => ({
      expandAll: () => {
        const mind = mindRef.current;
        if (!mind) return;
        const raw = mind.getData?.() ?? mind.getAllData?.();
        const normalized = normalizeMindData(raw);
        if (!normalized) return;
        const next = cloneMindData(normalized.data);
        const nextNode = normalizeMindData(next)?.node;
        if (!nextNode) return;
        setAllExpanded(nextNode, true);
        mind.refresh?.(next);
        currentLevelRef.current = getMaxDepth(nextNode);
        centerMap(mind);
      },
      collapseAll: () => {
        const mind = mindRef.current;
        if (!mind) return;
        const raw = mind.getData?.() ?? mind.getAllData?.();
        const normalized = normalizeMindData(raw);
        if (!normalized) return;
        const next = cloneMindData(normalized.data);
        const nextNode = normalizeMindData(next)?.node;
        if (!nextNode) return;
        // 루트 + 1단계 자식까지 보이도록
        setExpandedToLevel(nextNode, 1);
        mind.refresh?.(next);
        currentLevelRef.current = 1;
        centerMap(mind);
      },
      expandOneLevel: () => {
        const mind = mindRef.current;
        if (!mind) return;
        const raw = mind.getData?.() ?? mind.getAllData?.();
        const normalized = normalizeMindData(raw);
        if (!normalized) return;
        const next = cloneMindData(normalized.data);
        const nextNode = normalizeMindData(next)?.node;
        if (!nextNode) return;
        const maxDepth = getMaxDepth(nextNode);
        const current =
          currentLevelRef.current ?? getMaxExpandedDepth(nextNode);
        const target = Math.min(maxDepth, current + 1);
        setExpandedToLevel(nextNode, target);
        mind.refresh?.(next);
        currentLevelRef.current = target;
        centerMap(mind);
      },
      collapseOneLevel: () => {
        const mind = mindRef.current;
        if (!mind) return;
        const raw = mind.getData?.() ?? mind.getAllData?.();
        const normalized = normalizeMindData(raw);
        if (!normalized) return;
        const next = cloneMindData(normalized.data);
        const nextNode = normalizeMindData(next)?.node;
        if (!nextNode) return;
        const current =
          currentLevelRef.current ?? getMaxExpandedDepth(nextNode);
        const target = Math.max(1, current - 1);
        setExpandedToLevel(nextNode, target);
        mind.refresh?.(next);
        currentLevelRef.current = target;
        centerMap(mind);
      },
      expandToLevel: (level: number) => {
        const mind = mindRef.current;
        if (!mind) return;
        const raw = mind.getData?.() ?? mind.getAllData?.();
        const normalized = normalizeMindData(raw);
        if (!normalized) return;
        const next = cloneMindData(normalized.data);
        const nextNode = normalizeMindData(next)?.node;
        if (!nextNode) return;
        const target = Math.max(0, level);
        setExpandedToLevel(nextNode, target);
        mind.refresh?.(next);
        currentLevelRef.current = target;
      },
      collapseToLevel: (level: number) => {
        const mind = mindRef.current;
        if (!mind) return;
        const raw = mind.getData?.() ?? mind.getAllData?.();
        const normalized = normalizeMindData(raw);
        if (!normalized) return;
        const next = cloneMindData(normalized.data);
        const nextNode = normalizeMindData(next)?.node;
        if (!nextNode) return;
        const target = Math.max(0, level);
        setExpandedToLevel(nextNode, target);
        mind.refresh?.(next);
        currentLevelRef.current = target;
      },
      setPanMode: (enabled: boolean) => {
        const mind = mindRef.current;
        if (!mind) return;
        mind.mouseSelectionButton = enabled ? 2 : 0;
        if (enabled) {
          mind.selection?.cancel?.();
          mind.selection?.disable?.();
        } else {
          mind.selection?.enable?.();
        }

        if (elRef.current) {
          elRef.current.classList.toggle(PAN_MODE_CLASS, enabled);
        }
      },
      setEditMode: (enabled: boolean) => {
        const mind = mindRef.current;
        applyEditMode(mind, enabled);
      },
      getSnapshot: () => {
        const mind = mindRef.current;
        if (!mind) return null;
        return mind.getData?.() ?? mind.getAllData?.() ?? null;
      },
    }),
    []
  );


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

    let syncSelectedRect: (() => void) | null = null;
    let handleResize: (() => void) | null = null;

    (async () => {
      const mod = await import("mind-elixir");
      const MindElixir = mod.default;

      if (cancelled || myToken !== initTokenRef.current) return;
      if (!elRef.current) return;

      defaultThemeRef.current = {
        light: MindElixir.THEME,
        dark: MindElixir.DARK_THEME,
      };

      const resolvedThemeObj = resolveThemeObj(
        defaultThemeRef.current,
        effectiveMode
      );

      const handleWheel = (event: WheelEvent) => {
        const mind = mindRef.current;
        if (!mind) return;

        event.stopPropagation();
        event.preventDefault();

        if (event.ctrlKey || event.metaKey) {
          const intensity = Math.min(
            0.03,
            Math.max(0.001, zoomSensitivity * 0.02)
          );
          const zoomFactor = Math.exp(-event.deltaY * intensity);
          const nextScale = mind.scaleVal * zoomFactor;
          const clamped = Math.min(
            mind.scaleMax ?? 1.4,
            Math.max(mind.scaleMin ?? 0.2, nextScale)
          );
          if (clamped !== mind.scaleVal) {
            mind.scale(clamped, { x: event.clientX, y: event.clientY });
          }
          return;
        }

        if (event.shiftKey) {
          mind.move(-event.deltaY, 0);
        } else {
          mind.move(-event.deltaX, -event.deltaY);
        }
      };

      const mind = new MindElixir({
        el: elRef.current,
        direction: MindElixir.RIGHT,
        toolBar: true,
        keypress: true,
        draggable: true,
        editable: true,
        locale: "ko",
        scaleSensitivity: zoomSensitivity,
        mouseSelectionButton: dragButton,
        handleWheel,
        theme: resolvedThemeObj,
      });

      mind.init(initialData);
      mindRef.current = mind;
      applyEditMode(mind, editMode === "edit");

      // Keep focus UI in sync even when focus is triggered from context menu
      if (!mind.__originalFocusNode) {
        mind.__originalFocusNode = mind.focusNode?.bind(mind);
      }
      if (!mind.__originalCancelFocus) {
        mind.__originalCancelFocus = mind.cancelFocus?.bind(mind);
      }
      if (typeof mind.__originalFocusNode === "function") {
        mind.focusNode = (el: HTMLElement) => {
          const result = mind.__originalFocusNode(el);
          setIsFocusMode(true);
          return result;
        };
      }
      if (typeof mind.__originalCancelFocus === "function") {
        mind.cancelFocus = () => {
          const result = mind.__originalCancelFocus();
          setIsFocusMode(false);
          return result;
        };
      }

      // Hook undo/redo to trigger autosave listeners
      if (typeof mind.undo === "function") {
        const originalUndo = mind.undo.bind(mind);
        mind.undo = () => {
          originalUndo();
          onChangeRef.current?.({ name: "undo" });
        };
      }
      if (typeof mind.redo === "function") {
        const originalRedo = mind.redo.bind(mind);
        mind.redo = () => {
          originalRedo();
          onChangeRef.current?.({ name: "redo" });
        };
      }

      const initialNode = normalizeMindData(initialData)?.node;
      if (initialNode) {
        currentLevelRef.current = getMaxExpandedDepth(initialNode);
      }

      mind.bus?.addListener?.("selectNodes", (nodes: any[]) => {
        const last = Array.isArray(nodes) ? nodes[nodes.length - 1] : null;
        const id = last?.id;
        if (!id) return;
        setSelectedNodeId(id);
        try {
          selectedNodeElRef.current =
            mind.findEle?.(id) ||
            elRef.current?.querySelector<HTMLElement>(
              `me-tpc[data-nodeid="${id}"]`
            ) ||
            elRef.current?.querySelector<HTMLElement>(
              `[data-nodeid="${id}"]`
            ) ||
            null;
        } catch {
          selectedNodeElRef.current = null;
        }
        requestAnimationFrame(() => updateSelectedRect(id));
      });

      mind.bus?.addListener?.("unselectNodes", () => {
        setSelectedNodeId(null);
        setSelectedRect(null);
        selectedNodeElRef.current = null;
      });

      syncSelectedRect = () => {
        const id = selectedNodeIdRef.current;
        if (!id) return;
        updateSelectedRect(id);
      };

      mind.bus?.addListener?.("move", syncSelectedRect);
      mind.bus?.addListener?.("scale", syncSelectedRect);
      handleResize = () => syncSelectedRect?.();
      window.addEventListener("resize", handleResize);

      // ✅ 초기 뷰 세팅
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (cancelled || myToken !== initTokenRef.current) return;
          if (!elRef.current) return;

          if (lastTransformRef.current) {
            mind.map.style.transform = lastTransformRef.current;
            if (lastScaleRef.current) {
              mind.scaleVal = lastScaleRef.current;
            } else {
              const parsed = parseScale(lastTransformRef.current);
              if (parsed) mind.scaleVal = parsed;
            }
          } else if (fitOnInit) {
            mind.scaleFit?.();
            mind.toCenter?.();
          }
          setReady(true);
        });
      });

      mind.bus?.addListener?.("operation", (op: any) => {
      if (op?.name === "selectNode") {
        const id = op?.data?.id ?? op?.obj?.id ?? op?.id;
        if (id) {
          setSelectedNodeId(id);
          updateSelectedRect(id);
        }
      }

        if (
          op?.name === "unselectNodes" ||
          op?.name === "clearSelection" ||
          op?.name === "removeNodes"
        ) {
          setSelectedNodeId(null);
          setSelectedRect(null);
        }

        if (op?.name !== "selectNode") {
          onChangeRef.current?.(op);
          return;
        }

        if (!openMenuOnClick) return;

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
    })().catch((e) => {
      console.error("[ME] init failed:", e);
    });

    return () => {
      cancelled = true;
      try {
        const mind = mindRef.current;
        const transform = mind?.map?.style?.transform ?? null;
        lastTransformRef.current = transform || null;
        lastScaleRef.current =
          typeof mind?.scaleVal === "number" ? mind.scaleVal : null;
      } catch {}
      try {
        const mind = mindRef.current;
        if (mind?.bus?.removeListener && syncSelectedRect) {
          mind.bus.removeListener("move", syncSelectedRect);
          mind.bus.removeListener("scale", syncSelectedRect);
        }
      } catch {}
      try {
        if (handleResize) {
          window.removeEventListener("resize", handleResize);
        }
      } catch {}
      try {
        mindRef.current?.destroy?.();
      } catch {}
      mindRef.current = null;
    };
  }, [
    mounted,
    zoomSensitivity,
    dragButton,
    fitOnInit,
    openMenuOnClick,
    initialData,
  ]);

  useEffect(() => {
    const mind = mindRef.current;
    if (!mind) return;
    const defaults = defaultThemeRef.current;
    if (!defaults) return;
    const nextTheme = resolveThemeObj(defaults, effectiveMode);
    if (nextTheme) {
      const prevPalette = Array.isArray(mind.theme?.palette)
        ? mind.theme.palette
        : null;
      const root = mind.nodeData as AnyNode | undefined;
      if (root && prevPalette) {
        clearAutoBranchColors(root, prevPalette);
      }
      mind.changeTheme?.(nextTheme, true);
    }
  }, [effectiveMode, resolveThemeObj]);

  useEffect(() => {
    const mind = mindRef.current;
    if (!mind) return;
    applyEditMode(mind, editMode === "edit");
  }, [editMode]);

  return (
    <div ref={wrapperRef} className="relative w-full h-full">
      <style jsx global>{`
        .${PAN_MODE_CLASS} me-tpc,
        .${PAN_MODE_CLASS} [data-nodeid] {
          pointer-events: none;
        }
        .${VIEW_MODE_CLASS} .context-menu .menu-list #cm-add_child,
        .${VIEW_MODE_CLASS} .context-menu .menu-list #cm-add_parent,
        .${VIEW_MODE_CLASS} .context-menu .menu-list #cm-add_sibling,
        .${VIEW_MODE_CLASS} .context-menu .menu-list #cm-remove_child,
        .${VIEW_MODE_CLASS} .context-menu .menu-list #cm-up,
        .${VIEW_MODE_CLASS} .context-menu .menu-list #cm-down,
        .${VIEW_MODE_CLASS} .context-menu .menu-list #cm-link,
        .${VIEW_MODE_CLASS} .context-menu .menu-list #cm-link-bidirectional,
        .${VIEW_MODE_CLASS} .context-menu .menu-list #cm-summary {
          display: none;
        }
        .${VIEW_MODE_CLASS} .mind-elixir-toolbar {
          display: none;
        }
      `}</style>
      <div ref={elRef} className="relative w-full h-full" />
      {selectedNodeId && selectedRect && (
        <div
          className="absolute z-20"
          data-hover-actions="true"
          onPointerDown={(e) => {
            e.stopPropagation();
          }}
          onPointerUp={(e) => {
            e.stopPropagation();
          }}
          onClick={(e) => {
            e.stopPropagation();
          }}
          style={{
            left: selectedRect.left + selectedRect.width - 8,
            top: selectedRect.top + selectedRect.height + 8,
            transform: "translate(-100%, 0)",
          }}
        >
          <div className="flex items-center gap-1 rounded-full bg-white/90 px-1 py-0.5 shadow-sm ring-1 ring-black/5 dark:bg-[#0b1220]/90 dark:ring-white/10">
            <button
              type="button"
              className="group relative inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/80 text-[10px] text-neutral-700 ring-1 ring-black/10 dark:bg-white/10 dark:text-white/70"
              onClick={(e) => e.stopPropagation()}
              aria-label="노트 추가"
            >
              N
              <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-1 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/80 px-2 py-0.5 text-[10px] text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                노트 추가
              </span>
            </button>
            <button
              type="button"
              className="group relative inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/80 text-[10px] text-neutral-700 ring-1 ring-black/10 dark:bg-white/10 dark:text-white/70"
              onClick={(e) => e.stopPropagation()}
              aria-label="하이라이트"
            >
              H
              <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-1 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/80 px-2 py-0.5 text-[10px] text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                하이라이트
              </span>
            </button>
            <button
              type="button"
              className="group relative inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/80 text-[10px] text-neutral-700 ring-1 ring-black/10 dark:bg-white/10 dark:text-white/70"
              onClick={(e) => {
                e.stopPropagation();
                handleFocusClick();
              }}
              aria-label="포커스 모드"
            >
              F
              <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-1 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/80 px-2 py-0.5 text-[10px] text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                포커스 모드
              </span>
            </button>
          </div>
        </div>
      )}

      {isFocusMode && (
        <div className="pointer-events-auto absolute right-4 top-16 z-30">
          <div className="flex items-center gap-2 rounded-full bg-black/70 px-3 py-1.5 text-[11px] text-white shadow-sm">
            <span className="font-medium">Focus Mode</span>
            <button
              type="button"
              className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] text-white hover:bg-white/25"
              onClick={handleExitFocus}
            >
              Exit
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div className="pointer-events-none absolute left-4 top-4 z-10">
          <span className="rounded-full bg-white/85 px-2.5 py-1 text-[11px] text-neutral-600 shadow-sm dark:bg-[#0b1220]/80 dark:text-white/70">
            구조맵 불러오는 중…
          </span>
        </div>
      )}

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
});

export default ClientMindElixir;
