"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { useLocale } from "next-intl";
import { sampled } from "@/app/lib/mind-elixir/sampleData";
import {
  DEFAULT_THEME_NAME,
  MIND_THEME_BY_NAME,
} from "@/components/maps/themes";
import ClientMindElixirOverlay from "@/components/ClientMindElixirOverlay";
import { useMindThemePreference } from "@/components/maps/MindThemePreferenceProvider";
import { useMindElixirFocusSearch } from "@/components/useMindElixirFocusSearch";
import { useMindElixirMiniMap } from "@/components/useMindElixirMiniMap";
import { useMindElixirNodeActions } from "@/components/useMindElixirNodeActions";
import { useMindElixirNotes } from "@/components/useMindElixirNotes";
import { useMindElixirResponsiveState } from "@/components/useMindElixirResponsiveState";

type ClientMindElixirProps = {
  mode?: "light" | "dark" | "auto";
  theme?: any;
  data?: any;
  placeholderData?: any;
  allowSampled?: boolean;
  loading?: boolean;
  editMode?: "view" | "edit";
  onChange?: (op: any) => void;
  onViewModeEditAttempt?: () => void;

  zoomSensitivity?: number; // scaleSensitivity
  dragButton?: 0 | 2; // mouseSelectionButton
  fitOnInit?: boolean;
  preserveViewState?: boolean;
  openMenuOnClick?: boolean;
  disableDirectContextMenu?: boolean;
  showSelectionContextMenuButton?: boolean;
  showMiniMap?: boolean;
  showTimestamps?: boolean;
  showToolbar?: boolean;
  focusInsetLeft?: number;
  panMode?: boolean;
  panModeButton?: 0 | 2;
  preferPanModeOnTouch?: boolean;
  showMobileEditControls?: boolean;
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
  setLayout: (mode: "left" | "right" | "side") => void;
  getSnapshot: () => any | null;
  exportPng: () => Promise<Blob | null>;
  centerMap: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  findNodesByQuery: (
    query: string,
    options?: { includeNotes?: boolean }
  ) => Array<{ id: string; text: string }>;
  setSearchHighlights: (ids: string[], query?: string) => void;
  setSearchActive: (id?: string | null) => void;
  clearSearchHighlights: () => void;
  focusNodeById: (id: string) => void;
};

type AnyNode = {
  id: string;
  topic: string;
  ts?: unknown;
  root?: boolean;
  parent?: { id?: string } | null;
  branchColor?: string;
  highlight?: { variant?: string } | null;
  note?: string | null;
  children?: AnyNode[];
  expanded?: boolean;
};

type PatchedMindInstance = {
  refresh?: (data?: any) => any;
  focusNode?: (...args: any[]) => any;
  cancelFocus?: () => any;
  __originalRefresh?: ((data?: any) => any) | undefined;
  __originalFocusNode?: ((...args: any[]) => any) | undefined;
  __originalCancelFocus?: (() => any) | undefined;
  [key: string]: any;
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

function isNodeLike(node: AnyNode | null | undefined): node is AnyNode {
  return Boolean(node && typeof node === "object");
}

function getMaxDepth(node: AnyNode | null | undefined, depth = 0): number {
  if (!isNodeLike(node)) return depth;
  if (!node.children || node.children.length === 0) return depth;
  let max = depth;
  for (const child of node.children) {
    if (!isNodeLike(child)) continue;
    max = Math.max(max, getMaxDepth(child, depth + 1));
  }
  return max;
}

function getMaxExpandedDepth(
  node: AnyNode | null | undefined,
  depth = 0
): number {
  if (!isNodeLike(node)) return depth;
  const isExpanded = node.expanded !== false;
  if (!isExpanded || !node.children || node.children.length === 0) return depth;
  let max = depth;
  for (const child of node.children) {
    if (!isNodeLike(child)) continue;
    max = Math.max(max, getMaxExpandedDepth(child, depth + 1));
  }
  return max;
}

function setAllExpanded(
  node: AnyNode | null | undefined,
  expanded: boolean
) {
  if (!isNodeLike(node)) return;
  node.expanded = expanded;
  node.children?.forEach((child) => setAllExpanded(child, expanded));
}

function setExpandedToLevel(
  node: AnyNode | null | undefined,
  level: number,
  depth = 0
) {
  if (!isNodeLike(node)) return;
  node.expanded = depth < level;
  node.children?.forEach((child) => setExpandedToLevel(child, level, depth + 1));
}

function clearAutoBranchColors(
  node: AnyNode | null | undefined,
  palette: string[] | null
) {
  if (!isNodeLike(node) || !palette || palette.length === 0) return;
  if (node.branchColor && palette.includes(node.branchColor)) {
    delete node.branchColor;
  }
  node.children?.forEach((child) => clearAutoBranchColors(child, palette));
}

function normalizeNodeId(id: string) {
  return id.startsWith("me") ? id.slice(2) : id;
}

function nodeIdVariants(id: string) {
  return id.startsWith("me") ? [id, id.slice(2)] : [id, `me${id}`];
}

function escapeAttr(value: string) {
  if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
    return CSS.escape(value);
  }
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function collectMatches(
  node: AnyNode | null | undefined,
  query: string,
  includeNotes: boolean,
  out: Array<{ id: string; text: string }>
) {
  if (!isNodeLike(node)) return;
  const topic = node.topic ?? "";
  const note = includeNotes ? node.note ?? "" : "";
  const hay = `${topic}\n${note}`.toLowerCase();
  if (hay.includes(query)) {
    out.push({ id: node.id, text: topic });
  }
  node.children?.forEach((child) =>
    collectMatches(child, query, includeNotes, out)
  );
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function nodeToMarkdown(
  node: AnyNode,
  depth = 0,
  onlyExpanded = false
): string {
  const lines: string[] = [];
  const indent = "  ".repeat(depth);
  const topic = (node.topic ?? "").trim();
  lines.push(`${indent}- ${topic}`);

  const note = typeof node.note === "string" ? node.note.trim() : "";
  if (note) {
    for (const line of note.split(/\r?\n/)) {
      lines.push(`${indent}  > ${line}`);
    }
  }

  if (Array.isArray(node.children) && (!onlyExpanded || node.expanded !== false)) {
    for (const child of node.children) {
      lines.push(nodeToMarkdown(child, depth + 1, onlyExpanded));
    }
  }

  return lines.join("\n");
}

async function copyToClipboard(text: string) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fallback below
  }
  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "true");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    textarea.style.top = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
    return true;
  } catch {
    return false;
  }
}

const NOTE_BADGE_SVG =
  '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M6 2h9l5 5v15a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm8 1.5V8h4.5L14 3.5zM7 12h10v1.5H7V12zm0 4h10v1.5H7V16zm0-8h6v1.5H7V8z"/></svg>';

function findNodePathByRef(
  node: AnyNode | null | undefined,
  target: AnyNode,
  path: number[] = []
): number[] | null {
  if (!isNodeLike(node)) return null;
  if (node === target) return path;
  if (!node.children || node.children.length === 0) return null;
  for (let index = 0; index < node.children.length; index += 1) {
    const found = findNodePathByRef(node.children[index], target, [...path, index]);
    if (found) return found;
  }
  return null;
}

function getNodeByPath(
  node: AnyNode | null | undefined,
  path: number[]
): AnyNode | null {
  if (!isNodeLike(node)) return null;
  let current: AnyNode | null = node;
  for (const index of path) {
    if (!current?.children || !isNodeLike(current.children[index])) return null;
    current = current.children[index];
  }
  return current;
}

