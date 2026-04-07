"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  useCallback,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTheme } from "next-themes";
import { useLocale, useTranslations } from "next-intl";
import { sampled } from "@/app/lib/mind-elixir/sampleData";
import {
  DEFAULT_THEME_NAME,
  MIND_THEME_BY_NAME,
} from "@/components/maps/themes";
import MindElixirMobileLayer from "@/components/MindElixirMobileLayer";
import { useMindThemePreference } from "@/components/maps/MindThemePreferenceProvider";
import MindElixirMiniMap from "@/components/MindElixirMiniMap";
import { useMindElixirContextMenu } from "@/components/useMindElixirContextMenu";
import { useMindElixirCore } from "@/components/useMindElixirCore";
import { useMindElixirFocusSearch } from "@/components/useMindElixirFocusSearch";
import { useMindElixirMiniMap } from "@/components/useMindElixirMiniMap";
import { useMindElixirThemeStyles } from "@/components/useMindElixirThemeStyles";
import { useMindElixirResponsiveState } from "@/components/useMindElixirResponsiveState";
import { Dialog, DialogContent } from "@/components/ui/dialog";

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
  const tControls = useTranslations("MapControls");
  const tMind = useTranslations("ClientMindElixir");
  const miniMapLabel = locale === "ko" ? "미니맵" : "Mini map";
  const mobileEditMenuTitle = tControls("nodeActions.editNode");
  const noteActionLabel = tControls("nodeActions.addNote");
  const highlightActionLabel = tControls("nodeActions.highlight");
  const moreActionsLabel = tControls("nodeActions.more");
  const focusModeLabel = tControls("focusMode.label");
  const focusModeExitLabel = tControls("focusMode.exit");
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
    // Re-run decoration sync without re-initializing the map instance.
    const host = elRef.current;
    if (!host) return;
    const event = new Event("mind-elixir-refresh-decorations");
    host.dispatchEvent(event);
  }, [showTimestamps]);

  const [ready, setReady] = useState(false);
  const [noteEditorOpen, setNoteEditorOpen] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");
  const [noteTargetId, setNoteTargetId] = useState<string | null>(null);
  const [mobileActionNodeId, setMobileActionNodeId] = useState<string | null>(null);
  const longPressTimerRef = useRef<number | null>(null);
  const longPressTriggeredRef = useRef(false);
  const touchDragMovedAtRef = useRef(0);
  const lastStableSelectionRef = useRef<{ id: string | null; at: number }>({
    id: null,
    at: 0,
  });
  const debugRunIdRef = useRef(`prod-mobile-${Date.now()}`);
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
    ? "flex items-center gap-1 rounded-full bg-white/94 px-1 py-0.5 shadow-md ring-1 ring-black/5 dark:bg-[#0b1220]/94 dark:ring-white/10"
    : "flex items-center gap-1 rounded-full bg-white/90 px-1 py-0.5 shadow-sm ring-1 ring-black/5 dark:bg-[#0b1220]/90 dark:ring-white/10";
  const hoverActionButtonClass = isTouchDevice
    ? "group relative inline-flex h-6 w-6 items-center justify-center rounded-full text-[9px] shadow-sm"
    : "group relative inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] shadow-sm";
  const hoverActionIconClass = isTouchDevice ? "h-3 w-3" : "h-3 w-3";
  const isDecoratingRef = useRef(false);
  const onChangeRef = useRef<((op: any) => void) | null>(null);

  const syncLatestMindDataFromMind = () => {
    const mind = mindRef.current;
    if (!mind) return null;
    const raw = mind.getData?.() ?? mind.getAllData?.() ?? null;
    const normalized = normalizeMindData(raw);
    if (!normalized) return null;
    latestMindDataRef.current = cloneMindData(normalized.data);
    return normalizeMindData(latestMindDataRef.current);
  };

  const {
    selectedNodeId,
    setSelectedNodeId,
    selectedRect,
    setSelectedRect,
    selectedNoteText,
    setSelectedNoteText,
    isFocusMode,
    setIsFocusMode,
    selectedNodeIdRef,
    selectedNodeElRef,
    lastClickedNodeRef,
    getNodeElById,
    updateSelectedRect,
    applySelectionFromElement,
    clearSearchHighlights,
    setSearchHighlights,
    setSearchActive,
    focusNodeById,
    handleExitFocus,
    handleHighlightClick,
    selectedNodeIsRoot,
  } = useMindElixirFocusSearch({
    wrapperRef,
    elRef,
    mindRef,
    latestMindDataRef,
    onChangeRef,
    focusInsetLeftRef,
    syncLatestMindDataFromMind,
    setMobileActionNodeId,
    normalizeMindData,
    cloneMindData,
    findNodeById,
    findNodePathByRef,
    getNodeByPath,
    expandPathToId,
    escapeAttr,
    highlightVariant,
  });

  const { miniMapRef, scheduleMiniMapDraw } = useMindElixirMiniMap({
    elRef,
    mindRef,
    effectiveMode,
  });
  const { openNodeContextMenu } = useMindElixirContextMenu({
    elRef,
    selectedNodeIdRef,
    selectedNodeElRef,
    getNodeElById,
    disableDirectContextMenu,
  });
  const handleNoteClick = () => {
    const mind = mindRef.current;
    const selectedId = selectedNodeIdRef.current;
    if (!mind || !selectedId) return;
    const selectedEl = selectedNodeElRef.current as
      | (HTMLElement & { nodeObj?: AnyNode })
      | null;
    if (!selectedEl?.nodeObj) return;
    setNoteTargetId(selectedId);
    setNoteDraft(selectedEl.nodeObj.note ?? "");
    setNoteEditorOpen(true);
  };

  const handleNoteSave = () => {
    const selectedId = noteTargetId ?? selectedNodeIdRef.current;
    const selectedEl = selectedNodeElRef.current as
      | (HTMLElement & { nodeObj?: AnyNode })
      | null;
    if (!selectedId || !selectedEl?.nodeObj) {
      setNoteEditorOpen(false);
      return;
    }
    const trimmed = noteDraft.trim();
    const normalizedLatest = normalizeMindData(latestMindDataRef.current);
    const latestRoot = normalizedLatest?.node ?? null;
    const latestNode =
      latestRoot && selectedId ? findNodeById(latestRoot, selectedId) : null;
    if (trimmed.length === 0) {
      delete selectedEl.nodeObj.note;
      if (latestNode) {
        delete latestNode.note;
      }
      selectedEl.removeAttribute("data-note");
      const dot = selectedEl.querySelector<HTMLElement>(".me-note-dot");
      if (dot) dot.remove();
      onChangeRef.current?.({
        name: "updateNote",
        id: normalizeNodeId(selectedId),
        value: null,
      });
      setSelectedNoteText(null);
      setNoteEditorOpen(false);
      return;
    }
    const clipped = trimmed.slice(0, 500);
    selectedEl.nodeObj.note = clipped;
    if (latestNode) {
      latestNode.note = clipped;
    }
    let dot = selectedEl.querySelector<HTMLElement>(".me-note-dot");
    if (!dot) {
      dot = document.createElement("span");
      dot.className = "me-note-dot";
      dot.setAttribute("data-note-dot", "true");
      dot.innerHTML = NOTE_BADGE_SVG;
      selectedEl.appendChild(dot);
    }
    dot.setAttribute("data-nodeid", selectedEl.dataset.nodeid ?? "");
    onChangeRef.current?.({
      name: "updateNote",
      id: normalizeNodeId(selectedId),
      value: clipped,
    });
    setSelectedNoteText(clipped);
    setNoteEditorOpen(false);
  };
  const defaultThemeRef = useRef<{ light: any; dark: any } | null>(null);

  useEffect(() => {
    onChangeRef.current = onChange ?? null;
  }, [onChange]);

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

  useEffect(() => {
    if (isTouchDevice) return;
    if (typeof document === "undefined") return;
    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverscrollX = html.style.overscrollBehaviorX;
    const prevBodyOverscrollX = body.style.overscrollBehaviorX;

    html.style.overscrollBehaviorX = "none";
    body.style.overscrollBehaviorX = "none";

    return () => {
      html.style.overscrollBehaviorX = prevHtmlOverscrollX;
      body.style.overscrollBehaviorX = prevBodyOverscrollX;
    };
  }, [isTouchDevice]);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const host = elRef.current;
    if (!wrapper || !host) return;

    const handleWheelCapture = (event: WheelEvent) => {
      if (!host.contains(event.target as Node | null)) return;
      if (Math.abs(event.deltaX) < 1 && !event.shiftKey) return;
      event.preventDefault();
    };

    wrapper.addEventListener("wheel", handleWheelCapture, {
      passive: false,
      capture: true,
    });

    return () => {
      wrapper.removeEventListener("wheel", handleWheelCapture, true);
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
    const activeTouchPoints = activeTouchPointsRef.current;
    const capturedPointerIds = new Set<number>();

    const resetTouchGestureState = () => {
      activeTouchPoints.clear();
      touchPanRef.current = {
        active: false,
        pointerId: null,
        x: 0,
        y: 0,
        moved: false,
      };
      pinchRef.current = {
        active: false,
        startDistance: 0,
        startScale:
          typeof mindRef.current?.scaleVal === "number"
            ? mindRef.current.scaleVal
            : 1,
      };
      clearLongPressState();
    };

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
      if (typeof host.setPointerCapture === "function") {
        try {
          host.setPointerCapture(e.pointerId);
          capturedPointerIds.add(e.pointerId);
        } catch {
          // Ignore capture errors from browser quirks.
        }
      }
      activeTouchPoints.set(e.pointerId, {
        x: e.clientX,
        y: e.clientY,
      });
      if (activeTouchPoints.size >= 2) {
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
      if (activeTouchPoints.has(e.pointerId)) {
        activeTouchPoints.set(e.pointerId, {
          x: e.clientX,
          y: e.clientY,
        });
      }

      if (activeTouchPoints.size >= 2 && pinchRef.current.active) {
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

    const handlePointerEndById = (pointerId: number) => {
      const state = touchPanRef.current;
      activeTouchPoints.delete(pointerId);
      capturedPointerIds.delete(pointerId);
      if (activeTouchPoints.size < 2) {
        pinchRef.current = {
          active: false,
          startDistance: 0,
          startScale:
            typeof mindRef.current?.scaleVal === "number"
              ? mindRef.current.scaleVal
              : 1,
        };
      }
      if (state.pointerId === pointerId && state.moved) {
        touchDragMovedAtRef.current = Date.now();
      }
      if (state.pointerId === pointerId || activeTouchPoints.size === 0) {
        touchPanRef.current = {
          active: false,
          pointerId: null,
          x: 0,
          y: 0,
          moved: false,
        };
      }
    };

    const handlePointerEnd = (e: PointerEvent) => {
      if (e.pointerType !== "touch") return;
      handlePointerEndById(e.pointerId);
      if (
        typeof host.hasPointerCapture === "function" &&
        typeof host.releasePointerCapture === "function"
      ) {
        try {
          if (host.hasPointerCapture(e.pointerId)) {
            host.releasePointerCapture(e.pointerId);
          }
        } catch {
          // Ignore release errors from browser quirks.
        }
      }
    };

    const handleLostPointerCapture = (e: PointerEvent) => {
      handlePointerEndById(e.pointerId);
    };

    const handleWindowPointerEnd = (e: PointerEvent) => {
      if (e.pointerType !== "touch") return;
      handlePointerEndById(e.pointerId);
    };

    const handleWindowBlur = () => {
      resetTouchGestureState();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState !== "visible") {
        resetTouchGestureState();
      }
    };

    host.addEventListener("pointerdown", handlePointerDown, { passive: true });
    host.addEventListener("pointermove", handlePointerMove, { passive: true });
    host.addEventListener("pointerup", handlePointerEnd, { passive: true });
    host.addEventListener("pointercancel", handlePointerEnd, { passive: true });
    host.addEventListener("lostpointercapture", handleLostPointerCapture, {
      passive: true,
    });
    window.addEventListener("pointerup", handleWindowPointerEnd, true);
    window.addEventListener("pointercancel", handleWindowPointerEnd, true);
    window.addEventListener("blur", handleWindowBlur);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      host.removeEventListener("pointerdown", handlePointerDown);
      host.removeEventListener("pointermove", handlePointerMove);
      host.removeEventListener("pointerup", handlePointerEnd);
      host.removeEventListener("pointercancel", handlePointerEnd);
      host.removeEventListener("lostpointercapture", handleLostPointerCapture);
      window.removeEventListener("pointerup", handleWindowPointerEnd, true);
      window.removeEventListener("pointercancel", handleWindowPointerEnd, true);
      window.removeEventListener("blur", handleWindowBlur);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      capturedPointerIds.forEach((pointerId) => {
        if (
          typeof host.hasPointerCapture === "function" &&
          typeof host.releasePointerCapture === "function"
        ) {
          try {
            if (host.hasPointerCapture(pointerId)) {
              host.releasePointerCapture(pointerId);
            }
          } catch {
            // Ignore release errors during cleanup.
          }
        }
      });
      resetTouchGestureState();
    };
  }, [isTouchDevice]);

  useEffect(() => {
    const host = elRef.current;
    if (!host) return;

    const getNodeElementFromEvent = (e: PointerEvent | MouseEvent) => {
      const targetEl = e.target as HTMLElement | null;
      if (targetEl?.closest?.("[data-hover-actions='true']")) return null;
      const direct =
        targetEl?.closest?.("me-tpc[data-nodeid]") ??
        targetEl?.closest?.("me-tpc") ??
        targetEl?.closest?.("[data-nodeid]");
      if (direct && direct instanceof HTMLElement) return direct;

      const path =
        typeof e.composedPath === "function"
          ? (e.composedPath() as EventTarget[])
          : [];
      for (const entry of path) {
        if (!(entry instanceof HTMLElement)) continue;
        if (entry.matches?.("me-tpc[data-nodeid], me-tpc, [data-nodeid]")) {
          return entry;
        }
      }
      return null;
    };

    const handlePointerDown = (e: PointerEvent) => {
      const nodeEl = getNodeElementFromEvent(e);
      if (!nodeEl) return;
      const nodeId = nodeEl.getAttribute("data-nodeid");
      if (!nodeId) return;
      applySelectionFromElement(nodeEl, nodeId);
    };

    const handleClick = (e: MouseEvent) => {
      if (isTouchDevice) return;
      if (Date.now() - touchDragMovedAtRef.current < 280) {
        touchDragMovedAtRef.current = 0;
        return;
      }
      if (longPressTriggeredRef.current) {
        longPressTriggeredRef.current = false;
        return;
      }
      const nodeEl = getNodeElementFromEvent(e);
      if (!nodeEl) {
        setSelectedNodeId(null);
        setSelectedRect(null);
        selectedNodeElRef.current = null;
        setSelectedNoteText(null);
        setMobileActionNodeId(null);
        return;
      }
      const nodeId = nodeEl.getAttribute("data-nodeid");
      if (!nodeId) return;
      applySelectionFromElement(nodeEl, nodeId);
    };

    host.addEventListener("pointerdown", handlePointerDown);
    host.addEventListener("click", handleClick);
    return () => {
      host.removeEventListener("pointerdown", handlePointerDown);
      host.removeEventListener("click", handleClick);
    };
  }, [
    applySelectionFromElement,
    isTouchDevice,
    selectedNodeElRef,
    setSelectedNodeId,
    setSelectedNoteText,
    setSelectedRect,
  ]);

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

  const runMobileNodeAction = async (
    action: "addChild" | "addSibling" | "rename" | "remove"
  ) => {
    const mind = mindRef.current;
    const currentNode = mind?.currentNode;
    if (!mind || !currentNode) return;

    try {
      if (action === "addChild") {
        await mind.addChild(currentNode);
        setMobileActionNodeId(null);
        return;
      }
      if (action === "addSibling") {
        await mind.insertSibling("after", currentNode);
        setMobileActionNodeId(null);
        return;
      }
      if (action === "rename") {
        await mind.beginEdit(currentNode);
        setMobileActionNodeId(null);
        return;
      }
      const isRoot =
        (currentNode.nodeObj as AnyNode | undefined)?.root ||
        !(currentNode.nodeObj as AnyNode | undefined)?.parent?.id;
      if (isRoot) return;
      await mind.removeNodes([currentNode]);
      setMobileActionNodeId(null);
    } catch (error) {
      console.error("[ME] mobile action failed:", action, error);
    }
  };

  useEffect(() => {
    if (!showMobileControls || editMode !== "edit") {
      // #region agent log
      fetch("http://127.0.0.1:7243/ingest/b44aa14f-cb62-41f5-bd7a-02a25686b9d0", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          runId: debugRunIdRef.current,
          hypothesisId: "H2",
          location: "components/ClientMindElixir.tsx:1122",
          message: "mobileActionNodeId cleared by showMobileControls/editMode gate",
          data: {
            showMobileControls,
            editMode,
            mobileActionNodeId,
            selectedNodeId,
            isTouchDevice,
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
      setMobileActionNodeId(null);
    }
  }, [showMobileControls, editMode]);

  useEffect(() => {
    if (!selectedNodeId) {
      // #region agent log
      fetch("http://127.0.0.1:7243/ingest/b44aa14f-cb62-41f5-bd7a-02a25686b9d0", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          runId: debugRunIdRef.current,
          hypothesisId: "H1",
          location: "components/ClientMindElixir.tsx:1128",
          message: "mobileActionNodeId cleared by selectedNodeId null",
          data: {
            selectedNodeId,
            mobileActionNodeId,
            isTouchDevice,
            showMobileControls,
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
      setMobileActionNodeId(null);
    }
  }, [selectedNodeId]);

  const handleToggleMobileActionNode = useCallback(() => {
    // #region agent log
    fetch("http://127.0.0.1:7243/ingest/b44aa14f-cb62-41f5-bd7a-02a25686b9d0", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        runId: debugRunIdRef.current,
        hypothesisId: "H3",
        location: "components/ClientMindElixir.tsx:1167",
        message: "toggle mobile action pressed",
        data: {
          selectedNodeId,
          mobileActionNodeId,
          showMobileControls,
          editMode,
          isTouchDevice,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    setMobileActionNodeId((prev) =>
      normalizeNodeId(prev ?? "") === normalizeNodeId(selectedNodeId ?? "")
        ? null
        : selectedNodeId
    );
  }, [
    editMode,
    isTouchDevice,
    mobileActionNodeId,
    selectedNodeId,
    showMobileControls,
  ]);

  useEffect(() => {
    if (!selectedNodeId) return;
    lastStableSelectionRef.current = {
      id: selectedNodeId,
      at: Date.now(),
    };
  }, [selectedNodeId]);

  useEffect(() => {
    if (!isTouchDevice) return;
    if (isFocusMode) return;
    if (selectedNodeId) return;

    const last = lastStableSelectionRef.current;
    if (!last.id) return;

    const elapsedSinceStable = Date.now() - last.at;
    if (elapsedSinceStable > 650) return;

    const elapsedSinceTouchMove = Date.now() - touchDragMovedAtRef.current;
    if (elapsedSinceTouchMove < 220) return;

    const restoreId = last.id;
    selectedNodeIdRef.current = restoreId;
    setSelectedNodeId(restoreId);
    requestAnimationFrame(() => updateSelectedRect(restoreId));
    window.setTimeout(() => updateSelectedRect(restoreId), 80);
  }, [
    isFocusMode,
    isTouchDevice,
    selectedNodeId,
    selectedNodeIdRef,
    setSelectedNodeId,
    updateSelectedRect,
  ]);

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

  const applyPanInteraction = useMemo(
    () =>
      (mind: any, enabled: boolean, button: 0 | 2 = panModeButton) => {
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
      },
    [panModeButton]
  );

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
    [
      applyPanInteraction,
      clearSearchHighlights,
      focusNodeById,
      latestMindDataRef,
      setSearchActive,
      setSearchHighlights,
    ]
  );


  useMindElixirCore({
    mounted,
    elRef,
    mindRef,
    latestMindDataRef,
    defaultThemeRef,
    lastTransformRef,
    lastScaleRef,
    currentLevelRef,
    isDecoratingRef,
    onChangeRef,
    selectedNodeIdRef,
    selectedNodeElRef,
    lastClickedNodeRef,
    setSelectedNodeId,
    setSelectedRect,
    setSelectedNoteText,
    setIsFocusMode,
    setReady,
    normalizeMindData,
    cloneMindData,
    resolveThemeObj,
    nodeToMarkdown,
    copyToClipboard,
    applyEditMode,
    getMaxExpandedDepth,
    parseScale,
    findNodeById,
    clearAutoBranchColors,
    scheduleMiniMapDraw,
    openNodeContextMenu,
    syncLatestMindDataFromMind,
    updateSelectedRect,
    initialData,
    effectiveMode,
    zoomSensitivity,
    dragButton,
    fitOnInit,
    preserveViewState,
    openMenuOnClick,
    showToolbar,
    mindLocale,
    contextMenuText,
    editMode,
    isTouchDevice,
    noteBadgeSvg: NOTE_BADGE_SVG,
    showTimestampsRef,
    manualSelectionPriorityMs: MANUAL_SELECTION_PRIORITY_MS,
  });

  useEffect(() => {
    const mind = mindRef.current;
    if (!mind) return;
    applyEditMode(mind, editMode === "edit");
  }, [editMode]);

  useEffect(() => {
    applyPanInteraction(mindRef.current, Boolean(effectivePanMode), panModeButton);
  }, [applyPanInteraction, effectivePanMode, panModeButton, ready]);

  const { wrapperClassName, globalStyles } = useMindElixirThemeStyles({
    mounted,
    effectiveMode,
    hasFixedTheme,
    panModeClass: PAN_MODE_CLASS,
    viewModeClass: VIEW_MODE_CLASS,
  });
  const horizontalOverscrollClass = isTouchDevice ? "" : "overscroll-x-none";

  return (
    <div
      ref={wrapperRef}
      className={`${wrapperClassName} ${horizontalOverscrollClass}`.trim()}
    >
      <style jsx global>{globalStyles}</style>
      <div
        ref={elRef}
        className={`relative h-full w-full ${horizontalOverscrollClass}`.trim()}
        style={{ touchAction: effectivePanMode ? "none" : undefined }}
      />

      <MindElixirMiniMap
        show={showMiniMap && !isTouchDevice}
        label={miniMapLabel}
        canvasRef={miniMapRef}
      />
      <MindElixirMobileLayer
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
        isFocusMode={isFocusMode}
        selectedRect={selectedRect}
        hoverActionWrapClass={hoverActionWrapClass}
        hoverActionButtonClass={hoverActionButtonClass}
        hoverActionIconClass={hoverActionIconClass}
        noteActionLabel={noteActionLabel}
        highlightActionLabel={highlightActionLabel}
        handleNoteClick={handleNoteClick}
        handleHighlightClick={handleHighlightClick}
        showSelectionContextMenuButton={showSelectionContextMenuButton}
        isTouchDevice={isTouchDevice}
        moreActionsLabel={moreActionsLabel}
        openNodeContextMenu={openNodeContextMenu}
        onToggleMobileActionNode={handleToggleMobileActionNode}
        focusModeLabel={focusModeLabel}
        focusModeExitLabel={focusModeExitLabel}
        onExitFocus={handleExitFocus}
        selectedNoteText={selectedNoteText}
      />

      <Dialog open={noteEditorOpen} onOpenChange={setNoteEditorOpen}>
        <DialogContent className="max-w-[420px]">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-blue-700 dark:text-blue-200">
                {tMind("noteDialog.title")}
              </h3>
            </div>

            <textarea
              className="min-h-[120px] w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-200/60 dark:border-white/10 dark:bg-[#0b1220] dark:text-white/85 dark:focus:border-blue-300 dark:focus:ring-blue-500/30"
              placeholder={tMind("noteDialog.placeholder")}
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value.slice(0, 500))}
              maxLength={500}
            />

            <div className="flex items-center justify-between text-[11px] text-neutral-500 dark:text-white/60">
              <span>{noteDraft.length}/500</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-[11px] font-semibold text-rose-700 hover:bg-rose-100 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200 dark:hover:bg-rose-500/20"
                  onClick={() => {
                    setNoteDraft("");
                    handleNoteSave();
                  }}
                >
                  {tMind("noteDialog.delete")}
                </button>
                <button
                  type="button"
                  className="rounded-full border border-neutral-200 bg-white px-3 py-1 text-[11px] font-semibold text-neutral-600 hover:bg-neutral-50 dark:border-white/10 dark:bg-white/[0.06] dark:text-white/70 dark:hover:bg-white/10"
                  onClick={() => setNoteEditorOpen(false)}
                >
                  {tMind("noteDialog.cancel")}
                </button>
                <button
                  type="button"
                  className="rounded-full bg-blue-600 px-3 py-1 text-[11px] font-semibold text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400"
                  onClick={handleNoteSave}
                >
                  {tMind("noteDialog.save")}
                </button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {loading && (
        <div className="pointer-events-none absolute left-4 top-4 z-10">
          <span className="rounded-full bg-white/85 px-2.5 py-1 text-[11px] text-neutral-600 shadow-sm dark:bg-[#0b1220]/80 dark:text-white/70">
            {tMind("loading")}
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
