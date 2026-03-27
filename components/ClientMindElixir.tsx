"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { Icon } from "@iconify/react";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { useLocale } from "next-intl";
import { sampled } from "@/app/lib/g6/sampleData";
import {
  DEFAULT_THEME_NAME,
  MIND_THEME_BY_NAME,
} from "@/components/maps/themes";
import { useMindThemePreference } from "@/components/maps/MindThemePreferenceProvider";
import MindElixirMobileControls from "@/components/MindElixirMobileControls";
import MindElixirMiniMap from "@/components/MindElixirMiniMap";
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
  showMiniMap?: boolean;
  showToolbar?: boolean;
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

function findNodeById(node: AnyNode, id: string): AnyNode | null {
  if (!isNodeLike(node)) return null;
  if (node.id === id) return node;
  if (!node.children) return null;
  for (const child of node.children) {
    const found = findNodeById(child, id);
    if (found) return found;
  }
  return null;
}

function expandPathToId(
  node: AnyNode | null | undefined,
  targetId: string
): boolean {
  if (!isNodeLike(node)) return false;
  const nodeId = node.id ? normalizeNodeId(node.id) : "";
  const target = normalizeNodeId(targetId);
  if (nodeId === target) {
    node.expanded = true;
    return true;
  }
  if (!node.children || node.children.length === 0) return false;
  let found = false;
  for (const child of node.children) {
    if (expandPathToId(child, targetId)) {
      found = true;
    }
  }
  if (found) {
    node.expanded = true;
  }
  return found;
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
      showMiniMap = true,
      showToolbar = false,
      panMode,
      panModeButton = 2,
      showMobileEditControls = true,
    },
    ref
  ) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const elRef = useRef<HTMLDivElement>(null);
  const mindRef = useRef<any>(null);
  const currentLevelRef = useRef(0);

  const { resolvedTheme } = useTheme();
  const locale = useLocale();
  const miniMapLabel = locale === "ko" ? "미니맵" : "Mini map";
  const {
    mounted,
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

  const [ready, setReady] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedRect, setSelectedRect] = useState<DOMRect | null>(null);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [selectedNoteText, setSelectedNoteText] = useState<string | null>(null);
  const [noteEditorOpen, setNoteEditorOpen] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");
  const [noteTargetId, setNoteTargetId] = useState<string | null>(null);
  const [mobileActionNodeId, setMobileActionNodeId] = useState<string | null>(null);
  const miniMapRef = useRef<HTMLCanvasElement>(null);
  const miniMapBoundsRef = useRef<{
    minX: number;
    minY: number;
    scale: number;
    offsetX: number;
    offsetY: number;
  } | null>(null);
  const miniMapDragRef = useRef<{
    dragging: boolean;
    lastX: number;
    lastY: number;
  }>({ dragging: false, lastX: 0, lastY: 0 });
  const miniMapRafRef = useRef<number | null>(null);
  const miniMapDrawRef = useRef<() => void>(() => {});
  const selectedNodeIdRef = useRef<string | null>(null);
  const selectedNodeElRef = useRef<HTMLElement | null>(null);
  const longPressTimerRef = useRef<number | null>(null);
  const longPressTriggeredRef = useRef(false);
  const longPressTargetRef = useRef<{
    nodeId: string | null;
    startX: number;
    startY: number;
    el: HTMLElement | null;
  }>({ nodeId: null, startX: 0, startY: 0, el: null });
  const highlightVariant = "gold";
  const searchHighlightIdsRef = useRef<Set<string>>(new Set());
  const searchActiveIdRef = useRef<string | null>(null);
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
    if (trimmed.length === 0) {
      delete selectedEl.nodeObj.note;
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
  const handleExitFocus = () => {
    const mind = mindRef.current;
    if (!mind) return;
    mind.cancelFocus?.();
    setSelectedNodeId(null);
    setSelectedRect(null);
    setSelectedNoteText(null);
    selectedNodeElRef.current = null;
    setIsFocusMode(false);
  };
  const handleHighlightClick = () => {
    const mind = mindRef.current;
    const selectedId = selectedNodeIdRef.current;
    if (!mind || !selectedId) return;
    const selectedEl = selectedNodeElRef.current as
      | (HTMLElement & { nodeObj?: AnyNode })
      | null;
    if (selectedEl?.nodeObj) {
      const node = selectedEl.nodeObj;
      if (node.highlight?.variant) {
        delete node.highlight;
        selectedEl.removeAttribute("data-highlight");
      } else {
        node.highlight = { variant: highlightVariant };
        selectedEl.setAttribute("data-highlight", highlightVariant);
      }
      onChangeRef.current?.({
        name: "toggleHighlight",
        id: normalizeNodeId(selectedId),
        value: node.highlight ?? null,
      });
      return;
    }
    const raw = mind.getData?.() ?? mind.getAllData?.();
    const normalized = normalizeMindData(raw);
    if (!normalized) return;
    const next = cloneMindData(normalized.data);
    const nextNode = normalizeMindData(next)?.node;
    if (!nextNode) return;
    const targetId = normalizeNodeId(selectedId);
    const target = findNodeById(nextNode, targetId);
    if (!target) return;
    if (target.highlight?.variant) {
      delete target.highlight;
    } else {
      target.highlight = { variant: highlightVariant };
    }
    mind.refresh?.(next);
    onChangeRef.current?.({
      name: "toggleHighlight",
      id: targetId,
      value: target.highlight ?? null,
    });
    requestAnimationFrame(() => updateSelectedRect(selectedId));
  };

  const initTokenRef = useRef(0);
  const defaultThemeRef = useRef<{ light: any; dark: any } | null>(null);
  const onChangeRef = useRef<typeof onChange | null>(null);

  useEffect(() => {
    onChangeRef.current = onChange ?? null;
  }, [onChange]);

  const scheduleMiniMapDraw = () => {
    if (miniMapRafRef.current) {
      cancelAnimationFrame(miniMapRafRef.current);
    }
    miniMapRafRef.current = requestAnimationFrame(() => {
      miniMapDrawRef.current();
    });
  };

  useEffect(() => {
    miniMapDrawRef.current = () => {
      const canvas = miniMapRef.current;
      const host = elRef.current;
      if (!canvas || !host) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const width = Math.max(1, Math.floor(rect.width * dpr));
      const height = Math.max(1, Math.floor(rect.height * dpr));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, rect.width, rect.height);

      const nodes = Array.from(host.querySelectorAll<HTMLElement>("me-tpc"));
      if (nodes.length === 0) return;

      type MiniNode = { x: number; y: number; parentId?: string | null };
      const points = new Map<string, MiniNode>();

      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;

      nodes.forEach((node) => {
        const r = node.getBoundingClientRect();
        const x = r.left + r.width / 2;
        const y = r.top + r.height / 2;
        const obj = (node as HTMLElement & { nodeObj?: AnyNode }).nodeObj;
        const rawId =
          obj?.id ??
          node.dataset.nodeid?.replace(/^me/, "") ??
          node.dataset.nodeid ??
          "";
        const parentId = obj?.parent?.id ?? null;
        points.set(String(rawId), { x, y, parentId });
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      });

      const pad = 12;
      const boundsW = Math.max(1, maxX - minX);
      const boundsH = Math.max(1, maxY - minY);
      const scale = Math.min(
        (rect.width - pad * 2) / boundsW,
        (rect.height - pad * 2) / boundsH
      );
      const offsetX = (rect.width - boundsW * scale) / 2 - minX * scale;
      const offsetY = (rect.height - boundsH * scale) / 2 - minY * scale;
      miniMapBoundsRef.current = {
        minX,
        minY,
        scale,
        offsetX,
        offsetY,
      };

      // background
      ctx.fillStyle = "rgba(15, 23, 42, 0.06)";
      ctx.fillRect(0, 0, rect.width, rect.height);

      // edges
      ctx.strokeStyle = "rgba(51, 65, 85, 0.35)";
      ctx.lineWidth = 1;
      points.forEach((p) => {
        if (!p.parentId) return;
        const parent = points.get(String(p.parentId));
        if (!parent) return;
        ctx.beginPath();
        ctx.moveTo(p.x * scale + offsetX, p.y * scale + offsetY);
        ctx.lineTo(parent.x * scale + offsetX, parent.y * scale + offsetY);
        ctx.stroke();
      });

      // nodes
      ctx.fillStyle = "rgba(51, 65, 85, 0.8)";
      points.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x * scale + offsetX, p.y * scale + offsetY, 2.2, 0, Math.PI * 2);
        ctx.fill();
      });

      // viewport
      const view = host.getBoundingClientRect();
      const vx = view.left * scale + offsetX;
      const vy = view.top * scale + offsetY;
      const vw = view.width * scale;
      const vh = view.height * scale;
      ctx.strokeStyle = "rgba(37, 99, 235, 0.75)";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(vx, vy, vw, vh);
    };
  });

  useEffect(() => {
    const canvas = miniMapRef.current;
    if (!canvas) return;

    const handlePointerDown = (e: PointerEvent) => {
      miniMapDragRef.current.dragging = true;
      miniMapDragRef.current.lastX = e.clientX;
      miniMapDragRef.current.lastY = e.clientY;
      canvas.setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!miniMapDragRef.current.dragging) return;
      const mind = mindRef.current;
      const bounds = miniMapBoundsRef.current;
      if (!mind || !bounds) return;
      const dx = e.clientX - miniMapDragRef.current.lastX;
      const dy = e.clientY - miniMapDragRef.current.lastY;
      miniMapDragRef.current.lastX = e.clientX;
      miniMapDragRef.current.lastY = e.clientY;
      // Dragging inside minimap should move the main map proportionally
      const moveX = -(dx / bounds.scale);
      const moveY = -(dy / bounds.scale);
      mind.move(moveX, moveY);
    };

    const handlePointerUp = (e: PointerEvent) => {
      miniMapDragRef.current.dragging = false;
      canvas.releasePointerCapture(e.pointerId);
    };

    canvas.addEventListener("pointerdown", handlePointerDown);
    canvas.addEventListener("pointermove", handlePointerMove);
    canvas.addEventListener("pointerup", handlePointerUp);
    canvas.addEventListener("pointercancel", handlePointerUp);

    return () => {
      canvas.removeEventListener("pointerdown", handlePointerDown);
      canvas.removeEventListener("pointermove", handlePointerMove);
      canvas.removeEventListener("pointerup", handlePointerUp);
      canvas.removeEventListener("pointercancel", handlePointerUp);
    };
  }, []);

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
      setSelectedNoteText(null);
      return;
    }
    const nodeEl =
      host.querySelector<HTMLElement>(`me-tpc[data-nodeid="${nodeId}"]`) ||
      host.querySelector<HTMLElement>(`[data-nodeid="${nodeId}"]`);
    if (!nodeEl) {
      setSelectedRect(null);
      setSelectedNoteText(null);
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
    const note =
      (nodeEl as HTMLElement & { nodeObj?: AnyNode }).nodeObj?.note ?? null;
    setSelectedNoteText(note && note.trim().length > 0 ? note : null);
    selectedNodeElRef.current = nodeEl;
  };

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

    const handleClick = (e: MouseEvent) => {
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
      setSelectedNodeId(nodeId);
      selectedNodeElRef.current = nodeEl;
      setMobileActionNodeId(null);
      requestAnimationFrame(() => updateSelectedRect(nodeId));
    };

    host.addEventListener("click", handleClick);
    return () => {
      host.removeEventListener("click", handleClick);
    };
  }, []);

  useEffect(() => {
    const host = elRef.current;
    if (!host) return;
    if (!showMobileControls) return;

    const triggerLongPress = () => {
      const { nodeId, el } = longPressTargetRef.current;
      if (!nodeId || !el) return;
      longPressTriggeredRef.current = true;
      setSelectedNodeId(nodeId);
      selectedNodeElRef.current = el;
      setMobileActionNodeId(nodeId);
      requestAnimationFrame(() => updateSelectedRect(nodeId));
      try {
        navigator.vibrate?.(10);
      } catch {}
    };

    const handlePointerDown = (e: PointerEvent) => {
      if (e.pointerType !== "touch") return;
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const nodeEl =
        target.closest?.("me-tpc[data-nodeid]") ??
        target.closest?.("me-tpc") ??
        target.closest?.("[data-nodeid]");
      if (!nodeEl || !(nodeEl instanceof HTMLElement)) {
        clearLongPressState();
        return;
      }
      const nodeId = nodeEl.getAttribute("data-nodeid");
      if (!nodeId) return;
      clearLongPressState();
      longPressTargetRef.current = {
        nodeId,
        startX: e.clientX,
        startY: e.clientY,
        el: nodeEl,
      };
      longPressTimerRef.current = window.setTimeout(triggerLongPress, 420);
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (e.pointerType !== "touch") return;
      const { nodeId, startX, startY } = longPressTargetRef.current;
      if (!nodeId) return;
      const moved =
        Math.abs(e.clientX - startX) > 8 || Math.abs(e.clientY - startY) > 8;
      if (moved) clearLongPressState();
    };

    const handlePointerEnd = () => {
      clearLongPressState();
    };

    host.addEventListener("pointerdown", handlePointerDown);
    host.addEventListener("pointermove", handlePointerMove);
    host.addEventListener("pointerup", handlePointerEnd);
    host.addEventListener("pointercancel", handlePointerEnd);

    return () => {
      host.removeEventListener("pointerdown", handlePointerDown);
      host.removeEventListener("pointermove", handlePointerMove);
      host.removeEventListener("pointerup", handlePointerEnd);
      host.removeEventListener("pointercancel", handlePointerEnd);
      clearLongPressState();
    };
  }, [showMobileControls]);
  const lastTransformRef = useRef<string | null>(null);
  const lastScaleRef = useRef<number | null>(null);

  const { profileThemeName } = useMindThemePreference();

  const profileTheme = useMemo(() => {
    if (!profileThemeName) return null;
    if (profileThemeName === DEFAULT_THEME_NAME) return null;
    return MIND_THEME_BY_NAME[profileThemeName] ?? null;
  }, [profileThemeName]);

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

  const getNodeElById = (id: string) => {
    const host = elRef.current;
    if (!host) return null;
    const mind = mindRef.current;
    if (typeof mind?.findEle === "function") {
      try {
        const direct = mind.findEle(id);
        if (direct) return direct as HTMLElement;
        if (id.startsWith("me")) {
          const stripped = mind.findEle(id.slice(2));
          if (stripped) return stripped as HTMLElement;
        } else {
          const withPrefix = mind.findEle(`me${id}`);
          if (withPrefix) return withPrefix as HTMLElement;
        }
      } catch {
        // findEle can throw when node is collapsed or missing
      }
    }

    const expandToNode = (nodeId: string) => {
      const raw = mind?.getData?.() ?? mind?.getAllData?.();
      const normalized = normalizeMindData(raw);
      if (!normalized) return false;
      const next = cloneMindData(normalized.data);
      const nextNode = normalizeMindData(next)?.node;
      if (!nextNode) return false;
      const found = expandPathToId(nextNode, nodeId);
      if (!found) return false;
      mind?.refresh?.(next);
      return true;
    };

    if (expandToNode(id)) {
      try {
        if (typeof mind?.findEle === "function") {
          const direct = mind.findEle(id);
          if (direct) return direct as HTMLElement;
        }
      } catch {}
      const el =
        host.querySelector<HTMLElement>(
          `me-tpc[data-nodeid="${escapeAttr(id)}"]`
        ) ?? null;
      if (el) return el;
    }

    const tryIds = [id];
    if (id.startsWith("me")) {
      tryIds.push(id.slice(2));
    } else {
      tryIds.push(`me${id}`);
    }
    for (const candidate of tryIds) {
      const el = host.querySelector(
        `me-tpc[data-nodeid="${escapeAttr(candidate)}"]`
      ) as HTMLElement | null;
      if (el) return el;
    }
    return null;
  };

  const getNodeTextEl = (el: HTMLElement | null) => {
    if (!el) return null;
    return el.querySelector<HTMLElement>(".text");
  };

  const restoreSearchMark = (el: HTMLElement | null) => {
    const textEl = getNodeTextEl(el);
    if (!textEl) return;
    const original = textEl.getAttribute("data-search-original");
    if (original !== null) {
      textEl.innerText = original;
      textEl.removeAttribute("data-search-original");
    }
  };

  const applySearchMark = (el: HTMLElement | null, query: string) => {
    const textEl = getNodeTextEl(el);
    if (!textEl) return;
    const original = textEl.getAttribute("data-search-original");
    if (original === null) {
      textEl.setAttribute("data-search-original", textEl.innerText ?? "");
    }
    const base = textEl.getAttribute("data-search-original") ?? "";
    if (!query.trim()) {
      textEl.innerText = base;
      return;
    }
    const re = new RegExp(escapeRegExp(query), "ig");
    const html = base.replace(
      re,
      (match) => `<mark class="me-search-mark">${match}</mark>`
    );
    textEl.innerHTML = html;
  };

  const clearSearchHighlights = () => {
    const prev = Array.from(searchHighlightIdsRef.current);
    prev.forEach((id) => {
      const el = getNodeElById(id);
      if (el) el.removeAttribute("data-search");
      restoreSearchMark(el);
    });
    searchHighlightIdsRef.current.clear();
    if (searchActiveIdRef.current) {
      const activeEl = getNodeElById(searchActiveIdRef.current);
      if (activeEl) activeEl.removeAttribute("data-search-active");
      searchActiveIdRef.current = null;
    }
  };

  const setSearchHighlights = (ids: string[], query = "") => {
    clearSearchHighlights();
    ids.forEach((id) => {
      const el = getNodeElById(id);
      if (el) {
        el.setAttribute("data-search", "true");
        searchHighlightIdsRef.current.add(id);
        applySearchMark(el, query);
      }
    });
  };

  const setSearchActive = (id?: string | null) => {
    if (searchActiveIdRef.current) {
      const prev = getNodeElById(searchActiveIdRef.current);
      if (prev) prev.removeAttribute("data-search-active");
    }
    if (!id) {
      searchActiveIdRef.current = null;
      return;
    }
    const el = getNodeElById(id);
    if (el) {
      el.setAttribute("data-search-active", "true");
      searchActiveIdRef.current = id;
    }
  };

  const focusNodeById = (id: string) => {
    const el = getNodeElById(id);
    if (!el) return;
    setSelectedNodeId(id);
    selectedNodeElRef.current = el;
    requestAnimationFrame(() => updateSelectedRect(id));
    el.scrollIntoView({ block: "center", inline: "center", behavior: "smooth" });
  };

  const runMobileNodeAction = async (
    action: "addChild" | "addSibling" | "rename" | "remove"
  ) => {
    const mind = mindRef.current;
    const currentNode = mind?.currentNode;
    if (!mind || !currentNode) return;

    try {
      if (action === "addChild") {
        await mind.addChild(currentNode);
        return;
      }
      if (action === "addSibling") {
        await mind.insertSibling("after", currentNode);
        return;
      }
      if (action === "rename") {
        await mind.beginEdit(currentNode);
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

  const selectedNodeObj =
    (selectedNodeElRef.current as (HTMLElement & { nodeObj?: AnyNode }) | null)
      ?.nodeObj ?? null;
  const selectedNodeIsRoot = Boolean(
    selectedNodeObj?.root || !selectedNodeObj?.parent?.id
  );

  useEffect(() => {
    if (!showMobileControls || editMode !== "edit") {
      setMobileActionNodeId(null);
    }
  }, [showMobileControls, editMode]);

  useEffect(() => {
    if (!selectedNodeId) {
      setMobileActionNodeId(null);
    }
  }, [selectedNodeId]);

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
        return mind.getData?.() ?? mind.getAllData?.() ?? null;
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
      setReady(false);
      return;
    }

    let cancelled = false;
    const myToken = ++initTokenRef.current;

    try {
      mindRef.current?.destroy?.();
    } catch {}
    mindRef.current = null;

    setReady(false);

    let syncSelectedRect: (() => void) | null = null;
    let handleResize: (() => void) | null = null;
    let handleMiniResize: (() => void) | null = null;
    let syncMiniMap: (() => void) | null = null;

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

      const syncNodeDecorations = () => {
        const host = elRef.current;
        if (!host) return;
        host.querySelectorAll("me-tpc").forEach((node) => {
          const el = node as HTMLElement & { nodeObj?: AnyNode };
          const variant = el.nodeObj?.highlight?.variant;
          if (variant) {
            el.setAttribute("data-highlight", variant);
          } else {
            el.removeAttribute("data-highlight");
          }
          const noteText = el.nodeObj?.note?.trim();
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
        });
      };

      if (!mind.__originalRefresh) {
        mind.__originalRefresh = mind.refresh?.bind(mind);
        if (mind.__originalRefresh) {
          mind.refresh = (data?: any) => {
            const originalRefresh =
              mind.__originalRefresh ?? ((_: any) => undefined);
            const res = originalRefresh(data);
            syncNodeDecorations();
            return res;
          };
        }
      }

      mind.init(initialData);
      mindRef.current = mind;
      applyEditMode(mind, editMode === "edit");
      syncNodeDecorations();

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

  return (
    <div
      ref={wrapperRef}
      className={`relative h-full w-full ${effectiveMode === "dark" ? DARK_CANVAS_CLASS : ""}`}
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
        .${DARK_CANVAS_CLASS} me-tpc {
          border: 1.5px solid rgba(255, 255, 255, 0.84) !important;
          box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.12);
        }
        .${DARK_CANVAS_CLASS} me-root me-tpc,
        .${DARK_CANVAS_CLASS} me-tpc.root {
          border-color: rgba(255, 255, 255, 0.97) !important;
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
        .${VIEW_MODE_CLASS} .me-note-dot {
          cursor: pointer;
        }
        me-tpc[data-highlight="gold"] {
          background-color: #fde68a !important;
          color: #7c2d12 !important;
          border: 1px solid #f59e0b !important;
          box-shadow:
            0 6px 16px rgba(245, 158, 11, 0.35),
            0 0 0 2px rgba(253, 230, 138, 0.5);
        }
        me-tpc[data-highlight="gold"] .text {
          color: #7c2d12 !important;
          font-weight: 600;
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
      <div
        ref={elRef}
        className="relative h-full w-full"
        style={{ touchAction: effectivePanMode ? "none" : undefined }}
      />

      <MindElixirMobileControls
        showActionBar={
          showMobileControls &&
          editMode === "edit" &&
          !!selectedNodeId &&
          mobileActionNodeId === selectedNodeId
        }
        labels={mobileEditLabels}
        disableAddSibling={selectedNodeIsRoot}
        disableRename={!selectedNodeId}
        disableRemove={selectedNodeIsRoot}
        onAddChild={() => void runMobileNodeAction("addChild")}
        onAddSibling={() => void runMobileNodeAction("addSibling")}
        onRename={() => void runMobileNodeAction("rename")}
        onRemove={() => void runMobileNodeAction("remove")}
      />

      <MindElixirMiniMap
        show={showMiniMap}
        label={miniMapLabel}
        canvasRef={miniMapRef}
      />
      {!isFocusMode && selectedNodeId && selectedRect && (
        <>
          <div
            className="pointer-events-none absolute z-[19] rounded-md ring-2 ring-blue-500/80 shadow-[0_0_0_3px_rgba(255,255,255,0.92),0_10px_24px_rgba(37,99,235,0.22)] dark:shadow-[0_0_0_3px_rgba(11,18,32,0.9),0_10px_24px_rgba(59,130,246,0.28)]"
            style={{
              left: selectedRect.left - 4,
              top: selectedRect.top - 4,
              width: selectedRect.width + 8,
              height: selectedRect.height + 8,
            }}
          />
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
                className="group relative inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] text-white shadow-sm ring-1 ring-red-600/60"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNoteClick();
                }}
                aria-label="노트 추가"
              >
                <Icon icon="mdi:note-text-outline" className="h-3 w-3" />
                <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-1 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/80 px-2 py-0.5 text-[10px] text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                  노트 추가
                </span>
              </button>
              <button
                type="button"
                className="group relative inline-flex h-5 w-5 items-center justify-center rounded-full bg-yellow-400 text-[10px] text-black shadow-sm ring-1 ring-yellow-500/70"
                onClick={(e) => {
                  e.stopPropagation();
                  handleHighlightClick();
                }}
                aria-label="하이라이트"
              >
                <Icon icon="mdi:marker" className="h-3 w-3" />
                <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-1 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/80 px-2 py-0.5 text-[10px] text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                  하이라이트
                </span>
              </button>
              <button
                type="button"
                className="group relative inline-flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-[10px] text-white shadow-sm ring-1 ring-green-600/70"
                onClick={(e) => {
                  e.stopPropagation();
                  handleFocusClick();
                }}
                aria-label="포커스 모드"
              >
                <Icon icon="mdi:target" className="h-3 w-3" />
                <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-1 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/80 px-2 py-0.5 text-[10px] text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                  포커스 모드
                </span>
              </button>
            </div>
          </div>
        </>
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

      {!isFocusMode && selectedRect && selectedNoteText && (
        <div
          className="pointer-events-none absolute z-20"
          style={{
            left: selectedRect.left + selectedRect.width + 10,
            top: selectedRect.top,
          }}
        >
          <div className="max-w-[260px] rounded-xl border border-blue-200 bg-white/95 px-3 py-2 text-xs text-neutral-700 shadow-lg dark:border-white/10 dark:bg-[#0b1220]/95 dark:text-white/85">
            {selectedNoteText}
          </div>
        </div>
      )}

      <Dialog open={noteEditorOpen} onOpenChange={setNoteEditorOpen}>
        <DialogContent className="max-w-[420px]">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-blue-700 dark:text-blue-200">
                노트
              </h3>
            </div>

            <textarea
              className="min-h-[120px] w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-200/60 dark:border-white/10 dark:bg-[#0b1220] dark:text-white/85 dark:focus:border-blue-300 dark:focus:ring-blue-500/30"
              placeholder="노트를 입력하세요"
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
                  노트 삭제
                </button>
                <button
                  type="button"
                  className="rounded-full border border-neutral-200 bg-white px-3 py-1 text-[11px] font-semibold text-neutral-600 hover:bg-neutral-50 dark:border-white/10 dark:bg-white/[0.06] dark:text-white/70 dark:hover:bg-white/10"
                  onClick={() => setNoteEditorOpen(false)}
                >
                  취소
                </button>
                <button
                  type="button"
                  className="rounded-full bg-blue-600 px-3 py-1 text-[11px] font-semibold text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400"
                  onClick={handleNoteSave}
                >
                  저장
                </button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