function findNodeByIdExact(node: AnyNode, id: string): AnyNode | null {
  if (!isNodeLike(node)) return null;
  if (node.id === id) return node;
  if (!node.children) return null;
  for (const child of node.children) {
    const found = findNodeByIdExact(child, id);
    if (found) return found;
  }
  return null;
}

function findNodeById(node: AnyNode, id: string): AnyNode | null {
  const exact = findNodeByIdExact(node, id);
  if (exact) return exact;

  const variants = nodeIdVariants(id);
  for (const candidate of variants) {
    if (candidate === id) continue;
    const fallback = findNodeByIdExact(node, candidate);
    if (fallback) return fallback;
  }

  return null;
}

function expandPathToIdExact(
  node: AnyNode | null | undefined,
  targetId: string
): boolean {
  if (!isNodeLike(node)) return false;
  if (node.id === targetId) {
    node.expanded = true;
    return true;
  }
  if (!node.children || node.children.length === 0) return false;
  let found = false;
  for (const child of node.children) {
    if (expandPathToIdExact(child, targetId)) {
      found = true;
    }
  }
  if (found) {
    node.expanded = true;
  }
  return found;
}

function expandPathToId(
  node: AnyNode | null | undefined,
  targetId: string
): boolean {
  const exact = expandPathToIdExact(node, targetId);
  if (exact) return true;

  for (const candidate of nodeIdVariants(targetId)) {
    if (candidate === targetId) continue;
    const fallback = expandPathToIdExact(node, candidate);
    if (fallback) return true;
  }

  return false;
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
const DARK_CANVAS_CLASS = "me-dark-canvas";
const DEFAULT_DARK_CANVAS_CLASS = "me-default-dark-canvas";
const VIEW_MODE_CLASS = "me-view-mode";
const MANUAL_SELECTION_PRIORITY_MS = 1200;
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
      allowSampled = true,
      loading = false,
      editMode = "edit",
      onChange,
      onViewModeEditAttempt,
      zoomSensitivity = 0.1,
      dragButton = 0,
      fitOnInit = true,
      preserveViewState = true,
      openMenuOnClick = true,
      disableDirectContextMenu = false,
      showSelectionContextMenuButton = false,
      showMiniMap = true,
      showTimestamps = true,
      showToolbar = false,
      focusInsetLeft = 0,
      panMode,
      panModeButton = 2,
      showMobileEditControls = true,
    },
    ref
  ) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const elRef = useRef<HTMLDivElement>(null);
  const mindRef = useRef<any>(null);
  const focusInsetLeftRef = useRef(0);
  const showTimestampsRef = useRef(showTimestamps);
  const currentLevelRef = useRef(0);
  const latestMindDataRef = useRef<any>(null);

  const { resolvedTheme } = useTheme();
  const locale = useLocale();
  const miniMapLabel = locale === "ko" ? "미니맵" : "Mini map";
  const miniMapCenterLabel = locale === "ko" ? "중심으로 이동" : "Center";
  const miniMapZoomInLabel = locale === "ko" ? "줌인" : "Zoom in";
  const miniMapZoomOutLabel = locale === "ko" ? "줌아웃" : "Zoom out";
  const miniMapCollapseLevelLabel =
    locale === "ko" ? "한단계 접기" : "Collapse one level";
  const miniMapExpandLevelLabel =
    locale === "ko" ? "한단계 펴기" : "Expand one level";
  const mobileEditMenuTitle = locale === "ko" ? "노드 편집" : "Edit node";
  const moreActionsLabel = locale === "ko" ? "더보기" : "More";
  const annotationAddLabel = locale === "ko" ? "주석 추가" : "Add annotation";
  const highlightLabel = locale === "ko" ? "하이라이트" : "Highlight";
  const focusModeLabel = locale === "ko" ? "포커스 모드" : "Focus Mode";
  const focusModeExitLabel = locale === "ko" ? "나가기" : "Exit";
  const annotationDialogTitle = locale === "ko" ? "주석" : "Annotation";
  const annotationPlaceholder =
    locale === "ko" ? "주석을 입력하세요" : "Write an annotation";
  const annotationDeleteLabel =
    locale === "ko" ? "주석 삭제" : "Delete annotation";
  const cancelLabel = locale === "ko" ? "취소" : "Cancel";
  const saveLabel = locale === "ko" ? "저장" : "Save";
  const {
    mounted,
    isTouchDevice,
    effectiveMode,
    effectivePanMode,
    showMobileControls,
    mobileEditLabels,
  } = useMindElixirResponsiveState({
    mode,
    resolvedTheme,
    locale,
    editMode,
    panMode,
    showMobileEditControls,
  });

  useEffect(() => {
    focusInsetLeftRef.current = focusInsetLeft;
  }, [focusInsetLeft]);

  useEffect(() => {
    showTimestampsRef.current = showTimestamps;
    const host = elRef.current;
    if (!host) return;
    host.dispatchEvent(new Event("mind-elixir-refresh-decorations"));
  }, [showTimestamps]);

  const [ready, setReady] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedRect, setSelectedRect] = useState<DOMRect | null>(null);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [selectedNoteText, setSelectedNoteText] = useState<string | null>(null);
  const [mobileActionNodeId, setMobileActionNodeId] = useState<string | null>(null);
  const selectedNodeIdRef = useRef<string | null>(null);
  const selectedNodeElRef = useRef<HTMLElement | null>(null);
  const lastClickedNodeRef = useRef<{ id: string | null; at: number }>({
    id: null,
    at: 0,
  });
  const pendingDeselectTimerRef = useRef<number | null>(null);
  const longPressTimerRef = useRef<number | null>(null);
  const longPressTriggeredRef = useRef(false);
  const touchDragMovedAtRef = useRef(0);
  const activeTouchPointsRef = useRef<Map<number, { x: number; y: number }>>(
    new Map()
  );
  const pinchRef = useRef<{
    active: boolean;
    startDistance: number;
    startScale: number;
  }>({ active: false, startDistance: 0, startScale: 1 });
  const touchPanRef = useRef<{
    active: boolean;
    pointerId: number | null;
    x: number;
    y: number;
    moved: boolean;
  }>({ active: false, pointerId: null, x: 0, y: 0, moved: false });
  const longPressTargetRef = useRef<{
    nodeId: string | null;
    startX: number;
    startY: number;
    el: HTMLElement | null;
  }>({ nodeId: null, startX: 0, startY: 0, el: null });
  const highlightVariant = "gold";
  const hoverActionWrapClass = isTouchDevice
    ? "flex items-center gap-1.5 rounded-full bg-white/94 px-1.5 py-1 shadow-md ring-1 ring-black/5 dark:bg-[#0b1220]/94 dark:ring-white/10"
    : "flex items-center gap-1 rounded-full bg-white/90 px-1 py-0.5 shadow-sm ring-1 ring-black/5 dark:bg-[#0b1220]/90 dark:ring-white/10";
  const hoverActionButtonClass = isTouchDevice
    ? "group relative inline-flex h-8 w-8 items-center justify-center rounded-full text-[11px] shadow-sm"
    : "group relative inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] shadow-sm";
  const hoverActionIconClass = isTouchDevice ? "h-4 w-4" : "h-3 w-3";
  const isDecoratingRef = useRef(false);
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
    setSelectedNodeId(null);
    setSelectedRect(null);
    setSelectedNoteText(null);
    selectedNodeElRef.current = null;
    setIsFocusMode(true);
  };
  const syncLatestMindDataFromMind = () => {
    const mind = mindRef.current;
    if (!mind) return null;
    const raw = mind.getData?.() ?? mind.getAllData?.() ?? null;
    const normalized = normalizeMindData(raw);
    if (!normalized) return null;
    latestMindDataRef.current = cloneMindData(normalized.data);
    return normalizeMindData(latestMindDataRef.current);
  };

  const initTokenRef = useRef(0);
  const defaultThemeRef = useRef<{ light: any; dark: any } | null>(null);
  const onChangeRef = useRef<typeof onChange | null>(null);
  const { miniMapRef, scheduleMiniMapDraw } = useMindElixirMiniMap({
    elRef,
    mindRef,
    effectiveMode,
  });

  useEffect(() => {
    onChangeRef.current = onChange ?? null;
  }, [onChange]);

  useEffect(() => {
    return () => {
      if (pendingDeselectTimerRef.current) {
        window.clearTimeout(pendingDeselectTimerRef.current);
        pendingDeselectTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const host = elRef.current;
    if (!wrapper || !host) return;

    const handleDblClick = (e: MouseEvent) => {
      if (pendingDeselectTimerRef.current) {
        window.clearTimeout(pendingDeselectTimerRef.current);
        pendingDeselectTimerRef.current = null;
      }
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

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const host = elRef.current;
    if (!wrapper || !host) return;

    const preventBrowserSwipeNavigation = (event: WheelEvent) => {
      if (!event.isTrusted) return;
      if (!host.contains(event.target as Node | null)) return;
      event.preventDefault();
    };

    wrapper.addEventListener("wheel", preventBrowserSwipeNavigation, {
      passive: false,
      capture: true,
    });

    return () => {
      wrapper.removeEventListener("wheel", preventBrowserSwipeNavigation, true);
    };
  }, []);


  const clearLongPressState = () => {
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    longPressTargetRef.current = {
      nodeId: null,
      startX: 0,
      startY: 0,
      el: null,
    };
  };

  useEffect(() => {
    const host = elRef.current;
    if (!host) return;
    if (!isTouchDevice) return;

    const getPinchDistance = () => {
      const points = Array.from(activeTouchPointsRef.current.values());
      if (points.length < 2) return null;
      const [a, b] = points;
      return Math.hypot(b.x - a.x, b.y - a.y);
    };

    const getPinchCenter = () => {
      const points = Array.from(activeTouchPointsRef.current.values());
      if (points.length < 2) return null;
      const [a, b] = points;
      return {
        x: (a.x + b.x) / 2,
        y: (a.y + b.y) / 2,
      };
    };

    const handlePointerDown = (e: PointerEvent) => {
      if (e.pointerType !== "touch") return;
      activeTouchPointsRef.current.set(e.pointerId, {
        x: e.clientX,
        y: e.clientY,
      });
      if (activeTouchPointsRef.current.size >= 2) {
        const distance = getPinchDistance();
        pinchRef.current = {
          active: Boolean(distance),
          startDistance: distance ?? 0,
          startScale:
            typeof mindRef.current?.scaleVal === "number"
              ? mindRef.current.scaleVal
              : 1,
        };
        clearLongPressState();
        touchPanRef.current = {
          active: false,
          pointerId: null,
          x: 0,
          y: 0,
          moved: false,
        };
        return;
      }
      touchPanRef.current = {
        active: true,
        pointerId: e.pointerId,
        x: e.clientX,
        y: e.clientY,
        moved: false,
      };
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (e.pointerType !== "touch") return;
      if (activeTouchPointsRef.current.has(e.pointerId)) {
        activeTouchPointsRef.current.set(e.pointerId, {
          x: e.clientX,
          y: e.clientY,
        });
      }

      if (activeTouchPointsRef.current.size >= 2 && pinchRef.current.active) {
        const distance = getPinchDistance();
        const center = getPinchCenter();
        const mind = mindRef.current;
        if (distance && center && mind?.scale) {
          const ratio = distance / Math.max(1, pinchRef.current.startDistance);
          const nextScale = pinchRef.current.startScale * ratio;
          const clamped = Math.min(
            mind.scaleMax ?? 1.4,
            Math.max(mind.scaleMin ?? 0.2, nextScale)
          );
          if (Math.abs(clamped - (mind.scaleVal ?? 1)) > 0.001) {
            clearLongPressState();
            touchDragMovedAtRef.current = Date.now();
            mind.scale(clamped, center);
          }
        }
        return;
      }

      const state = touchPanRef.current;
      if (!state.active || state.pointerId !== e.pointerId) return;
      const dx = e.clientX - state.x;
      const dy = e.clientY - state.y;
      state.x = e.clientX;
      state.y = e.clientY;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
        state.moved = true;
        clearLongPressState();
        mindRef.current?.move?.(dx, dy);
      }
    };

    const handlePointerEnd = (e: PointerEvent) => {
      if (e.pointerType !== "touch") return;
      const state = touchPanRef.current;
      activeTouchPointsRef.current.delete(e.pointerId);
      if (activeTouchPointsRef.current.size < 2) {
        pinchRef.current = {
          active: false,
          startDistance: 0,
          startScale:
            typeof mindRef.current?.scaleVal === "number"
              ? mindRef.current.scaleVal
              : 1,
        };
      }
      if (state.pointerId === e.pointerId && state.moved) {
        touchDragMovedAtRef.current = Date.now();
      }
      if (state.pointerId === e.pointerId || activeTouchPointsRef.current.size === 0) {
        touchPanRef.current = {
          active: false,
          pointerId: null,
          x: 0,
          y: 0,
          moved: false,
        };
      }
    };

    host.addEventListener("pointerdown", handlePointerDown, { passive: true });
    host.addEventListener("pointermove", handlePointerMove, { passive: true });
    host.addEventListener("pointerup", handlePointerEnd, { passive: true });
    host.addEventListener("pointercancel", handlePointerEnd, { passive: true });

    return () => {
      host.removeEventListener("pointerdown", handlePointerDown);
      host.removeEventListener("pointermove", handlePointerMove);
      host.removeEventListener("pointerup", handlePointerEnd);
      host.removeEventListener("pointercancel", handlePointerEnd);
      activeTouchPointsRef.current.clear();
      pinchRef.current = {
        active: false,
        startDistance: 0,
        startScale: 1,
      };
    };
  }, [isTouchDevice]);

  useEffect(() => {
    const host = elRef.current;
    if (!host) return;

    const handlePointerDown = (e: PointerEvent) => {
      const el = e.target as HTMLElement | null;
      if (!el) return;
      if (el.closest?.("[data-hover-actions='true']")) return;
      const nodeEl =
        el.closest?.("me-tpc[data-nodeid]") ??
        el.closest?.("me-tpc") ??
        el.closest?.("[data-nodeid]");
      if (!nodeEl || !(nodeEl instanceof HTMLElement)) return;
      const nodeId = nodeEl.getAttribute("data-nodeid");
      if (!nodeId) return;
      applySelectionFromElement(nodeEl, nodeId);
    };

    const handleClick = (e: MouseEvent) => {
      if (pendingDeselectTimerRef.current) {
        window.clearTimeout(pendingDeselectTimerRef.current);
        pendingDeselectTimerRef.current = null;
      }
      if (Date.now() - touchDragMovedAtRef.current < 280) {
        touchDragMovedAtRef.current = 0;
        return;
      }
      if (longPressTriggeredRef.current) {
        longPressTriggeredRef.current = false;
        return;
      }
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
        setSelectedNoteText(null);
        setMobileActionNodeId(null);
        return;
      }
      const nodeId = nodeEl.getAttribute("data-nodeid");
      if (!nodeId) return;
      if (selectedNodeIdRef.current === nodeId && e.detail === 1) {
        pendingDeselectTimerRef.current = window.setTimeout(() => {
          const mind = mindRef.current;
          mind?.selection?.cancel?.();
          setSelectedNodeId(null);
          setSelectedRect(null);
          selectedNodeElRef.current = null;
          setSelectedNoteText(null);
          setMobileActionNodeId(null);
          pendingDeselectTimerRef.current = null;
        }, 220);
        return;
      }
      applySelectionFromElement(nodeEl, nodeId);
    };

    host.addEventListener("pointerdown", handlePointerDown);
    host.addEventListener("click", handleClick);
    return () => {
      host.removeEventListener("pointerdown", handlePointerDown);
      host.removeEventListener("click", handleClick);
    };
  }, []);

  useEffect(() => {
    if (!disableDirectContextMenu) return;
    const host = elRef.current;
    if (!host) return;

    const handleContextMenuCapture = (event: MouseEvent) => {
      if (!event.isTrusted) return;
      event.preventDefault();
      event.stopPropagation();
    };

    host.addEventListener("contextmenu", handleContextMenuCapture, true);
    return () => {
      host.removeEventListener("contextmenu", handleContextMenuCapture, true);
    };
  }, [disableDirectContextMenu]);

  useEffect(() => {
    clearLongPressState();
  }, [showMobileControls]);
  const lastTransformRef = useRef<string | null>(null);
  const lastScaleRef = useRef<number | null>(null);

  const { profileThemeName } = useMindThemePreference();

  const profileTheme = useMemo(() => {
    if (!profileThemeName) return null;
    if (profileThemeName === DEFAULT_THEME_NAME) return null;
    return MIND_THEME_BY_NAME[profileThemeName] ?? null;
  }, [profileThemeName]);

  const hasFixedTheme = Boolean(theme ?? profileTheme);

  const resolveThemeObj = useMemo(() => {
    return (
      defaults: { light: unknown; dark: unknown } | null,
      modeValue: "light" | "dark"
    ) => {
      const fallback = defaults?.[modeValue];
      if (theme === null) return fallback;
      return theme ?? profileTheme ?? fallback;
    };
  }, [theme, profileTheme]);

  const initialData = useMemo(() => {
    if (data !== undefined && data !== null) return data;
    if (placeholderData !== undefined && placeholderData !== null) {
      return placeholderData;
    }
    return allowSampled ? sampled : null;
  }, [data, placeholderData, allowSampled]);

  const mindLocale = useMemo(() => {
    const normalized = (locale || "en").toLowerCase();
    return normalized.startsWith("ko") ? "ko" : "en";
  }, [locale]);

  const contextMenuText = useMemo(
    () =>
      mindLocale === "ko"
        ? {
            copyMarkdown: "마크다운 복사",
            copyExpandedMarkdown: "펼쳐진 노드만 마크다운 복사",
            copySuccess: "마크다운을 복사했어요.",
            copyFail: "복사에 실패했습니다.",
          }
        : {
            copyMarkdown: "Copy as Markdown",
            copyExpandedMarkdown: "Copy expanded nodes as Markdown",
            copySuccess: "Copied the markdown.",
            copyFail: "Failed to copy.",
          },
    [mindLocale]
  );

  const {
    updateSelectedRect,
    applySelectionFromElement,
    getNodeElById,
    clearSearchHighlights,
    setSearchHighlights,
    setSearchActive,
    focusNodeById,
    handleExitFocus,
    handleHighlightClick: handleHighlightClickBase,
  } = useMindElixirFocusSearch({
    elRef,
    wrapperRef,
    mindRef,
    latestMindDataRef,
    focusInsetLeftRef,
    selectedNodeElRef,
    selectedNodeIdRef,
    lastClickedNodeRef,
    setSelectedNodeId,
    setSelectedRect,
    setSelectedNoteText,
    setMobileActionNodeId,
    setIsFocusMode,
    normalizeMindData,
    cloneMindData,
    findNodeById,
    findNodePathByRef,
    getNodeByPath,
    expandPathToId,
    escapeAttr,
    escapeRegExp,
    highlightVariant,
    syncLatestMindDataFromMind,
  });

  useEffect(() => {
    selectedNodeIdRef.current = selectedNodeId;
  }, [selectedNodeId]);

  const {
    noteEditorOpen,
    setNoteEditorOpen,
    noteDraft,
    setNoteDraft,
    handleNoteClick,
    handleNoteSave,
  } = useMindElixirNotes({
    selectedNodeIdRef,
    selectedNodeElRef,
    latestMindDataRef,
    noteBadgeSvg: NOTE_BADGE_SVG,
    normalizeMindData,
    findNodeById,
    normalizeNodeId,
    onChangeRef,
    setSelectedNoteText,
  });

  const handleHighlightClick = (targetNodeId?: string | null) => {
    const result = handleHighlightClickBase(targetNodeId);
    if (!result) return;
    onChangeRef.current?.(result.op);
    requestAnimationFrame(() => updateSelectedRect(result.selectedId));
  };
  const { openNodeContextMenu, runMobileNodeAction, selectedNodeIsRoot } =
    useMindElixirNodeActions({
      editMode,
      showMobileControls,
      mindRef,
      selectedNodeElRef,
      selectedNodeId,
      selectedNodeIdRef,
      setMobileActionNodeId,
      getNodeElById,
    });

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

  function applyPanInteraction(
    mind: any,
    enabled: boolean,
    button: 0 | 2 = panModeButton
  ) {
    if (wrapperRef.current) {
      wrapperRef.current.classList.toggle(PAN_MODE_CLASS, enabled);
    }
    if (elRef.current) {
      elRef.current.classList.toggle(PAN_MODE_CLASS, enabled);
      elRef.current.style.touchAction = enabled ? "none" : "";
    }

    if (!mind) return;
    mind.mouseSelectionButton = enabled ? button : 0;
    if (enabled) {
      mind.selection?.cancel?.();
      mind.selection?.disable?.();
    } else {
      mind.selection?.enable?.();
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
        applyPanInteraction(mindRef.current, enabled, 2);
      },
      setEditMode: (enabled: boolean) => {
        const mind = mindRef.current;
        applyEditMode(mind, enabled);
      },
      setLayout: (mode) => {
        const mind = mindRef.current;
        if (!mind) return;
        if (mode === "left") {
          mind.initLeft?.();
        } else if (mode === "right") {
          mind.initRight?.();
        } else {
          mind.initSide?.();
        }
        centerMap(mind);
      },
      getSnapshot: () => {
        const mind = mindRef.current;
        if (!mind) return null;
        const raw = mind.getData?.() ?? mind.getAllData?.() ?? null;
        if (raw) {
          const cloned = cloneMindData(raw);
          latestMindDataRef.current = cloned;
          return cloned;
        }
        if (latestMindDataRef.current) {
          return cloneMindData(latestMindDataRef.current);
        }
        return null;
      },
      exportPng: async () => {
        const mind = mindRef.current;
        if (!mind || typeof mind.exportPng !== "function") return null;
        try {
          return await mind.exportPng(false);
        } catch {
          return null;
        }
      },
      centerMap: () => {
        centerMap(mindRef.current);
      },
      zoomIn: () => {
        const mind = mindRef.current;
        if (!mind || typeof mind.scale !== "function") return;
        const next = Math.min(mind.scaleMax ?? 1.4, (mind.scaleVal ?? 1) + 0.1);
        mind.scale(next);
      },
      zoomOut: () => {
        const mind = mindRef.current;
        if (!mind || typeof mind.scale !== "function") return;
        const next = Math.max(mind.scaleMin ?? 0.2, (mind.scaleVal ?? 1) - 0.1);
        mind.scale(next);
      },
      findNodesByQuery: (query, options) => {
        const raw =
          mindRef.current?.getData?.() ?? mindRef.current?.getAllData?.();
        const normalized = normalizeMindData(raw);
        if (!normalized) return [];
        const q = query.trim().toLowerCase();
        if (!q) return [];
        const out: Array<{ id: string; text: string }> = [];
        collectMatches(normalized.node, q, Boolean(options?.includeNotes), out);
        return out;
      },
      setSearchHighlights,
      setSearchActive,
      clearSearchHighlights,
      focusNodeById,
    }),
    []
  );


  useEffect(() => {
    if (!mounted) return;
    if (!elRef.current) return;

    if (!initialData) {
      try {
        mindRef.current?.destroy?.();
      } catch {}
      mindRef.current = null;
      latestMindDataRef.current = null;
      setReady(false);
      return;
    }

    let cancelled = false;
    const myToken = ++initTokenRef.current;

    try {
      mindRef.current?.destroy?.();
    } catch {}
    mindRef.current = null;
    latestMindDataRef.current = cloneMindData(initialData);

    setReady(false);

    let syncSelectedRect: (() => void) | null = null;
    let handleResize: (() => void) | null = null;
    let handleMiniResize: (() => void) | null = null;
    let syncMiniMap: (() => void) | null = null;
    let handleRefreshDecorations: (() => void) | null = null;
    let mutationObserver: MutationObserver | null = null;

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

        const normalizePanDelta = (delta: number) => {
          const scaled = delta * 0.35;
          if (scaled === 0) return 0;
          return Math.sign(scaled) * Math.min(Math.abs(scaled), 42);
        };

        if (event.shiftKey) {
          mind.move(-normalizePanDelta(event.deltaY), 0);
        } else {
          mind.move(
            -normalizePanDelta(event.deltaX),
            -normalizePanDelta(event.deltaY)
          );
        }
      };

      const mind = new MindElixir({
        el: elRef.current,
        direction: MindElixir.RIGHT,
        toolBar: showToolbar,
        keypress: true,
        draggable: true,
        editable: true,
        contextMenu: {
          focus: true,
          link: true,
          extend: [
            {
              name: contextMenuText.copyMarkdown,
              onclick: async () => {
                const current = mind.currentNode?.nodeObj as AnyNode | undefined;
                if (!current) return;
                const markdown = nodeToMarkdown(current);
                if (!markdown.trim()) return;
                const ok = await copyToClipboard(markdown);
                if (ok) {
                  toast.message(contextMenuText.copySuccess);
                } else {
                  toast.message(contextMenuText.copyFail);
                }
              },
            },
            {
              name: contextMenuText.copyExpandedMarkdown,
              onclick: async () => {
                const current = mind.currentNode?.nodeObj as AnyNode | undefined;
                if (!current) return;
                const markdown = nodeToMarkdown(current, 0, true);
                if (!markdown.trim()) return;
                const ok = await copyToClipboard(markdown);
                if (ok) {
                  toast.message(contextMenuText.copySuccess);
                } else {
                  toast.message(contextMenuText.copyFail);
                }
              },
            },
          ],
        },
        locale: mindLocale,
        scaleSensitivity: zoomSensitivity,
        mouseSelectionButton: dragButton,
        handleWheel,
        theme: resolvedThemeObj,
      }) as PatchedMindInstance;

      const resolveTopicEl = (value: any): HTMLElement | null => {
        if (!value) return null;
        if (
          value instanceof HTMLElement &&
          value.tagName === "ME-TPC" &&
          "nodeObj" in value &&
          (value as HTMLElement & { nodeObj?: AnyNode }).nodeObj
        ) {
          return value;
        }
        if (value instanceof HTMLElement) {
          const topic = value.closest?.("me-tpc");
          if (
            topic instanceof HTMLElement &&
            "nodeObj" in topic &&
            (topic as HTMLElement & { nodeObj?: AnyNode }).nodeObj
          ) {
            return topic;
          }
        }
        const id =
          typeof value?.nodeObj?.id === "string"
            ? value.nodeObj.id
            : typeof value?.id === "string"
              ? value.id
              : null;
        if (!id || typeof mind.findEle !== "function") return null;
        try {
          const topic = mind.findEle(id);
          if (
            topic instanceof HTMLElement &&
            topic.tagName === "ME-TPC" &&
            (topic as HTMLElement & { nodeObj?: AnyNode }).nodeObj
          ) {
            return topic;
          }
        } catch {}
        return null;
      };

      const resolveTopicEls = (value: any): HTMLElement[] => {
        if (!Array.isArray(value)) return [];
        return value
          .map((item) => resolveTopicEl(item))
          .filter((item): item is HTMLElement => item instanceof HTMLElement);
      };

      const patchTopicMethod = (
        key:
          | "selectNode"
          | "addChild"
          | "beginEdit"
          | "moveUpNode"
          | "moveDownNode"
      ) => {
        const original = mind[key]?.bind(mind);
        if (typeof original !== "function") return;
        mind[key] = (target?: any, ...args: any[]) => {
          const resolvedTarget =
            resolveTopicEl(target) ??
            resolveTopicEl(mind.currentNode) ??
            undefined;
          if (!resolvedTarget) return;
          return original(resolvedTarget, ...args);
        };
      };

      patchTopicMethod("selectNode");
      patchTopicMethod("addChild");
      patchTopicMethod("beginEdit");
      patchTopicMethod("moveUpNode");
      patchTopicMethod("moveDownNode");

      const originalExpandNode = mind.expandNode?.bind(mind);
      if (typeof originalExpandNode === "function") {
        mind.expandNode = (target?: any, expanded?: boolean) => {
          const resolvedTarget =
            resolveTopicEl(target) ??
            resolveTopicEl(mind.currentNode) ??
            undefined;
          if (!resolvedTarget) return;

          const nodeObj =
            (resolvedTarget as HTMLElement & { nodeObj?: AnyNode }).nodeObj ??
            undefined;
          const parentEl = resolvedTarget.parentElement;
          const expanderEl = parentEl?.children?.[1] as HTMLElement | undefined;

          if (!expanderEl || expanderEl.tagName !== "ME-EPD") {
            if (nodeObj) {
              nodeObj.expanded =
                typeof expanded === "boolean"
                  ? expanded
                  : nodeObj.expanded !== false;
            }
            return;
          }

          return originalExpandNode(resolvedTarget, expanded);
        };
      }

      const originalInsertSibling = mind.insertSibling?.bind(mind);
      if (typeof originalInsertSibling === "function") {
        mind.insertSibling = (type: "before" | "after", target?: any, ...args: any[]) => {
          const resolvedTarget =
            resolveTopicEl(target) ??
            resolveTopicEl(mind.currentNode) ??
            undefined;
          if (!resolvedTarget) return;
          return originalInsertSibling(type, resolvedTarget, ...args);
        };
      }

      const originalRemoveNodes = mind.removeNodes?.bind(mind);
      if (typeof originalRemoveNodes === "function") {
        mind.removeNodes = (targets?: any[]) => {
          const resolvedTargets = resolveTopicEls(targets);
          if (resolvedTargets.length === 0) {
            const fallback = resolveTopicEl(mind.currentNode);
            if (!fallback) return;
            return originalRemoveNodes([fallback]);
          }
          return originalRemoveNodes(resolvedTargets);
        };
      }

      const patchMoveNodeMethod = (key: "moveNodeBefore" | "moveNodeAfter" | "moveNodeIn") => {
        const original = mind[key]?.bind(mind);
        if (typeof original !== "function") return;
        mind[key] = (from: any[], to: any) => {
          const resolvedFrom = resolveTopicEls(from);
          const resolvedTo = resolveTopicEl(to);
          if (resolvedFrom.length === 0 || !resolvedTo) return;
          return original(resolvedFrom, resolvedTo);
        };
      };

      patchMoveNodeMethod("moveNodeBefore");
      patchMoveNodeMethod("moveNodeAfter");
      patchMoveNodeMethod("moveNodeIn");

      const observerOptions = {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["data-nodeid"],
      };
      const clearEditingNodeState = () => {
        elRef.current
          ?.querySelectorAll<HTMLElement>("me-tpc[data-editing]")
          .forEach((node) => node.removeAttribute("data-editing"));
      };
      const shouldHideOriginalTextWhileEditing = (topic: unknown) => {
        const normalized =
          typeof topic === "string" ? topic.trim().toLowerCase() : "";
        if (!normalized) return true;
        return normalized !== "new node";
      };
      const parseTimestampSeconds = (raw: unknown): number | null => {
        if (typeof raw === "number" && Number.isFinite(raw) && raw >= 0) {
          return Math.floor(raw);
        }
        if (typeof raw === "string") {
          const parsed = Number(raw.trim());
          if (Number.isFinite(parsed) && parsed >= 0) {
            return Math.floor(parsed);
          }
        }
        return null;
      };
      const formatTimestamp = (seconds: number): string => {
        const total = Math.max(0, Math.floor(seconds));
        const hh = Math.floor(total / 3600);
        const mm = Math.floor((total % 3600) / 60);
        const ss = total % 60;
        if (mindLocale === "ko") {
          const totalMinutes = Math.floor(total / 60);
          return `${totalMinutes}분 ${ss}초`;
        }
        if (hh > 0) return `${hh}h ${mm}m ${ss}s`;
        if (mm > 0) return `${mm}m ${ss}s`;
        return `${ss}s`;
      };
      const syncNodeDecorations = () => {
        const host = elRef.current;
        if (!host) return;
        if (isDecoratingRef.current) return;
        isDecoratingRef.current = true;
        if (mutationObserver) {
          mutationObserver.disconnect();
        }
        const latestNormalized = normalizeMindData(latestMindDataRef.current);
        const latestRoot = latestNormalized?.node ?? null;
        host.querySelectorAll("me-tpc").forEach((node) => {
          const el = node as HTMLElement & { nodeObj?: AnyNode };
          const nodeId = el.dataset.nodeid ?? "";
          const latestNode =
            latestRoot && nodeId ? findNodeById(latestRoot, nodeId) : null;
          const variant =
            latestNode?.highlight?.variant ?? el.nodeObj?.highlight?.variant;
          if (variant) {
            el.setAttribute("data-highlight", variant);
          } else {
            el.removeAttribute("data-highlight");
          }
          const noteText = (latestNode?.note ?? el.nodeObj?.note ?? "").trim();
          if (noteText) {
            el.setAttribute("data-note", "true");
            let dot = el.querySelector<HTMLElement>(".me-note-dot");
            if (!dot) {
              dot = document.createElement("span");
              dot.className = "me-note-dot";
              dot.setAttribute("data-note-dot", "true");
              dot.innerHTML = NOTE_BADGE_SVG;
              el.appendChild(dot);
            }
            dot.setAttribute("data-nodeid", el.dataset.nodeid ?? "");
          } else {
            el.removeAttribute("data-note");
            const dot = el.querySelector<HTMLElement>(".me-note-dot");
            if (dot) dot.remove();
          }
          const shouldShowTimestamps = showTimestampsRef.current !== false;
          const tsSeconds = parseTimestampSeconds(latestNode?.ts ?? el.nodeObj?.ts);
          const tsBadge = el.querySelector<HTMLElement>(".me-ts-badge");
          if (shouldShowTimestamps && tsSeconds !== null) {
            const label = formatTimestamp(tsSeconds);
            el.setAttribute("data-ts", String(tsSeconds));
            if (tsBadge) {
              tsBadge.textContent = label;
            } else {
              const badge = document.createElement("span");
              badge.className = "me-ts-badge";
              badge.setAttribute("data-ts-badge", "true");
              badge.textContent = label;
              el.appendChild(badge);
            }
          } else {
            el.removeAttribute("data-ts");
            if (tsBadge) tsBadge.remove();
          }
        });
        if (mutationObserver && elRef.current) {
          mutationObserver.observe(elRef.current, observerOptions);
        }
        isDecoratingRef.current = false;
      };

      if (!mind.__originalRefresh) {
        mind.__originalRefresh = mind.refresh?.bind(mind);
        if (mind.__originalRefresh) {
          mind.refresh = (data?: any) => {
            const originalRefresh =
              mind.__originalRefresh ?? ((_: any) => undefined);
            if (data !== undefined) {
              latestMindDataRef.current = cloneMindData(data);
            }
            const res = originalRefresh(data);
            syncNodeDecorations();
            return res;
          };
        }
      }

      mind.init(initialData);
      latestMindDataRef.current = cloneMindData(initialData);
      mindRef.current = mind;
      applyEditMode(mind, editMode === "edit");
      syncNodeDecorations();
      handleRefreshDecorations = () => {
        syncNodeDecorations();
      };
      elRef.current?.addEventListener(
        "mind-elixir-refresh-decorations",
        handleRefreshDecorations
      );
      if (elRef.current && typeof MutationObserver !== "undefined") {
        mutationObserver = new MutationObserver(() => {
          syncNodeDecorations();
        });
        mutationObserver.observe(elRef.current, observerOptions);
      }

      // Keep focus UI in sync even when focus is triggered from context menu
      if (!mind.__originalFocusNode) {
        mind.__originalFocusNode = mind.focusNode?.bind(mind);
      }
      if (!mind.__originalCancelFocus) {
        mind.__originalCancelFocus = mind.cancelFocus?.bind(mind);
      }
      if (typeof mind.__originalFocusNode === "function") {
        mind.focusNode = (...args: any[]) => {
          const originalFocusNode =
            mind.__originalFocusNode ?? ((..._args: any[]) => undefined);
          const result = originalFocusNode(...args);
          setIsFocusMode(true);
          return result;
        };
      }
      if (typeof mind.__originalCancelFocus === "function") {
        mind.cancelFocus = () => {
          const originalCancelFocus =
            mind.__originalCancelFocus ?? (() => undefined);
          const result = originalCancelFocus();
          setSelectedNodeId(null);
          setSelectedRect(null);
          setSelectedNoteText(null);
          selectedNodeElRef.current = null;
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
        if (
          Date.now() - lastClickedNodeRef.current.at <
          MANUAL_SELECTION_PRIORITY_MS
        ) {
          return;
        }
        const last = Array.isArray(nodes) ? nodes[nodes.length - 1] : null;
        const id = last?.id;
        if (!id) return;
        selectedNodeIdRef.current = id;
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
        clearEditingNodeState();
        setSelectedNodeId(null);
        setSelectedRect(null);
        selectedNodeElRef.current = null;
        setSelectedNoteText(null);
      });

      syncSelectedRect = () => {
        const id = selectedNodeIdRef.current;
        if (!id) return;
        updateSelectedRect(id);
      };

      mind.bus?.addListener?.("move", syncSelectedRect);
      mind.bus?.addListener?.("scale", syncSelectedRect);
      syncMiniMap = () => scheduleMiniMapDraw();
      mind.bus?.addListener?.("move", syncMiniMap);
      mind.bus?.addListener?.("scale", syncMiniMap);
      mind.bus?.addListener?.("refresh", syncMiniMap);
      handleResize = () => syncSelectedRect?.();
      handleMiniResize = () => scheduleMiniMapDraw();
      window.addEventListener("resize", handleResize);
      window.addEventListener("resize", handleMiniResize);

      // ✅ 초기 뷰 세팅
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (cancelled || myToken !== initTokenRef.current) return;
          if (!elRef.current) return;

          if (preserveViewState && lastTransformRef.current) {
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
          scheduleMiniMapDraw();
          setReady(true);
        });
      });

      mind.bus?.addListener?.("operation", (op: any) => {
      requestAnimationFrame(() => {
        syncLatestMindDataFromMind();
        syncNodeDecorations();
        if (
          op?.name === "moveNodeBefore" ||
          op?.name === "moveNodeAfter" ||
          op?.name === "moveNodeIn" ||
          op?.name === "moveUpNode" ||
          op?.name === "moveDownNode" ||
          op?.name === "addChild" ||
          op?.name === "insertSibling" ||
          op?.name === "insertParent" ||
          op?.name === "finishEdit"
        ) {
          updateSelectedRect(selectedNodeIdRef.current);
        }
      });

      if (op?.name === "beginEdit") {
        clearEditingNodeState();
        const id = op?.obj?.id;
        if (id) {
          const nodeEl =
            mind.findEle?.(id) ??
            elRef.current?.querySelector<HTMLElement>(
              `me-tpc[data-nodeid="${id}"]`
            ) ??
            elRef.current?.querySelector<HTMLElement>(
              `[data-nodeid="${id}"]`
            ) ??
            null;
          const topic =
            op?.obj?.topic ??
            (nodeEl as (HTMLElement & { nodeObj?: AnyNode }) | null)?.nodeObj?.topic ??
            "";
          nodeEl?.setAttribute(
            "data-editing",
            shouldHideOriginalTextWhileEditing(topic) ? "mask" : "placeholder"
          );
        }
      }

      if (op?.name === "finishEdit") {
        clearEditingNodeState();
      }

      if (op?.name === "selectNode") {
        if (
          Date.now() - lastClickedNodeRef.current.at <
          MANUAL_SELECTION_PRIORITY_MS
        ) {
          return;
        }
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
          clearEditingNodeState();
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

          openNodeContextMenu(id);
      });
    })().catch((e) => {
      console.error("[ME] init failed:", e);
    });

    return () => {
      cancelled = true;
      if (mutationObserver) {
        mutationObserver.disconnect();
        mutationObserver = null;
      }
      if (handleRefreshDecorations && elRef.current) {
        elRef.current.removeEventListener(
          "mind-elixir-refresh-decorations",
          handleRefreshDecorations
        );
      }
      try {
        if (preserveViewState) {
          const mind = mindRef.current;
          const transform = mind?.map?.style?.transform ?? null;
          lastTransformRef.current = transform || null;
          lastScaleRef.current =
            typeof mind?.scaleVal === "number" ? mind.scaleVal : null;
        } else {
          lastTransformRef.current = null;
          lastScaleRef.current = null;
        }
      } catch {}
      try {
        const mind = mindRef.current;
        if (mind?.bus?.removeListener && syncSelectedRect) {
          mind.bus.removeListener("move", syncSelectedRect);
          mind.bus.removeListener("scale", syncSelectedRect);
        }
        if (mind?.bus?.removeListener && syncMiniMap) {
          mind.bus.removeListener("move", syncMiniMap);
          mind.bus.removeListener("scale", syncMiniMap);
          mind.bus.removeListener("refresh", syncMiniMap);
        }
      } catch {}
      try {
        if (handleResize) {
          window.removeEventListener("resize", handleResize);
        }
        if (handleMiniResize) {
          window.removeEventListener("resize", handleMiniResize);
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
    preserveViewState,
    openMenuOnClick,
    showToolbar,
    initialData,
    mindLocale,
    contextMenuText,
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

  useEffect(() => {
    applyPanInteraction(mindRef.current, Boolean(effectivePanMode), panModeButton);
  }, [effectivePanMode, panModeButton, ready]);

  const isDarkCanvas = mounted && effectiveMode === "dark";

  return (
    <div
      ref={wrapperRef}
      className={`relative h-full w-full ${
        isDarkCanvas ? DARK_CANVAS_CLASS : ""
      } ${
        isDarkCanvas && !hasFixedTheme
          ? DEFAULT_DARK_CANVAS_CLASS
          : ""
      }`}
      style={{ overscrollBehaviorX: "none" }}
    >
      <style jsx global>{`
        .${PAN_MODE_CLASS} me-tpc,
        .${PAN_MODE_CLASS} [data-nodeid],
        .${PAN_MODE_CLASS} .node,
        .${PAN_MODE_CLASS} .node-box,
        .${PAN_MODE_CLASS} .topic {
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
        me-tpc {
          position: relative;
          overflow: visible;
        }
        .${DEFAULT_DARK_CANVAS_CLASS} me-tpc {
          border: 1.5px solid rgba(255, 255, 255, 0.84) !important;
          box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.12);
        }
        .${DEFAULT_DARK_CANVAS_CLASS} me-root me-tpc,
        .${DEFAULT_DARK_CANVAS_CLASS} me-tpc.root {
          border-color: rgba(255, 255, 255, 0.97) !important;
        }
        me-root me-tpc,
        me-tpc.root {
          max-width: 12.5em !important;
        }
        me-root me-tpc .text,
        me-tpc.root .text,
        me-root me-tpc .topic,
        me-tpc.root .topic {
          display: block;
          max-width: 12.5em !important;
          font-size: 1rem !important;
          line-height: 1.3 !important;
          white-space: normal !important;
          overflow-wrap: anywhere !important;
          word-break: break-word !important;
          text-wrap: wrap !important;
        }
        me-tpc[data-editing="mask"] .text,
        me-tpc[data-editing="mask"] .topic {
          opacity: 0 !important;
        }
        me-tpc[data-editing="mask"] .me-note-dot,
        me-tpc[data-editing="mask"] .me-ts-badge {
          opacity: 0 !important;
        }
        @media (max-width: 639px) {
          me-parent me-tpc:not(.root) {
            max-width: 21em !important;
          }
          me-parent me-tpc:not(.root) .text,
          me-parent me-tpc:not(.root) .topic {
            display: block;
            max-width: 21em !important;
            white-space: normal !important;
            overflow-wrap: anywhere !important;
            word-break: break-word !important;
            text-wrap: wrap !important;
          }
          #input-box {
            box-sizing: border-box !important;
            width: auto !important;
            max-width: 21em !important;
            min-width: min(21em, calc(100vw - 40px)) !important;
            white-space: normal !important;
            overflow-wrap: anywhere !important;
            word-break: break-word !important;
            text-wrap: wrap !important;
            line-height: 1.4 !important;
          }
        }
        .me-note-dot {
          position: absolute;
          right: -6px;
          top: -6px;
          width: 16px;
          height: 16px;
          border-radius: 999px;
          background: #2563eb;
          color: #ffffff;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          box-shadow:
            0 0 0 2px rgba(255, 255, 255, 0.95),
            0 6px 12px rgba(37, 99, 235, 0.35);
          cursor: pointer;
          pointer-events: auto;
        }
        .me-note-dot svg,
        .me-note-dot svg * {
          width: 10px;
          height: 10px;
          pointer-events: none;
        }
        .me-ts-badge {
          position: absolute;
          right: -8px;
          bottom: -10px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          max-width: 120px;
          min-height: 18px;
          padding: 3px 8px;
          border-radius: 999px;
          border: 1px solid rgba(96, 165, 250, 0.35);
          background: linear-gradient(
            180deg,
            rgba(239, 246, 255, 0.96),
            rgba(219, 234, 254, 0.94)
          );
          color: #1d4ed8;
          font-size: 10px;
          font-weight: 700;
          line-height: 1;
          white-space: nowrap;
          letter-spacing: -0.01em;
          box-shadow:
            0 6px 14px rgba(59, 130, 246, 0.16),
            0 0 0 1px rgba(255, 255, 255, 0.7);
          pointer-events: none;
          z-index: 2;
        }
        .${DEFAULT_DARK_CANVAS_CLASS} .me-ts-badge {
          border-color: rgba(125, 211, 252, 0.22);
          background: linear-gradient(
            180deg,
            rgba(30, 41, 59, 0.96),
            rgba(15, 23, 42, 0.94)
          );
          color: rgba(186, 230, 253, 0.96);
          box-shadow:
            0 10px 22px rgba(2, 6, 23, 0.34),
            0 0 0 1px rgba(125, 211, 252, 0.08);
        }
        .${VIEW_MODE_CLASS} .me-note-dot {
          cursor: pointer;
        }
        me-tpc[data-highlight="gold"] {
          background: linear-gradient(
            135deg,
            #fb923c 0%,
            #fdba74 45%,
            #fde68a 100%
          ) !important;
          color: #1f2937 !important;
          border: 1.5px solid #e11d48 !important;
          box-shadow:
            0 8px 18px rgba(251, 146, 60, 0.28),
            0 0 0 2px rgba(255, 237, 213, 0.38);
        }
        me-tpc[data-highlight="gold"] .text {
          color: #111827 !important;
          font-weight: 500;
        }
        me-tpc[data-search="true"] {
          outline: 2px solid rgba(59, 130, 246, 0.35);
          outline-offset: 2px;
          box-shadow: 0 6px 16px rgba(59, 130, 246, 0.18);
        }
        me-tpc[data-search-active="true"] {
          outline: 2px solid rgba(59, 130, 246, 0.75);
          outline-offset: 2px;
          box-shadow: 0 8px 20px rgba(59, 130, 246, 0.28);
        }
        me-tpc .text .me-search-mark {
          background: rgba(250, 204, 21, 0.45);
          color: inherit;
          padding: 0 2px;
          border-radius: 4px;
        }
      `}</style>
      <ClientMindElixirOverlay
        elRef={elRef}
        effectivePanMode={effectivePanMode}
        showMobileControls={showMobileControls}
        editMode={editMode}
        selectedNodeId={selectedNodeId}
        mobileActionNodeId={mobileActionNodeId}
        mobileEditMenuTitle={mobileEditMenuTitle}
        mobileEditLabels={mobileEditLabels}
        selectedNodeIsRoot={selectedNodeIsRoot}
        onCloseMobileActions={() => setMobileActionNodeId(null)}
        onAddChild={() => void runMobileNodeAction("addChild")}
        onAddSibling={() => void runMobileNodeAction("addSibling")}
        onRename={() => void runMobileNodeAction("rename")}
        onRemove={() => void runMobileNodeAction("remove")}
        showMiniMap={showMiniMap}
        isTouchDevice={isTouchDevice}
        miniMapLabel={miniMapLabel}
        miniMapCenterLabel={miniMapCenterLabel}
        miniMapZoomInLabel={miniMapZoomInLabel}
        miniMapZoomOutLabel={miniMapZoomOutLabel}
        miniMapCollapseLevelLabel={miniMapCollapseLevelLabel}
        miniMapExpandLevelLabel={miniMapExpandLevelLabel}
        miniMapRef={miniMapRef}
        onMiniMapCenter={() => centerMap(mindRef.current)}
        onMiniMapZoomIn={() => {
          const mind = mindRef.current;
          if (!mind || typeof mind.scale !== "function") return;
          const next = Math.min(mind.scaleMax ?? 1.4, (mind.scaleVal ?? 1) + 0.1);
          mind.scale(next);
        }}
        onMiniMapZoomOut={() => {
          const mind = mindRef.current;
          if (!mind || typeof mind.scale !== "function") return;
          const next = Math.max(mind.scaleMin ?? 0.2, (mind.scaleVal ?? 1) - 0.1);
          mind.scale(next);
        }}
        onMiniMapCollapseLevel={() => {
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
        }}
        onMiniMapExpandLevel={() => {
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
        }}
        isFocusMode={isFocusMode}
        selectedRect={selectedRect}
        hoverActionWrapClass={hoverActionWrapClass}
        hoverActionButtonClass={hoverActionButtonClass}
        hoverActionIconClass={hoverActionIconClass}
        onNoteClick={handleNoteClick}
        onHighlightClick={() => handleHighlightClick(selectedNodeIdRef.current)}
        moreActionsLabel={moreActionsLabel}
        annotationAddLabel={annotationAddLabel}
        highlightLabel={highlightLabel}
        showSelectionContextMenuButton={showSelectionContextMenuButton}
        onToggleMobileActionNode={() =>
          setMobileActionNodeId((prev) =>
            prev === selectedNodeId ? null : selectedNodeId
          )
        }
        onOpenSelectionContextMenu={(anchorEl) =>
          openNodeContextMenu(selectedNodeIdRef.current, anchorEl)
        }
        focusModeLabel={focusModeLabel}
        focusModeExitLabel={focusModeExitLabel}
        onExitFocus={handleExitFocus}
        selectedNoteText={selectedNoteText}
        noteEditorOpen={noteEditorOpen}
        onNoteEditorOpenChange={setNoteEditorOpen}
        noteDraft={noteDraft}
        onNoteDraftChange={setNoteDraft}
        onDeleteNote={() => {
          setNoteDraft("");
          handleNoteSave();
        }}
        onSaveNote={handleNoteSave}
        annotationDialogTitle={annotationDialogTitle}
        annotationPlaceholder={annotationPlaceholder}
        annotationDeleteLabel={annotationDeleteLabel}
        cancelLabel={cancelLabel}
        saveLabel={saveLabel}
        loading={loading}
        ready={ready}
      />
    </div>
  );
});

export default ClientMindElixir;
