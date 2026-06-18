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
import { useLocale, useTranslations } from "next-intl";
import { sampled } from "@/app/lib/mind-elixir/sampleData";
import {
  getStoredRichTextInnerHtml,
  normalizePlainTextForComparison,
  plainTextToEditorHtml,
  sanitizeRichTextInputHtml,
} from "@/app/lib/nodeRichText";
import { resizeToWebp } from "@/utils/image";
import { createClient } from "@/utils/supabase/client";
import {
  DEFAULT_THEME_NAME,
  MIND_THEME_BY_NAME,
} from "@/components/maps/themes";
import { X } from "lucide-react";
import ClientMindElixirOverlay from "@/components/ClientMindElixirOverlay";
import NodeRichTextDialog from "@/components/maps/NodeRichTextDialog";
import { useMindThemePreference } from "@/components/maps/MindThemePreferenceProvider";
import { useMindElixirFocusSearch } from "@/components/useMindElixirFocusSearch";
import { useMindElixirMiniMap } from "@/components/useMindElixirMiniMap";
import { useMindElixirNodeActions } from "@/components/useMindElixirNodeActions";
import { useMindElixirNotes } from "@/components/useMindElixirNotes";
import { useMindElixirResponsiveState } from "@/components/useMindElixirResponsiveState";

const MIND_SCALE_MAX = 2;
const MIND_SCALE_MIN = 0.2;

type ClientMindElixirProps = {
  mapId?: string;
  mode?: "light" | "dark" | "auto";
  theme?: any;
  data?: any;
  placeholderData?: any;
  allowSampled?: boolean;
  loading?: boolean;
  editMode?: "view" | "edit";
  onChange?: (op: any) => void;
  onViewModeEditAttempt?: () => void;
  onOpenSlideshow?: () => void;
  onRegenerateSelectedNode?: () => void;
  canRegenerateSelectedNode?: boolean;
  regeneratingNodeId?: string | null;

  zoomSensitivity?: number; // scaleSensitivity
  dragButton?: 0 | 2; // mouseSelectionButton
  fitOnInit?: boolean;
  preserveViewState?: boolean;
  openMenuOnClick?: boolean;
  disableDirectContextMenu?: boolean;
  showSelectionContextMenuButton?: boolean;
  showAnnotationAction?: boolean;
  showHighlightAction?: boolean;
  showMiniMap?: boolean;
  showTimestamps?: boolean;
  showToolbar?: boolean;
  focusInsetLeft?: number;
  panMode?: boolean;
  panModeButton?: 0 | 2;
  preferPanModeOnTouch?: boolean;
  showMobileEditControls?: boolean;
  onReadOnlyHighlight?: () => void;
  onSelectedNodeChange?: (
    nodeId: string | null,
    details?: { isRootChild: boolean }
  ) => void;
  onReady?: () => void;
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
  getSelectedSubtree: () => AnyNode | null;
  exportPng: () => Promise<Blob | null>;
  centerMap: () => void;
  undo: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  panBy: (dx: number, dy: number) => void;
  findNodesByQuery: (
    query: string,
    options?: { includeNotes?: boolean }
  ) => Array<{ id: string; text: string }>;
  setSearchHighlights: (ids: string[], query?: string) => void;
  setSearchActive: (id?: string | null) => void;
  clearSearchHighlights: () => void;
  focusNodeById: (id: string) => void;
  getSelectedNodeSourceAnchors: () => {
    nodeId: string;
    topic: string;
    anchorText: string[];
    anchorKeywords: string[];
  } | null;
};

type AnyNode = {
  dangerouslySetInnerHTML?: string | null;
  image?: {
    url: string;
    width: number;
    height: number;
    fit?: "fill" | "contain" | "cover";
  } | null;
  id: string;
  topic: string;
  ts?: unknown;
  root?: boolean;
  parent?: { id?: string } | null;
  branchColor?: string;
  highlight?: { variant?: string } | null;
  note?: string | null;
  meta?: {
    anchorText?: string[];
    anchorKeywords?: string[];
    sourceRangeHint?: {
      startText?: string;
      endText?: string;
    };
  } | null;
  children?: AnyNode[];
  expanded?: boolean;
};

type ImagePreviewState = {
  url: string;
  alt: string;
  width?: number;
  height?: number;
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

function withCacheBuster(url: string) {
  try {
    const nextUrl = new URL(url);
    nextUrl.searchParams.set("t", Date.now().toString());
    return nextUrl.toString();
  } catch {
    return url;
  }
}

async function readImageDimensions(file: File) {
  const image = document.createElement("img");
  image.src = URL.createObjectURL(file);

  try {
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("IMAGE_LOAD_FAILED"));
    });
    return {
      width: image.naturalWidth || image.width,
      height: image.naturalHeight || image.height,
    };
  } finally {
    URL.revokeObjectURL(image.src);
  }
}

function getImageDisplaySize(width: number, height: number) {
  const maxWidth = 132;
  const maxHeight = 96;
  if (width <= 0 || height <= 0) {
    return { width: 120, height: 90 };
  }
  const scale = Math.min(maxWidth / width, maxHeight / height, 1);
  return {
    width: Math.max(48, Math.round(width * scale)),
    height: Math.max(36, Math.round(height * scale)),
  };
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

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tagName = target.tagName;
  if (tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "SELECT") {
    return true;
  }
  return Boolean(
    target.closest(
      'input, textarea, select, [contenteditable="true"], [role="textbox"], #input-box'
    )
  );
}

function isInsideSourceFindPanel(node: Node | null) {
  if (!node) return false;
  const element =
    node instanceof HTMLElement
      ? node
      : node.parentElement instanceof HTMLElement
      ? node.parentElement
      : null;
  return Boolean(element?.closest("[data-source-find-panel='true']"));
}

function hasSourceFindTextSelection() {
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
    return false;
  }

  return (
    isInsideSourceFindPanel(selection.anchorNode) ||
    isInsideSourceFindPanel(selection.focusNode)
  );
}

function getNodeTopicText(node: unknown) {
  if (!node || typeof node !== "object") return "";
  const topic = (node as { topic?: unknown }).topic;
  return typeof topic === "string" ? topic.trim() : "";
}

const NOTE_BADGE_SVG =
  '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M6 2h8l6 6v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm7 1.5V9h5.5L13 3.5zM8 13h8v1.5H8V13zm0 4h5v1.5H8V17z"/></svg>';

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

