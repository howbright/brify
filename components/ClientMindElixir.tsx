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

const ClientMindElixir = forwardRef<ClientMindElixirHandle, ClientMindElixirProps>(
  function ClientMindElixir(
    {
      mode = "auto",
      theme,
      data,
      placeholderData,
      loading = false,
      zoomSensitivity = 0.1,
      dragButton = 0,
      fitOnInit = true,
      openMenuOnClick = true,
    },
    ref
  ) {
  const elRef = useRef<HTMLDivElement>(null);
  const mindRef = useRef<any>(null);
  const currentLevelRef = useRef(0);

  const { resolvedTheme } = useTheme();

  const [mounted, setMounted] = useState(false);
  const [ready, setReady] = useState(false);

  const initTokenRef = useRef(0);

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

  const initialData = useMemo(() => {
    return data ?? placeholderData ?? sampled;
  }, [data, placeholderData]);

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

    (async () => {
      const mod = await import("mind-elixir");
      const MindElixir = mod.default;

      if (cancelled || myToken !== initTokenRef.current) return;
      if (!elRef.current) return;

      const resolvedThemeObj =
        theme ??
        profileTheme ??
        (effectiveMode === "dark" ? MindElixir.DARK_THEME : MindElixir.THEME);

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
        theme: resolvedThemeObj,
      });

      mind.init(initialData);
      mindRef.current = mind;

      const initialNode = normalizeMindData(initialData)?.node;
      if (initialNode) {
        currentLevelRef.current = getMaxExpandedDepth(initialNode);
      }

      // ✅ 초기 뷰 세팅
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (cancelled || myToken !== initTokenRef.current) return;
          if (!elRef.current) return;

          if (fitOnInit) {
            mind.scaleFit?.();
            mind.toCenter?.();
          }
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
      try {
        mindRef.current?.destroy?.();
      } catch {}
      mindRef.current = null;
    };
  }, [
    mounted,
    effectiveMode,
    theme,
    profileTheme,
    zoomSensitivity,
    dragButton,
    fitOnInit,
    openMenuOnClick,
    initialData,
  ]);

  return (
    <div className="relative w-full h-full">
      <div ref={elRef} className="relative w-full h-full" />

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
