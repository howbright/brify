"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useRef } from "react";
import { toast } from "sonner";

type AnyNode = {
  id: string;
  topic?: string;
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

type ContextMenuText = {
  copyMarkdown: string;
  copyExpandedMarkdown: string;
  copySuccess: string;
  copyFail: string;
};

function normalizeNodeId(id: string) {
  return id.startsWith("me") ? id.slice(2) : id;
}
const UNSELECT_GRACE_MS = 320;

type UseMindElixirCoreParams = {
  mounted: boolean;
  elRef: React.RefObject<HTMLDivElement | null>;
  mindRef: React.RefObject<any>;
  latestMindDataRef: React.RefObject<any>;
  defaultThemeRef: React.RefObject<{ light: any; dark: any } | null>;
  lastTransformRef: React.RefObject<string | null>;
  lastScaleRef: React.RefObject<number | null>;
  currentLevelRef: React.RefObject<number>;
  isDecoratingRef: React.RefObject<boolean>;
  onChangeRef: React.RefObject<((op: any) => void) | null>;
  selectedNodeIdRef: React.RefObject<string | null>;
  selectedNodeElRef: React.RefObject<HTMLElement | null>;
  lastClickedNodeRef: React.RefObject<{ id: string | null; at: number }>;
  setSelectedNodeId: React.Dispatch<React.SetStateAction<string | null>>;
  setSelectedRect: React.Dispatch<React.SetStateAction<DOMRect | null>>;
  setSelectedNoteText: React.Dispatch<React.SetStateAction<string | null>>;
  setIsFocusMode: React.Dispatch<React.SetStateAction<boolean>>;
  setReady: React.Dispatch<React.SetStateAction<boolean>>;
  normalizeMindData: (raw: any) => { data: any; node: any } | null;
  cloneMindData: <T>(data: T) => T;
  resolveThemeObj: (
    defaults: { light: unknown; dark: unknown } | null,
    modeValue: "light" | "dark"
  ) => unknown;
  nodeToMarkdown: (node: any, depth?: number, onlyExpanded?: boolean) => string;
  copyToClipboard: (text: string) => Promise<boolean>;
  applyEditMode: (mind: any, enabled: boolean) => void;
  getMaxExpandedDepth: (node: any, depth?: number) => number;
  parseScale: (transform: string | null) => number | null;
  findNodeById: (node: any, id: string) => any | null;
  clearAutoBranchColors: (
    node: any,
    palette: string[] | null
  ) => void;
  scheduleMiniMapDraw: () => void;
  openNodeContextMenu: (nodeId?: string | null, anchorEl?: HTMLElement | null) => void;
  syncLatestMindDataFromMind: () => { data: any; node: AnyNode } | null;
  updateSelectedRect: (id: string) => void;
  initialData: any;
  effectiveMode: "light" | "dark";
  zoomSensitivity: number;
  dragButton: 0 | 2;
  fitOnInit: boolean;
  preserveViewState: boolean;
  openMenuOnClick: boolean;
  showToolbar: boolean;
  mindLocale: string;
  contextMenuText: ContextMenuText;
  editMode: "view" | "edit";
  noteBadgeSvg: string;
  showTimestampsRef: React.RefObject<boolean>;
  manualSelectionPriorityMs: number;
};

export function useMindElixirCore({
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
  noteBadgeSvg,
  showTimestampsRef,
  manualSelectionPriorityMs,
}: UseMindElixirCoreParams) {
  const initTokenRef = useRef(0);
  const debugEndpointBlockedRef = useRef(false);
  const postAgentLog = (payload: Record<string, unknown>) => {
    if (typeof window !== "undefined") {
      const host = window.location.hostname;
      const isLocalHost = host === "localhost" || host === "127.0.0.1";
      if (!isLocalHost) {
        debugEndpointBlockedRef.current = true;
      }
      const bag = (
        window as typeof window & { __ME_DEBUG_EVENTS?: Array<Record<string, unknown>> }
      ).__ME_DEBUG_EVENTS;
      if (Array.isArray(bag)) {
        bag.push(payload);
      } else {
        (
          window as typeof window & {
            __ME_DEBUG_EVENTS?: Array<Record<string, unknown>>;
          }
        ).__ME_DEBUG_EVENTS = [payload];
      }
    }
    if (debugEndpointBlockedRef.current) {
      console.warn("[ME_DEBUG]", payload);
      return;
    }
    fetch("http://127.0.0.1:7243/ingest/b44aa14f-cb62-41f5-bd7a-02a25686b9d0", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch((error) => {
      debugEndpointBlockedRef.current = true;
      console.warn("[ME_DEBUG_BLOCKED]", {
        ...payload,
        errorMessage: error instanceof Error ? error.message : String(error),
      });
    });
  };

  useEffect(() => {
    if (!mounted) return;
    if (!elRef.current) return;
    const hostEl = elRef.current;

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
      if (!hostEl) return;

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
        el: hostEl,
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
                toast.message(ok ? contextMenuText.copySuccess : contextMenuText.copyFail);
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
                toast.message(ok ? contextMenuText.copySuccess : contextMenuText.copyFail);
              },
            },
          ],
        },
        locale: mindLocale as any,
        scaleSensitivity: zoomSensitivity,
        mouseSelectionButton: dragButton,
        handleWheel,
        theme: resolvedThemeObj as any,
      }) as PatchedMindInstance;

      const observerOptions = {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["data-nodeid"],
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
        const isKo = mindLocale === "ko";
        if (isKo) {
          const totalMinutes = Math.floor(total / 60);
          return `${totalMinutes}분 ${ss}초`;
        }
        if (hh > 0) {
          return `${hh}h ${mm}m ${ss}s`;
        }
        if (mm > 0) {
          return `${mm}m ${ss}s`;
        }
        return `${ss}s`;
      };
      const syncNodeDecorations = () => {
        const host = elRef.current;
        if (!host) return;
        if (isDecoratingRef.current) return;
        isDecoratingRef.current = true;
        if (mutationObserver) mutationObserver.disconnect();
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
              dot.innerHTML = noteBadgeSvg;
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
      hostEl.addEventListener(
        "mind-elixir-refresh-decorations",
        handleRefreshDecorations
      );
      if (typeof MutationObserver !== "undefined") {
        mutationObserver = new MutationObserver(() => {
          syncNodeDecorations();
        });
        mutationObserver.observe(hostEl, observerOptions);
      }

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
          manualSelectionPriorityMs
        ) {
          return;
        }
        const last = Array.isArray(nodes) ? nodes[nodes.length - 1] : null;
        const id = last?.id;
        if (!id) return;
        const normalizedId = normalizeNodeId(String(id));
        selectedNodeIdRef.current = normalizedId;
        setSelectedNodeId(normalizedId);
        try {
          selectedNodeElRef.current =
            mind.findEle?.(normalizedId) ||
            mind.findEle?.(`me${normalizedId}`) ||
            elRef.current?.querySelector<HTMLElement>(
              `me-tpc[data-nodeid="${normalizedId}"]`
            ) ||
            elRef.current?.querySelector<HTMLElement>(
              `me-tpc[data-nodeid="me${normalizedId}"]`
            ) ||
            elRef.current?.querySelector<HTMLElement>(`[data-nodeid="${id}"]`) ||
            null;
        } catch {
          selectedNodeElRef.current = null;
        }
        requestAnimationFrame(() => updateSelectedRect(normalizedId));
      });

      mind.bus?.addListener?.("unselectNodes", () => {
        const elapsedMs = Date.now() - lastClickedNodeRef.current.at;
        // #region agent log
        postAgentLog({
          runId: "core-selection",
          hypothesisId: "H2",
          location: "components/useMindElixirCore.ts:unselectNodes",
          message: "bus.unselectNodes fired",
          data: {
            elapsedMs,
            selectedNodeId: selectedNodeIdRef.current,
          },
          timestamp: Date.now(),
        });
        // #endregion
        if (elapsedMs < UNSELECT_GRACE_MS && selectedNodeIdRef.current) {
          return;
        }
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
        });

        if (op?.name === "selectNode") {
          if (
            Date.now() - lastClickedNodeRef.current.at <
            manualSelectionPriorityMs
          ) {
            return;
          }
          const id = op?.data?.id ?? op?.obj?.id ?? op?.id;
          if (id) {
            const normalizedId = normalizeNodeId(String(id));
            selectedNodeIdRef.current = normalizedId;
            setSelectedNodeId(normalizedId);
            updateSelectedRect(normalizedId);
          }
        }

        if (
          op?.name === "unselectNodes" ||
          op?.name === "clearSelection" ||
          op?.name === "removeNodes"
        ) {
          const elapsedMs = Date.now() - lastClickedNodeRef.current.at;
          // #region agent log
          postAgentLog({
            runId: "core-selection",
            hypothesisId: "H2",
            location: "components/useMindElixirCore.ts:operationUnselectLike",
            message: "operation unselect-like fired",
            data: {
              opName: op?.name ?? "unknown",
              elapsedMs,
              selectedNodeId: selectedNodeIdRef.current,
            },
            timestamp: Date.now(),
          });
          // #endregion
          if (elapsedMs < UNSELECT_GRACE_MS && selectedNodeIdRef.current) {
            return;
          }
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
      try {
        if (handleRefreshDecorations) {
          hostEl.removeEventListener(
            "mind-elixir-refresh-decorations",
            handleRefreshDecorations
          );
        }
      } catch {}
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
  // Intentional: this hook owns the entire MindElixir lifecycle and depends on
  // many ref-backed helpers. Rebinding the init/destroy effect on every helper
  // identity change would be riskier than keeping the mount/input contract stable.
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
  }, [effectiveMode, resolveThemeObj, mindRef, defaultThemeRef, clearAutoBranchColors]);
}