function centerMap(mind: any, beforeCenter?: () => void) {
  if (!mind) return;
  beforeCenter?.();
  requestAnimationFrame(() => {
    const hasMountedCanvas =
      mind.container instanceof HTMLElement ||
      mind.wrapper instanceof HTMLElement ||
      mind.el instanceof HTMLElement;
    if (!hasMountedCanvas) return;

    try {
      if (typeof mind.toCenter === "function") {
        mind.toCenter();
        return;
      }
      if (typeof mind.scaleFit === "function") {
        mind.scaleFit();
      }
    } catch (error) {
      console.warn("[ME] centerMap skipped:", error);
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
      mapId,
      mode = "auto",
      theme,
      data,
      placeholderData,
      allowSampled = true,
      loading = false,
      editMode = "edit",
      onChange,
      onViewModeEditAttempt,
      onOpenSlideshow,
      onRegenerateSelectedNode,
      canRegenerateSelectedNode = false,
      regeneratingNodeId = null,
      zoomSensitivity = 0.1,
      dragButton = 0,
      fitOnInit = true,
      preserveViewState = true,
      openMenuOnClick = true,
      disableDirectContextMenu = false,
      showSelectionContextMenuButton = false,
      showAnnotationAction = true,
      showHighlightAction = true,
      showMiniMap = true,
      showTimestamps = true,
      showToolbar = false,
      focusInsetLeft = 0,
      panMode,
      panModeButton = 2,
      preferPanModeOnTouch = false,
      showMobileEditControls = true,
      onReadOnlyHighlight,
      onSelectedNodeChange,
      onReady,
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
  const latestMindDataDirtyRef = useRef(false);
  const onReadyRef = useRef<typeof onReady>(onReady);

  const { resolvedTheme } = useTheme();
  const locale = useLocale();
  const t = useTranslations("ClientMindElixir");
  const miniMapLabel = t("miniMap.label");
  const miniMapCenterLabel = t("miniMap.center");
  const miniMapZoomInLabel = t("miniMap.zoomIn");
  const miniMapZoomOutLabel = t("miniMap.zoomOut");
  const miniMapCollapseLevelLabel = t("miniMap.collapseOneLevel");
  const miniMapExpandLevelLabel = t("miniMap.expandOneLevel");
  const mobileEditMenuTitle = t("mobileEdit.title");
  const moreActionsLabel = t("mobileEdit.moreActions");
  const annotationAddLabel = t("annotation.add");
  const highlightLabel = t("highlight");
  const focusModeLabel = t("focusMode.label");
  const focusModeExitLabel = t("focusMode.exit");
  const annotationDialogTitle = t("annotation.title");
  const annotationPlaceholder = t("annotation.placeholder");
  const annotationDeleteLabel = t("annotation.delete");
  const cancelLabel = t("common.cancel");
  const saveLabel = t("common.save");
  const regenerateLabel =
    locale === "ko"
      ? "다시 구조화"
      : locale === "fr"
      ? "Restructurer"
      : "Regenerate";
  const regenerateLoadingLabel =
    locale === "ko"
      ? "다시 구조화 중"
      : locale === "fr"
      ? "Restructuration..."
      : "Regenerating...";
  const imageText = useMemo(
    () => ({
      addOrReplace: t("image.addOrReplace"),
      preview: t("image.preview"),
      remove: t("image.remove"),
      invalidType: t("image.invalidType"),
      tooLarge: t("image.tooLarge", { maxMB: 5 }),
      unavailable: t("image.unavailable"),
      loginRequired: t("image.loginRequired"),
      uploadSuccess: t("image.uploadSuccess"),
      removeSuccess: t("image.removeSuccess"),
      uploadFailed: t("image.uploadFailed"),
      removeFailed: t("image.removeFailed"),
      noImage: t("image.noImage"),
    }),
    [t]
  );
  const richTextText = useMemo(
    () => ({
      editContent: t("richText.editContent"),
      title: t("richText.title"),
      description: t("richText.description"),
      plainTopicLabel: t("richText.plainTopicLabel"),
      bold: t("richText.bold"),
      color: t("richText.color"),
      clearColor: t("richText.clearColor"),
      reset: t("richText.reset"),
      saveSuccess: t("richText.saveSuccess"),
      saveFailed: t("richText.saveFailed"),
      textLockedError: t("richText.textLockedError"),
      colors: [
        { value: "#2563eb", label: t("richText.colors.blue") },
        { value: "#dc2626", label: t("richText.colors.red") },
        { value: "#16a34a", label: t("richText.colors.green") },
        { value: "#7c3aed", label: t("richText.colors.purple") },
        { value: "#22d3ee", label: t("richText.colors.cyan") },
        { value: "#a3e635", label: t("richText.colors.lime") },
        { value: "#facc15", label: t("richText.colors.amber") },
        { value: "#f472b6", label: t("richText.colors.pink") },
      ],
    }),
    [t]
  );
  const {
    mounted,
    isTouchDevice,
    effectiveMode,
    effectivePanMode,
    showMobileControls,
    mobileEditLabels: mobileEditLabelsFromResponsive,
  } = useMindElixirResponsiveState({
    mode,
    resolvedTheme,
    locale,
    editMode,
    panMode,
    preferPanModeOnTouch,
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

  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  const [ready, setReady] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedRect, setSelectedRect] = useState<DOMRect | null>(null);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [, setSelectedNoteText] = useState<string | null>(null);
  const [mobileActionNodeId, setMobileActionNodeId] = useState<string | null>(null);
  const [imageBusy, setImageBusy] = useState(false);
  const [imagePreview, setImagePreview] = useState<ImagePreviewState | null>(
    null
  );
  const [richTextDialogOpen, setRichTextDialogOpen] = useState(false);
  const [richTextNodeId, setRichTextNodeId] = useState<string | null>(null);
  const [richTextInitialHtml, setRichTextInitialHtml] = useState("<p></p>");
  const [richTextPlainTopic, setRichTextPlainTopic] = useState("");

  useEffect(() => {
    if (!imagePreview) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setImagePreview(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [imagePreview]);

  const selectedNodeIdRef = useRef<string | null>(null);
  const selectedNodeElRef = useRef<HTMLElement | null>(null);
  const noteEditorOpenRef = useRef(false);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const pendingImageNodeIdRef = useRef<string | null>(null);
  const lastClickedNodeRef = useRef<{ id: string | null; at: number }>({
    id: null,
    at: 0,
  });
  const pendingDeselectTimerRef = useRef<number | null>(null);
  const wasSelectedBeforePointerDownRef = useRef(false);
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

  useEffect(() => {
    if (!ready) return;
    onReadyRef.current?.();
  }, [ready]);

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
  const clearSelectionBeforeCenter = () => {
    const mind = mindRef.current;
    try {
      mind?.unselectNodes?.();
    } catch {}
    setSelectedNodeId(null);
    setSelectedRect(null);
    setSelectedNoteText(null);
    selectedNodeElRef.current = null;
  };

  const initTokenRef = useRef(0);
  const defaultThemeRef = useRef<{ light: any; dark: any } | null>(null);
  const onChangeRef = useRef<typeof onChange | null>(null);
  const { miniMapRef, scheduleMiniMapDraw } = useMindElixirMiniMap({
    elRef,
    mindRef,
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
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const isNode =
        target.closest?.("me-tpc") || target.closest?.("[data-nodeid]");
      if (!isNode) return;
      if (isTouchDevice) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation?.();
        return;
      }
      if (isTypingTarget(e.target)) return;
      if (editMode === "edit") {
        const nodeEl = target.closest?.("me-tpc");
        if (nodeEl instanceof HTMLElement) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation?.();
          window.setTimeout(() => {
            mindRef.current?.beginEdit?.(nodeEl);
            const inputBox = elRef.current?.querySelector<HTMLElement>("#input-box");
            inputBox?.focus();
            if (inputBox) {
              const range = document.createRange();
              range.selectNodeContents(inputBox);
              const selection = window.getSelection();
              selection?.removeAllRanges();
              selection?.addRange(range);
            }
          }, 0);
        }
        return;
      }
      if (editMode !== "view") return;
      onViewModeEditAttempt?.();
    };

    host.addEventListener("dblclick", handleDblClick, true);
    return () => {
      host.removeEventListener("dblclick", handleDblClick, true);
    };
  }, [editMode, isTouchDevice, onViewModeEditAttempt]);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const host = elRef.current;
    if (!wrapper || !host) return;

    const isInsideMindMap = (target: EventTarget | null) => {
      if (!(target instanceof Node)) return false;
      return wrapper.contains(target) || host.contains(target);
    };

    const preventBrowserSwipeNavigation = (event: WheelEvent) => {
      if (!event.isTrusted) return;
      if (!isInsideMindMap(event.target)) return;
      closeDesktopContextMenu();
      event.preventDefault();
    };

    const preventWindowSwipeNavigation = (event: WheelEvent) => {
      if (!event.isTrusted) return;
      if (!isInsideMindMap(event.target)) return;
      if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
      closeDesktopContextMenu();
      event.preventDefault();
    };

    const wheelListenerOptions = {
      passive: false,
      capture: true,
    } as const;

    wrapper.addEventListener("wheel", preventBrowserSwipeNavigation, {
      passive: false,
      capture: true,
    });
    window.addEventListener(
      "wheel",
      preventWindowSwipeNavigation,
      wheelListenerOptions
    );

    return () => {
      wrapper.removeEventListener(
        "wheel",
        preventBrowserSwipeNavigation,
        wheelListenerOptions
      );
      window.removeEventListener(
        "wheel",
        preventWindowSwipeNavigation,
        wheelListenerOptions
      );
    };
  }, []);

  useEffect(() => {
    const host = elRef.current;
    if (!host) return;

    const isInsideContextMenu = (target: EventTarget | null) =>
      target instanceof Element && Boolean(target.closest(".context-menu"));

    const handlePointerMove = (event: PointerEvent) => {
      if (!event.isTrusted) return;
      if (event.buttons === 0) return;
      if (isInsideContextMenu(event.target)) return;
      closeDesktopContextMenu();
    };

    host.addEventListener("pointermove", handlePointerMove, { passive: true });
    return () => {
      host.removeEventListener("pointermove", handlePointerMove);
    };
  }, []);

  useEffect(() => {
    const handleCopyShortcut = (event: KeyboardEvent) => {
      if (noteEditorOpenRef.current) return;
      const mind = mindRef.current;
      if (!mind) return;
      if (!(event.metaKey || event.ctrlKey) || event.altKey) return;
      if (event.key.toLowerCase() !== "c") return;
      if (isTypingTarget(event.target)) return;
      if (isInsideSourceFindPanel(event.target as Node | null)) return;
      if (hasSourceFindTextSelection()) return;

      const selectedNodes: Array<{ nodeObj?: unknown }> = Array.isArray(
        mind.currentNodes
      )
        ? (mind.currentNodes.filter(Boolean) as Array<{ nodeObj?: unknown }>)
        : [];
      const currentNode = (mind.currentNode ?? null) as
        | { nodeObj?: unknown }
        | null;
      if (selectedNodes.length === 0 && !currentNode) return;

      event.preventDefault();
      event.stopPropagation();

      mind.waitCopy = selectedNodes.length > 0 ? selectedNodes : [currentNode];

      const topics = (
        selectedNodes.length > 0 ? selectedNodes : [currentNode]
      )
        .map((node: { nodeObj?: unknown } | null) => getNodeTopicText(node?.nodeObj))
        .filter(Boolean);

      if (topics.length > 0) {
        void copyToClipboard(topics.join("\n"));
      }
    };

    window.addEventListener("keydown", handleCopyShortcut, true);
    return () => {
      window.removeEventListener("keydown", handleCopyShortcut, true);
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
            mind.scaleMax ?? MIND_SCALE_MAX,
            Math.max(mind.scaleMin ?? MIND_SCALE_MIN, nextScale)
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
      wasSelectedBeforePointerDownRef.current =
        selectedNodeIdRef.current === nodeId;
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
      if (wasSelectedBeforePointerDownRef.current && e.detail === 1) {
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
        wasSelectedBeforePointerDownRef.current = false;
        return;
      }
      wasSelectedBeforePointerDownRef.current = false;
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
    () => ({
      linkBidirectional: t("mobileEdit.linkBidirectional"),
      linkTargetPrompt:
        mindLocale === "ko"
          ? "연결할 대상 노드를 클릭하세요."
          : "Click the target node to connect.",
      copyMarkdown: t("contextMenu.copyMarkdown"),
      copyExpandedMarkdown: t("contextMenu.copyExpandedMarkdown"),
      copySuccess: t("contextMenu.copySuccess"),
      copyFail: t("contextMenu.copyFail"),
    }),
    [mindLocale, t]
  );
  const desktopContextMenuGroups = useMemo(() => {
    const builtInLabels =
      mindLocale === "ko"
        ? {
            addChild: "자식 추가",
            addParent: "부모 추가",
            addSibling: "형제 추가",
            moveUp: "위로 이동",
            moveDown: "아래로 이동",
            focus: "포커스 모드",
            cancelFocus: "포커스 모드 취소",
            link: "연결",
            linkBidirectional: "양방향 연결",
            summary: "요약",
            removeNode: "노드 삭제",
          }
        : {
            addChild: "Add child",
            addParent: "Add parent",
            addSibling: "Add sibling",
            moveUp: "Up",
            moveDown: "Down",
            focus: "Focus",
            cancelFocus: "Cancel Focus",
            link: "Link",
            linkBidirectional: "Bidirectional Link",
            summary: "Summary",
            removeNode: "Delete",
          };

    return [
      [
        richTextText.editContent,
        imageText.addOrReplace,
        imageText.remove,
      ],
      [
        builtInLabels.addChild,
        builtInLabels.addParent,
        builtInLabels.addSibling,
        builtInLabels.moveUp,
        builtInLabels.moveDown,
      ],
      [contextMenuText.copyMarkdown, contextMenuText.copyExpandedMarkdown],
      [
        builtInLabels.focus,
        builtInLabels.cancelFocus,
        builtInLabels.link,
        contextMenuText.linkBidirectional,
        builtInLabels.summary,
      ],
      [builtInLabels.removeNode],
    ];
  }, [
    contextMenuText.copyExpandedMarkdown,
    contextMenuText.copyMarkdown,
    contextMenuText.linkBidirectional,
    imageText.addOrReplace,
    imageText.remove,
    mindLocale,
    richTextText.editContent,
  ]);
  const desktopContextMenuOrder = useMemo(
    () => desktopContextMenuGroups.flat(),
    [desktopContextMenuGroups]
  );
  const desktopContextMenuGroupIndex = useMemo(() => {
    const pairs = desktopContextMenuGroups.flatMap((group, groupIndex) =>
      group.map((label) => [label, groupIndex] as const)
    );
    return new Map(pairs);
  }, [desktopContextMenuGroups]);

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
    let isRootChild = false;
    if (selectedNodeId) {
      const raw =
        mindRef.current?.getData?.() ?? mindRef.current?.getAllData?.();
      const normalized = normalizeMindData(raw);
      const rootChildren = Array.isArray(normalized?.node.children)
        ? normalized.node.children
        : [];
      const selectedVariants = nodeIdVariants(selectedNodeId);
      isRootChild = rootChildren.some((child) =>
        selectedVariants.includes(String(child.id ?? ""))
      );
    }
    onSelectedNodeChange?.(selectedNodeId, { isRootChild });
    const host = elRef.current;
    if (!host) return;
    host.dispatchEvent(new Event("mind-elixir-refresh-decorations"));
  }, [onSelectedNodeChange, selectedNodeId]);

  const {
    noteEditorOpen,
    setNoteEditorOpen,
    noteDraft,
    setNoteDraft,
    handleNoteClick,
    handleNoteDelete,
    handleNoteSave,
  } = useMindElixirNotes({
    selectedNodeIdRef,
    selectedNodeElRef,
    latestMindDataRef,
    noteBadgeSvg: NOTE_BADGE_SVG,
    normalizeMindData,
    findNodeById,
    normalizeNodeId,
    markLatestMindDataDirty: () => {
      latestMindDataDirtyRef.current = true;
    },
    onChangeRef,
    setSelectedNoteText,
  });

  useEffect(() => {
    noteEditorOpenRef.current = noteEditorOpen;
  }, [noteEditorOpen]);

  const handleHighlightClick = (targetNodeId?: string | null) => {
    const result = handleHighlightClickBase(targetNodeId);
    if (!result) return;
    if (editMode === "view") {
      onReadOnlyHighlight?.();
    }
    onChangeRef.current?.(result.op);
    requestAnimationFrame(() => updateSelectedRect(result.selectedId));
  };

  const closeDesktopContextMenu = () => {
    const menu = elRef.current?.querySelector<HTMLElement>(".context-menu");
    const menuList = elRef.current?.querySelector<HTMLElement>(
      ".context-menu .menu-list"
    );
    menu?.style.setProperty("display", "none");
    menuList?.style.setProperty("display", "none");
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

  const mobileEditLabels = useMemo(
    () => ({
      ...mobileEditLabelsFromResponsive,
      editContent: t("mobileEdit.editContent"),
      slideshow: t("slideshow.open"),
      regenerate: regenerateLabel,
      linkBidirectional: t("mobileEdit.linkBidirectional"),
      addOrReplaceImage: t("mobileEdit.addOrReplaceImage"),
      removeImage: t("mobileEdit.removeImage"),
      editGroup:
        locale === "ko" ? "노드 편집" : locale === "fr" ? "Édition" : "Edit",
      structureGroup:
        locale === "ko" ? "구조" : locale === "fr" ? "Structure" : "Structure",
      mediaGroup:
        locale === "ko" ? "미디어" : locale === "fr" ? "Média" : "Media",
      otherGroup:
        locale === "ko" ? "기타" : locale === "fr" ? "Autres" : "Other",
    }),
    [locale, mobileEditLabelsFromResponsive, regenerateLabel, t]
  );
  const selectedNodeHasRichText = (() => {
    if (!selectedNodeId) return false;
    const normalized = normalizeMindData(latestMindDataRef.current);
    const node = normalized?.node
      ? findNodeById(normalized.node, selectedNodeId)
      : null;
    return Boolean(node?.dangerouslySetInnerHTML);
  })();
  const selectedNodeImagePreview = (() => {
    if (!selectedNodeId) return null;
    const normalized = normalizeMindData(latestMindDataRef.current);
    const node = normalized?.node
      ? findNodeById(normalized.node, selectedNodeId)
      : null;
    const image = node?.image;
    if (!image?.url) return null;
    return {
      url: image.url,
      alt: getNodeTopicText(node) || imageText.addOrReplace,
      width: image.width,
      height: image.height,
    } satisfies ImagePreviewState;
  })();

  const setNodeImageValue = (
    nodeId: string,
    image: NonNullable<AnyNode["image"]> | null
  ) => {
    const mind = mindRef.current;
    if (!mind) return false;
    const raw =
      mind.getData?.() ?? mind.getAllData?.() ?? latestMindDataRef.current;
    const normalized = normalizeMindData(raw);
    if (!normalized) return false;

    const next = cloneMindData(normalized.data);
    const nextRoot = normalizeMindData(next)?.node;
    if (!nextRoot) return false;
    const targetNode = findNodeById(nextRoot, nodeId);
    if (!targetNode) return false;

    if (image) {
      targetNode.image = image;
    } else {
      delete targetNode.image;
    }

    latestMindDataRef.current = cloneMindData(next);
    mind.refresh?.(next);
    onChangeRef.current?.({
      name: "updateImage",
      id: normalizeNodeId(nodeId),
      value: image,
    });

    requestAnimationFrame(() => {
      const nextEl =
        getNodeElById(nodeId) ??
        getNodeElById(normalizeNodeId(nodeId)) ??
        selectedNodeElRef.current;
      if (nextEl) {
        const nextId = nextEl.getAttribute("data-nodeid") ?? nodeId;
        applySelectionFromElement(nextEl, nextId);
      } else {
        updateSelectedRect(nodeId);
      }
    });

    return true;
  };

  const setNodeRichTextValue = (
    nodeId: string,
    payload: { topic: string; storedHtml: string | null }
  ) => {
    const mind = mindRef.current;
    if (!mind) return false;
    const raw =
      mind.getData?.() ?? mind.getAllData?.() ?? latestMindDataRef.current;
    const normalized = normalizeMindData(raw);
    if (!normalized) return false;

    const next = cloneMindData(normalized.data);
    const nextRoot = normalizeMindData(next)?.node;
    if (!nextRoot) return false;
    const targetNode = findNodeById(nextRoot, nodeId);
    if (!targetNode) return false;

    targetNode.topic = payload.topic;
    if (payload.storedHtml) {
      targetNode.dangerouslySetInnerHTML = payload.storedHtml;
    } else {
      delete targetNode.dangerouslySetInnerHTML;
    }

    latestMindDataRef.current = cloneMindData(next);
    mind.refresh?.(next);
    onChangeRef.current?.({
      name: "updateRichText",
      id: normalizeNodeId(nodeId),
      topic: payload.topic,
      value: payload.storedHtml,
    });

    requestAnimationFrame(() => {
      const nextEl =
        getNodeElById(nodeId) ??
        getNodeElById(normalizeNodeId(nodeId)) ??
        selectedNodeElRef.current;
      if (nextEl) {
        const nextId = nextEl.getAttribute("data-nodeid") ?? nodeId;
        applySelectionFromElement(nextEl, nextId);
      } else {
        updateSelectedRect(nodeId);
      }
    });

    return true;
  };

  const openRichTextEditor = (targetNodeId?: string | null) => {
    if (editMode !== "edit") {
      onViewModeEditAttempt?.();
      return;
    }

    const nodeId = targetNodeId ?? selectedNodeIdRef.current;
    if (!nodeId) return;

    const normalized =
      normalizeMindData(latestMindDataRef.current) ?? syncLatestMindDataFromMind();
    const node = normalized?.node ? findNodeById(normalized.node, nodeId) : null;
    if (!node) return;

    const initialHtml = node.dangerouslySetInnerHTML
      ? getStoredRichTextInnerHtml(node.dangerouslySetInnerHTML)
      : plainTextToEditorHtml(node.topic);

    setRichTextNodeId(node.id);
    setRichTextPlainTopic(node.topic ?? "");
    setRichTextInitialHtml(initialHtml);
    setRichTextDialogOpen(true);
    setMobileActionNodeId(null);
  };

  const handleSaveRichText = (html: string) => {
    const nodeId = richTextNodeId;
    if (!nodeId) return;

    try {
      const next = sanitizeRichTextInputHtml(html);
      if (
        normalizePlainTextForComparison(next.topic) !==
        normalizePlainTextForComparison(richTextPlainTopic)
      ) {
        throw new Error(richTextText.textLockedError);
      }
      const updated = setNodeRichTextValue(nodeId, {
        topic: richTextPlainTopic,
        storedHtml: next.storedHtml,
      });
      if (!updated) {
        throw new Error(richTextText.saveFailed);
      }
      setRichTextDialogOpen(false);
      toast.success(richTextText.saveSuccess);
    } catch (error) {
      const message =
        error instanceof Error && error.message.trim()
          ? error.message
          : richTextText.saveFailed;
      toast.error(message);
    }
  };

  const triggerNodeImagePicker = (targetNodeId?: string | null) => {
    if (editMode !== "edit") {
      onViewModeEditAttempt?.();
      return;
    }

    const nodeId = targetNodeId ?? selectedNodeIdRef.current;
    if (!nodeId) return;
    if (!mapId) {
      toast.error(imageText.unavailable);
      return;
    }

    pendingImageNodeIdRef.current = nodeId;
    imageInputRef.current?.click();
  };

  const handleRemoveNodeImage = async (targetNodeId?: string | null) => {
    if (editMode !== "edit") {
      onViewModeEditAttempt?.();
      return;
    }

    const nodeId = targetNodeId ?? selectedNodeIdRef.current;
    if (!nodeId) return;
    if (!mapId) {
      toast.error(imageText.unavailable);
      return;
    }

    const normalized = normalizeMindData(latestMindDataRef.current);
    const latestNode = normalized?.node
      ? findNodeById(normalized.node, nodeId)
      : null;
    if (!latestNode?.image?.url) {
      toast.message(imageText.noImage);
      return;
    }

    setImageBusy(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError) {
        throw new Error(userError.message || imageText.loginRequired);
      }
      if (!user) {
        throw new Error(imageText.loginRequired);
      }

      const objectPath = `${user.id}/maps/${mapId}/nodes/${normalizeNodeId(nodeId)}.webp`;
      const { error: removeError } = await supabase.storage
        .from("thumbnails")
        .remove([objectPath]);
      if (removeError) {
        console.warn("[ME] node image remove failed:", removeError);
      }

      const updated = setNodeImageValue(nodeId, null);
      if (!updated) {
        throw new Error(imageText.removeFailed);
      }
      toast.success(imageText.removeSuccess);
      setMobileActionNodeId(null);
    } catch (error) {
      const message =
        error instanceof Error && error.message.trim()
          ? error.message
          : imageText.removeFailed;
      toast.error(message);
    } finally {
      setImageBusy(false);
    }
  };

  const handleNodeImageInputChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const nodeId = pendingImageNodeIdRef.current;
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";
    pendingImageNodeIdRef.current = null;

    if (!nodeId || !file) return;
    if (!mapId) {
      toast.error(imageText.unavailable);
      return;
    }

    try {
      if (!file.type.startsWith("image/")) {
        throw new Error(imageText.invalidType);
      }
      const maxBytes = 5 * 1024 * 1024;
      if (file.size > maxBytes) {
        throw new Error(imageText.tooLarge);
      }

      setImageBusy(true);
      const supabase = createClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError) {
        throw new Error(userError.message || imageText.loginRequired);
      }
      if (!user) {
        throw new Error(imageText.loginRequired);
      }

      const optimized = await resizeToWebp(file, {
        maxWidth: 1024,
        quality: 0.86,
      });
      const dimensions = await readImageDimensions(optimized);
      const displaySize = getImageDisplaySize(
        dimensions.width,
        dimensions.height
      );
      const objectPath = `${user.id}/maps/${mapId}/nodes/${normalizeNodeId(nodeId)}.webp`;

      const { error: uploadError } = await supabase.storage
        .from("thumbnails")
        .upload(objectPath, optimized, {
          upsert: true,
          contentType: "image/webp",
          cacheControl: "3600",
        });
      if (uploadError) {
        throw new Error(uploadError.message || imageText.uploadFailed);
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("thumbnails").getPublicUrl(objectPath);

      const updated = setNodeImageValue(nodeId, {
        url: withCacheBuster(publicUrl),
        width: displaySize.width,
        height: displaySize.height,
        fit: "cover",
      });
      if (!updated) {
        throw new Error(imageText.uploadFailed);
      }
      toast.success(imageText.uploadSuccess);
      setMobileActionNodeId(null);
    } catch (error) {
      const message =
        error instanceof Error && error.message.trim()
          ? error.message
          : imageText.uploadFailed;
      toast.error(message);
    } finally {
      setImageBusy(false);
    }
  };

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
        if (op === "beginEdit" && isTouchDevice) {
          const allowTouchBeginEdit = mind.__allowTouchBeginEditOnce === true;
          mind.__allowTouchBeginEditOnce = false;
          if (!allowTouchBeginEdit) return false;
        }
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
        centerMap(mind, clearSelectionBeforeCenter);
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
        centerMap(mind, clearSelectionBeforeCenter);
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
        centerMap(mind, clearSelectionBeforeCenter);
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
        centerMap(mind, clearSelectionBeforeCenter);
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
        centerMap(mind, clearSelectionBeforeCenter);
      },
      getSnapshot: () => {
        const mind = mindRef.current;
        if (!mind) return null;
        if (latestMindDataDirtyRef.current && latestMindDataRef.current) {
          return cloneMindData(latestMindDataRef.current);
        }
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
      getSelectedSubtree: () => {
        const selectedId = selectedNodeIdRef.current;
        if (!selectedId) return null;
        const normalized =
          normalizeMindData(latestMindDataRef.current) ?? syncLatestMindDataFromMind();
        if (!normalized?.node) return null;
        const node = findNodeById(normalized.node, selectedId);
        return node ? cloneMindData(node) : null;
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
        centerMap(mindRef.current, clearSelectionBeforeCenter);
      },
      undo: () => {
        const mind = mindRef.current;
        if (!mind || typeof mind.undo !== "function") return;
        mind.undo();
      },
      zoomIn: () => {
        const mind = mindRef.current;
        if (!mind || typeof mind.scale !== "function") return;
        const min = mind.scaleMin ?? MIND_SCALE_MIN;
        const max = mind.scaleMax ?? MIND_SCALE_MAX;
        const next = Math.min(max, Math.max(min, (mind.scaleVal ?? 1) + 0.1));
        mind.scale(next);
      },
      zoomOut: () => {
        const mind = mindRef.current;
        if (!mind || typeof mind.scale !== "function") return;
        const next = Math.max(mind.scaleMin ?? MIND_SCALE_MIN, (mind.scaleVal ?? 1) - 0.1);
        mind.scale(next);
      },
      panBy: (dx: number, dy: number) => {
        const mind = mindRef.current;
        if (!mind || typeof mind.move !== "function") return;
        mind.move(dx, dy);
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
      getSelectedNodeSourceAnchors: () => {
        const selectedId = selectedNodeIdRef.current;
        if (!selectedId) return null;
        const raw =
          mindRef.current?.getData?.() ?? mindRef.current?.getAllData?.();
        const normalized = normalizeMindData(raw);
        if (!normalized) return null;

        const node = findNodeById(normalized.node, selectedId);
        if (!node || typeof node.topic !== "string") return null;

        const anchorText = Array.isArray(node.meta?.anchorText)
          ? node.meta!.anchorText
              .map((item) => String(item).trim())
              .filter((item) => item.length > 0)
          : [];
        const anchorKeywords = Array.isArray(node.meta?.anchorKeywords)
          ? node.meta!.anchorKeywords
              .map((item) => String(item).trim())
              .filter((item) => item.length > 0)
          : [];

        return {
          nodeId: node.id,
          topic: node.topic,
          anchorText,
          anchorKeywords,
        };
      },
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
    let handleReorderContextMenu: (() => void) | null = null;

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
            mind.scaleMax ?? MIND_SCALE_MAX,
            Math.max(mind.scaleMin ?? MIND_SCALE_MIN, nextScale)
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

      function startBidirectionalLink() {
        const from = mind.currentNode as
          | (HTMLElement & { nodeObj?: AnyNode })
          | null
          | undefined;
        if (!from?.nodeObj?.id || !mind.map) return;
        toast.message(contextMenuText.linkTargetPrompt);
        mind.map.addEventListener(
          "click",
          (event: MouseEvent) => {
            event.preventDefault();
            const target = event.target as HTMLElement | null;
            const to = target?.closest?.("me-tpc") as
              | (HTMLElement & { nodeObj?: AnyNode })
              | null;
            if (!to || to === from) return;
            mind.createArrow?.(from, to, { bidirectional: true });
          },
          { once: true }
        );
      }

      const mind = new MindElixir({
        el: elRef.current,
        direction: MindElixir.RIGHT,
        toolBar: showToolbar,
        keypress: true,
        draggable: true,
        editable: true,
        contextMenu: {
          focus: true,
          link: false,
          extend: [
            ...(editMode === "edit"
              ? [
                  {
                    name: contextMenuText.linkBidirectional,
                    onclick: startBidirectionalLink,
                  },
                ]
              : []),
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
            ...(editMode === "edit"
              ? [
                  {
                    name: richTextText.editContent,
                    onclick: () => {
                      const current = mind.currentNode?.nodeObj as
                        | AnyNode
                        | undefined;
                      if (!current?.id) return;
                      openRichTextEditor(current.id);
                    },
                  },
                  {
                    name: imageText.addOrReplace,
                    onclick: () => {
                      const current = mind.currentNode?.nodeObj as
                        | AnyNode
                        | undefined;
                      if (!current?.id) return;
                      triggerNodeImagePicker(current.id);
                    },
                  },
                  {
                    name: imageText.remove,
                    onclick: () => {
                      const current = mind.currentNode?.nodeObj as
                        | AnyNode
                        | undefined;
                      if (!current?.id) return;
                      void handleRemoveNodeImage(current.id);
                    },
                  },
                ]
              : []),
          ],
        },
        locale: mindLocale,
        scaleSensitivity: zoomSensitivity,
        scaleMax: MIND_SCALE_MAX,
        scaleMin: MIND_SCALE_MIN,
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

      const resolveActiveTopicEl = () => {
        const selectedId = selectedNodeIdRef.current;
        return (
          resolveTopicEl(mind.currentNode) ??
          resolveTopicEl(selectedNodeElRef.current) ??
          (selectedId ? resolveTopicEl(getNodeElById(selectedId)) : null)
        );
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
            resolveActiveTopicEl() ??
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
        const notifyExpandNodeChange = () => {
          requestAnimationFrame(() => {
            syncLatestMindDataFromMind();
            scheduleMiniMapDraw();
            onChangeRef.current?.({ name: "expandNode" });
          });
        };

        mind.expandNode = (target?: any, expanded?: boolean) => {
          const resolvedTarget =
            resolveTopicEl(target) ??
            resolveActiveTopicEl() ??
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
            notifyExpandNodeChange();
            return;
          }

          const result = originalExpandNode(resolvedTarget, expanded);
          notifyExpandNodeChange();
          return result;
        };
      }

      const originalInsertSibling = mind.insertSibling?.bind(mind);
      if (typeof originalInsertSibling === "function") {
        mind.insertSibling = (type: "before" | "after", target?: any, ...args: any[]) => {
          const resolvedTarget =
            resolveTopicEl(target) ??
            resolveActiveTopicEl() ??
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
            const fallback = resolveActiveTopicEl();
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

      const reorderDesktopContextMenu = () => {
        const menuList = elRef.current?.querySelector<HTMLUListElement>(
          ".context-menu .menu-list"
        );
        if (!menuList) return;
        const menu = menuList.closest<HTMLElement>(".context-menu");
        menu?.style.removeProperty("display");
        menuList.style.removeProperty("display");

        const labelPriority = new Map(
          desktopContextMenuOrder.map((label, index) => [label, index] as const)
        );
        const items = Array.from(menuList.querySelectorAll<HTMLLIElement>("li"));
        items
          .sort((a, b) => {
            const aLabel =
              a.querySelector("span")?.textContent?.trim() ??
              a.textContent?.trim() ??
              "";
            const bLabel =
              b.querySelector("span")?.textContent?.trim() ??
              b.textContent?.trim() ??
              "";
            const aPriority =
              labelPriority.get(aLabel) ?? Number.MAX_SAFE_INTEGER;
            const bPriority =
              labelPriority.get(bLabel) ?? Number.MAX_SAFE_INTEGER;
            if (aPriority === bPriority) return 0;
            return aPriority - bPriority;
          })
          .forEach((item) => {
            menuList.appendChild(item);
          });

        let previousVisibleGroupIndex: number | null = null;
        items.forEach((item) => {
          item.removeAttribute("data-menu-group-start");
          item.removeAttribute("data-menu-column-start");
          const label =
            item.querySelector("span")?.textContent?.trim() ??
            item.textContent?.trim() ??
            "";
          const groupIndex =
            desktopContextMenuGroupIndex.get(label) ?? Number.MAX_SAFE_INTEGER;
          const isHidden = window.getComputedStyle(item).display === "none";
          if (isHidden) return;
          if (
            previousVisibleGroupIndex !== null &&
            previousVisibleGroupIndex !== groupIndex
          ) {
            item.setAttribute("data-menu-group-start", "true");
            item.setAttribute("data-menu-column-start", "true");
          }
          previousVisibleGroupIndex = groupIndex;
        });

        const selectedId = selectedNodeIdRef.current;
        const selectedEl = selectedId ? getNodeElById(selectedId) : null;
        if (!menu || !selectedEl) return;

        requestAnimationFrame(() => {
          const nodeRect = selectedEl.getBoundingClientRect();
          const menuRect = menuList.getBoundingClientRect();
          const gutter = 10;
          const viewportWidth = window.innerWidth;
          const viewportHeight = window.innerHeight;
          const menuWidth = menuRect.width || 292;
          const menuHeight = menuRect.height || 340;
          const openAbove = nodeRect.bottom + gutter + menuHeight > viewportHeight;
          const left = Math.min(
            Math.max(gutter, nodeRect.right + 8),
            Math.max(gutter, viewportWidth - menuWidth - gutter)
          );
          const top = openAbove
            ? Math.max(gutter, nodeRect.top - menuHeight - 8)
            : Math.min(
                nodeRect.bottom + 8,
                Math.max(gutter, viewportHeight - menuHeight - gutter)
              );

          menuList.style.left = `${left}px`;
          menuList.style.top = `${top}px`;
          menuList.style.right = "auto";
          menuList.style.bottom = "auto";
        });
      };
      const formatTimestamp = (seconds: number): string => {
        const total = Math.max(0, Math.floor(seconds));
        const hh = Math.floor(total / 3600);
        const mm = Math.floor((total % 3600) / 60);
        const ss = total % 60;
        if (hh > 0) return t("timestamp.hms", { h: hh, m: mm, s: ss });
        if (mm > 0) return t("timestamp.ms", { m: mm, s: ss });
        return t("timestamp.s", { s: ss });
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
            if (selectedNodeIdRef.current === nodeId) {
              el.setAttribute("data-note-visible", "true");
            } else {
              el.removeAttribute("data-note-visible");
            }
            let dot = el.querySelector<HTMLElement>(".me-note-dot");
            if (!dot) {
              dot = document.createElement("span");
              dot.className = "me-note-dot";
              dot.setAttribute("data-note-dot", "true");
              dot.innerHTML = NOTE_BADGE_SVG;
              el.appendChild(dot);
            }
            dot.setAttribute("data-nodeid", el.dataset.nodeid ?? "");
            let preview = el.querySelector<HTMLElement>(".me-note-preview");
            if (!preview) {
              preview = document.createElement("span");
              preview.className = "me-note-preview";
              preview.setAttribute("data-note-preview", "true");
              el.appendChild(preview);
            }
            preview.textContent = noteText;
          } else {
            el.removeAttribute("data-note");
            el.removeAttribute("data-note-visible");
            const dot = el.querySelector<HTMLElement>(".me-note-dot");
            if (dot) dot.remove();
            const preview = el.querySelector<HTMLElement>(".me-note-preview");
            if (preview) preview.remove();
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

      const originalScrollIntoView = mind.scrollIntoView?.bind(mind);
      if (typeof originalScrollIntoView === "function") {
        mind.scrollIntoView = (target?: any) => {
          const topicEl = resolveTopicEl(target);
          const container = mind.container as HTMLElement | null | undefined;
          if (!topicEl || !container) {
            return originalScrollIntoView(target);
          }

          const nodeRect = topicEl.getBoundingClientRect();
          const containerRect = container.getBoundingClientRect();
          const padding = 56;
          let dx = 0;
          let dy = 0;

          if (nodeRect.left < containerRect.left + padding) {
            dx = containerRect.left + padding - nodeRect.left;
          } else if (nodeRect.right > containerRect.right - padding) {
            dx = containerRect.right - padding - nodeRect.right;
          }

          if (nodeRect.top < containerRect.top + padding) {
            dy = containerRect.top + padding - nodeRect.top;
          } else if (nodeRect.bottom > containerRect.bottom - padding) {
            dy = containerRect.bottom - padding - nodeRect.bottom;
          }

          if (dx !== 0 || dy !== 0) {
            mind.move?.(dx, dy, true);
          }
        };
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

      handleReorderContextMenu = () => {
        queueMicrotask(() => {
          reorderDesktopContextMenu();
        });
      };
      mind.bus?.addListener?.("showContextMenu", handleReorderContextMenu);

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
        const createdNodeId =
          (op?.name === "addChild" ||
            op?.name === "insertSibling" ||
            op?.name === "insertParent") &&
          typeof op?.obj?.id === "string"
            ? op.obj.id
            : null;
        if (createdNodeId) {
          const createdNodeEl = resolveTopicEl({ id: createdNodeId });
          selectedNodeIdRef.current = createdNodeId;
          selectedNodeElRef.current = createdNodeEl;
          setSelectedNodeId(createdNodeId);
          setSelectedNoteText(null);
          requestAnimationFrame(() => updateSelectedRect(createdNodeId));
        }

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
        const inputBox = elRef.current?.querySelector<HTMLElement>("#input-box");
        inputBox?.addEventListener(
          "blur",
          () => {
            requestAnimationFrame(clearEditingNodeState);
          },
          { once: true }
        );
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
        if (mind?.bus?.removeListener && handleReorderContextMenu) {
          mind.bus.removeListener("showContextMenu", handleReorderContextMenu);
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
    mapId,
    zoomSensitivity,
    dragButton,
    fitOnInit,
    preserveViewState,
    openMenuOnClick,
    showToolbar,
    initialData,
    mindLocale,
    contextMenuText,
    desktopContextMenuGroupIndex,
    desktopContextMenuOrder,
    editMode,
    imageText,
    richTextText,
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

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const handleTouchMove = (event: TouchEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      if (
        target.closest(
          'button, input, textarea, select, a, [role="dialog"], [data-allow-touch-scroll="true"]'
        )
      ) {
        return;
      }

      event.preventDefault();
    };

    wrapper.addEventListener("touchmove", handleTouchMove, { passive: false });
    return () => {
      wrapper.removeEventListener("touchmove", handleTouchMove);
    };
  }, []);

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
      style={{ overscrollBehavior: "none", touchAction: "none" }}
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
        .${VIEW_MODE_CLASS} .context-menu .menu-list #cm-remove,
        .${VIEW_MODE_CLASS} .context-menu .menu-list #cm-up,
        .${VIEW_MODE_CLASS} .context-menu .menu-list #cm-down,
        .${VIEW_MODE_CLASS} .context-menu .menu-list #cm-edit,
        .${VIEW_MODE_CLASS} .context-menu .menu-list #cm-cut,
        .${VIEW_MODE_CLASS} .context-menu .menu-list #cm-paste,
        .${VIEW_MODE_CLASS} .context-menu .menu-list #cm-link,
        .${VIEW_MODE_CLASS} .context-menu .menu-list #cm-link-bidirectional,
        .${VIEW_MODE_CLASS} .context-menu .menu-list #cm-summary {
          display: none;
        }
        .context-menu .menu-list {
          display: grid !important;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 0.25rem;
          width: min(292px, calc(100vw - 24px));
          max-height: min(340px, calc(100vh - 24px));
          padding: 0.35rem;
          background: rgba(255, 255, 255, 0.98);
          border: 1px solid rgba(148, 163, 184, 0.24);
          border-radius: 1rem;
          overflow-y: auto !important;
          overscroll-behavior: contain;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: thin;
          scrollbar-color: rgba(148, 163, 184, 0.72) transparent;
          box-shadow:
            inset 0 -26px 20px -24px rgba(15, 23, 42, 0.55),
            inset 0 18px 16px -22px rgba(15, 23, 42, 0.28);
        }
        .dark .context-menu .menu-list {
          background: rgba(15, 23, 42, 0.98);
          border-color: rgba(148, 163, 184, 0.22);
          box-shadow:
            inset 0 -26px 20px -24px rgba(226, 232, 240, 0.48),
            inset 0 18px 16px -22px rgba(226, 232, 240, 0.22);
        }
        .context-menu .menu-list li {
          display: flex !important;
          min-height: 32px;
          min-width: 0 !important;
          align-items: center;
          border-radius: 0.65rem !important;
          padding: 0.35rem 0.45rem !important;
          white-space: normal !important;
          line-height: 1.2 !important;
          break-inside: avoid;
          font-size: 12px !important;
        }
        .context-menu .menu-list li span,
        .context-menu .menu-list li a,
        .context-menu .menu-list li button {
          min-width: 0;
          white-space: normal !important;
          line-height: 1.2 !important;
        }
        .context-menu .menu-list li[data-menu-group-start="true"] {
          margin-top: 0.25rem;
          position: relative;
        }
        .context-menu .menu-list li[data-menu-group-start="true"]::before {
          content: "";
          position: absolute;
          left: 0;
          right: 0;
          top: -0.25rem;
          height: 1px;
          background: rgba(148, 163, 184, 0.28);
          grid-column: 1 / -1;
        }
        .context-menu .menu-list li[data-menu-column-start="true"] {
          grid-column-start: 1;
        }
        .dark .context-menu .menu-list li[data-menu-group-start="true"] {
          border-top-color: rgba(148, 163, 184, 0.22);
        }
        .dark .context-menu .menu-list li[data-menu-group-start="true"]::before {
          background: rgba(148, 163, 184, 0.22);
        }
        me-tpc {
          position: relative;
          overflow: visible;
        }
        me-tpc.selected {
          outline: none !important;
          outline-offset: 0 !important;
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
        me-root me-tpc .me-rich-text,
        me-tpc.root .me-rich-text,
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
        me-tpc[data-editing="mask"] .me-note-preview,
        me-tpc[data-editing="mask"] .me-ts-badge {
          opacity: 0 !important;
        }
        me-tpc[data-editing] .me-note-preview {
          opacity: 0 !important;
        }
        @media (max-width: 639px) {
          me-parent me-tpc:not(.root) {
            max-width: 21em !important;
          }
          me-parent me-tpc:not(.root) .text,
          me-parent me-tpc:not(.root) .me-rich-text,
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
        .me-rich-text {
          display: block;
          width: 100%;
          white-space: normal !important;
          overflow-wrap: anywhere !important;
          word-break: break-word !important;
          text-wrap: wrap !important;
          line-height: inherit !important;
        }
        .me-rich-text strong {
          font-weight: 700;
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
          z-index: 620;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          box-shadow:
            0 0 0 2px rgba(255, 255, 255, 0.95),
            0 6px 12px rgba(37, 99, 235, 0.35);
          cursor: pointer;
          pointer-events: none;
          opacity: 0;
          visibility: hidden;
          transition: opacity 140ms ease;
        }
        .me-note-dot svg,
        .me-note-dot svg * {
          width: 10px;
          height: 10px;
          pointer-events: none;
        }
        .me-note-preview {
          position: absolute;
          left: calc(100% + 10px);
          top: 50%;
          z-index: 620;
          display: block;
          min-width: 240px;
          max-width: min(380px, calc(100vw - 96px));
          padding: 8px 10px;
          border-radius: 10px;
          border: 1px solid rgba(148, 163, 184, 0.42);
          background: rgba(255, 255, 255, 0.98);
          color: #334155;
          font-size: 11px;
          font-weight: 500;
          line-height: 1.45;
          white-space: pre-wrap;
          overflow-wrap: anywhere;
          word-break: break-word;
          box-shadow:
            0 10px 26px rgba(15, 23, 42, 0.12),
            0 0 0 1px rgba(255, 255, 255, 0.74);
          transform: translateY(-50%);
          pointer-events: none;
          opacity: 0;
          visibility: hidden;
          transition: opacity 140ms ease;
        }
        me-tpc[data-note="true"] .me-note-dot,
        me-tpc[data-note-visible="true"] .me-note-preview {
          opacity: 1;
          visibility: visible;
        }
        me-wrapper:has(me-tpc[data-note-visible="true"]) {
          position: relative;
          z-index: 610 !important;
        }
        me-parent:has(> me-tpc[data-note-visible="true"]),
        me-root:has(me-tpc[data-note-visible="true"]) {
          z-index: 610 !important;
        }
        me-tpc[data-note-visible="true"] {
          z-index: 611 !important;
        }
        me-tpc[data-note="true"] .me-note-dot {
          pointer-events: auto;
        }
        .${DEFAULT_DARK_CANVAS_CLASS} .me-note-preview {
          border-color: rgba(148, 163, 184, 0.22);
          background: rgba(15, 23, 42, 0.97);
          color: rgba(226, 232, 240, 0.92);
          box-shadow:
            0 14px 30px rgba(2, 6, 23, 0.34),
            0 0 0 1px rgba(148, 163, 184, 0.08);
        }
        @media (max-width: 639px) {
          .me-note-preview {
            left: calc(100% + 8px);
            min-width: 180px;
            max-width: min(72vw, 320px);
            padding: 6px 8px;
            font-size: 10px;
          }
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
          box-shadow: none !important;
        }
        me-tpc[data-highlight="gold"] .text {
          background: rgba(253, 224, 71, 0.78);
          border-radius: 0.18em;
          box-decoration-break: clone;
          -webkit-box-decoration-break: clone;
          padding: 0.02em 0.16em;
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
        disableEditContent={!selectedNodeId}
        disableRegenerate={!canRegenerateSelectedNode}
        disableRename={!selectedNodeId || selectedNodeHasRichText}
        disableImageActions={imageBusy || !mapId}
        regenerating={Boolean(
          selectedNodeId && regeneratingNodeId === selectedNodeId
        )}
        onCloseMobileActions={() => setMobileActionNodeId(null)}
        onAddChild={() => void runMobileNodeAction("addChild")}
        onAddParent={() => void runMobileNodeAction("addParent")}
        onAddSibling={() => void runMobileNodeAction("addSibling")}
        onRename={() => void runMobileNodeAction("rename")}
        onEditContent={() => openRichTextEditor()}
        onRegenerate={() => onRegenerateSelectedNode?.()}
        onLinkBidirectional={() => void runMobileNodeAction("linkBidirectional")}
        onAddOrReplaceImage={() => triggerNodeImagePicker()}
        onRemoveImage={() => void handleRemoveNodeImage()}
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
        onMiniMapCenter={() => centerMap(mindRef.current, clearSelectionBeforeCenter)}
        onMiniMapZoomIn={() => {
          const mind = mindRef.current;
          if (!mind || typeof mind.scale !== "function") return;
          const min = mind.scaleMin ?? MIND_SCALE_MIN;
          const max = mind.scaleMax ?? MIND_SCALE_MAX;
          const next = Math.min(max, Math.max(min, (mind.scaleVal ?? 1) + 0.1));
          mind.scale(next);
        }}
        onMiniMapZoomOut={() => {
          const mind = mindRef.current;
          if (!mind || typeof mind.scale !== "function") return;
          const next = Math.max(mind.scaleMin ?? MIND_SCALE_MIN, (mind.scaleVal ?? 1) - 0.1);
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
          centerMap(mind, clearSelectionBeforeCenter);
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
          centerMap(mind, clearSelectionBeforeCenter);
        }}
        isFocusMode={isFocusMode}
        selectedRect={selectedRect}
        hoverActionWrapClass={hoverActionWrapClass}
        hoverActionButtonClass={hoverActionButtonClass}
        hoverActionIconClass={hoverActionIconClass}
        onNoteClick={handleNoteClick}
        showImagePreviewAction={Boolean(selectedNodeImagePreview)}
        imagePreviewLabel={imageText.preview}
        onImagePreviewClick={() => {
          if (selectedNodeImagePreview) {
            setImagePreview(selectedNodeImagePreview);
          }
        }}
        onSlideshowClick={() => onOpenSlideshow?.()}
        regenerateLabel={regenerateLabel}
        regenerateLoadingLabel={regenerateLoadingLabel}
        canRegenerate={canRegenerateSelectedNode}
        isRegenerating={Boolean(
          selectedNodeId && regeneratingNodeId === selectedNodeId
        )}
        onRegenerateClick={() => onRegenerateSelectedNode?.()}
        onHighlightClick={() => handleHighlightClick(selectedNodeIdRef.current)}
        showAnnotationAction={showAnnotationAction}
        showHighlightAction={showHighlightAction}
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
        noteEditorOpen={noteEditorOpen}
        onNoteEditorOpenChange={setNoteEditorOpen}
        noteDraft={noteDraft}
        onNoteDraftChange={setNoteDraft}
        onDeleteNote={handleNoteDelete}
        onSaveNote={handleNoteSave}
        annotationDialogTitle={annotationDialogTitle}
        annotationPlaceholder={annotationPlaceholder}
        annotationDeleteLabel={annotationDeleteLabel}
        cancelLabel={cancelLabel}
        saveLabel={saveLabel}
        loading={loading}
        ready={ready}
      />
      <NodeRichTextDialog
        open={richTextDialogOpen}
        onOpenChange={(open) => {
          setRichTextDialogOpen(open);
          if (!open) {
            setRichTextNodeId(null);
          }
        }}
        title={richTextText.title}
        description={richTextText.description}
        plainTopicLabel={richTextText.plainTopicLabel}
        plainTopicValue={richTextPlainTopic}
        initialHtml={richTextInitialHtml}
        colors={richTextText.colors}
        colorLabel={richTextText.color}
        boldLabel={richTextText.bold}
        clearColorLabel={richTextText.clearColor}
        resetLabel={richTextText.reset}
        cancelLabel={cancelLabel}
        saveLabel={saveLabel}
        onSave={handleSaveRichText}
      />
      {imagePreview ? (
        <div
          className="fixed inset-0 z-[430] flex items-center justify-center bg-slate-950/82 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={imagePreview.alt}
          onClick={() => setImagePreview(null)}
        >
          <button
            type="button"
            className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white shadow-lg transition hover:bg-white/18"
            onClick={() => setImagePreview(null)}
            aria-label={cancelLabel}
            title={cancelLabel}
          >
            <X className="h-5 w-5" />
          </button>
          <div
            className="max-h-[88vh] max-w-[94vw]"
            onClick={(event) => event.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imagePreview.url}
              alt={imagePreview.alt}
              className="h-auto max-h-[88vh] w-auto max-w-[94vw] rounded-xl object-contain shadow-[0_28px_90px_-34px_rgba(0,0,0,0.95)]"
            />
          </div>
        </div>
      ) : null}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleNodeImageInputChange}
      />
    </div>
  );
});

export default ClientMindElixir;
