"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useCallback, useEffect, useRef, useState } from "react";
import { logMindElixirDebug } from "@/components/mindElixirDebugLogger";

type AnyNode = {
  id: string;
  topic: string;
  root?: boolean;
  parent?: { id?: string } | null;
  highlight?: { variant?: string } | null;
  note?: string | null;
  children?: AnyNode[];
};

function normalizeNodeId(id: string) {
  return id.startsWith("me") ? id.slice(2) : id;
}

function nodeIdCandidates(id: string) {
  const normalized = normalizeNodeId(id);
  return [normalized, `me${normalized}`];
}

type UseMindElixirFocusSearchParams = {
  wrapperRef: React.RefObject<HTMLDivElement | null>;
  elRef: React.RefObject<HTMLDivElement | null>;
  mindRef: React.RefObject<any>;
  latestMindDataRef: React.RefObject<any>;
  onChangeRef: React.RefObject<((op: any) => void) | null>;
  focusInsetLeftRef: React.RefObject<number>;
  syncLatestMindDataFromMind: () => { data: any; node: AnyNode } | null;
  setMobileActionNodeId: React.Dispatch<React.SetStateAction<string | null>>;
  normalizeMindData: (raw: any) => { data: any; node: AnyNode } | null;
  cloneMindData: <T>(data: T) => T;
  findNodeById: (node: AnyNode, id: string) => AnyNode | null;
  findNodePathByRef: (
    node: AnyNode | null | undefined,
    target: AnyNode,
    path?: number[]
  ) => number[] | null;
  getNodeByPath: (
    node: AnyNode | null | undefined,
    path: number[]
  ) => AnyNode | null;
  expandPathToId: (
    node: AnyNode | null | undefined,
    targetId: string
  ) => boolean;
  escapeAttr: (value: string) => string;
  highlightVariant?: string;
};

export function useMindElixirFocusSearch({
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
  highlightVariant = "gold",
}: UseMindElixirFocusSearchParams) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedRect, setSelectedRect] = useState<DOMRect | null>(null);
  const [selectedNoteText, setSelectedNoteText] = useState<string | null>(null);
  const [isFocusMode, setIsFocusMode] = useState(false);

  const selectedNodeIdRef = useRef<string | null>(null);
  const selectedNodeElRef = useRef<HTMLElement | null>(null);
  const lastClickedNodeRef = useRef<{ id: string | null; at: number }>({
    id: null,
    at: 0,
  });
  const searchHighlightIdsRef = useRef<Set<string>>(new Set());
  const searchActiveIdRef = useRef<string | null>(null);
  const rectRetryRafRef = useRef<number | null>(null);
  const rectRetryTimerRef = useRef<number | null>(null);
  const rectRetryNodeIdRef = useRef<string | null>(null);
  const missingRectCountRef = useRef<Record<string, number>>({});

  useEffect(() => {
    selectedNodeIdRef.current = selectedNodeId;
  }, [selectedNodeId]);

  useEffect(
    () => () => {
      if (rectRetryRafRef.current !== null) {
        window.cancelAnimationFrame(rectRetryRafRef.current);
        rectRetryRafRef.current = null;
      }
      if (rectRetryTimerRef.current !== null) {
        window.clearTimeout(rectRetryTimerRef.current);
        rectRetryTimerRef.current = null;
      }
      rectRetryNodeIdRef.current = null;
      missingRectCountRef.current = {};
    },
    []
  );

  const getNodeElById = useCallback(
    (id: string) => {
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
          // ignore
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
        } catch {
          // ignore
        }
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
    },
    [cloneMindData, elRef, escapeAttr, expandPathToId, mindRef, normalizeMindData]
  );

  const getNodeTextEl = useCallback((el: HTMLElement | null) => {
    if (!el) return null;
    return el.querySelector<HTMLElement>(".text");
  }, []);

  const restoreSearchMark = useCallback(
    (el: HTMLElement | null) => {
      const textEl = getNodeTextEl(el);
      if (!textEl) return;
      const original = textEl.getAttribute("data-search-original");
      if (original !== null) {
        textEl.innerText = original;
        textEl.removeAttribute("data-search-original");
      }
    },
    [getNodeTextEl]
  );

  const applySearchMark = useCallback(
    (el: HTMLElement | null, query: string) => {
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
      const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const re = new RegExp(escaped, "ig");
      textEl.innerHTML = base.replace(
        re,
        (match) => `<mark class="me-search-mark">${match}</mark>`
      );
    },
    [getNodeTextEl]
  );

  const updateSelectedRect = useCallback(
    (nodeId: string | null) => {
      const wrapper = wrapperRef.current;
      const host = elRef.current;
      if (!wrapper || !host || !nodeId) {
        if (rectRetryRafRef.current !== null) {
          window.cancelAnimationFrame(rectRetryRafRef.current);
          rectRetryRafRef.current = null;
        }
        if (rectRetryTimerRef.current !== null) {
          window.clearTimeout(rectRetryTimerRef.current);
          rectRetryTimerRef.current = null;
        }
        rectRetryNodeIdRef.current = null;
        missingRectCountRef.current = {};
        setSelectedRect(null);
        setSelectedNoteText(null);
        return;
      }
      const normalizedNodeId = normalizeNodeId(nodeId);
      const candidates = nodeIdCandidates(normalizedNodeId);
      let nodeEl: HTMLElement | null = null;
      for (const candidate of candidates) {
        const escaped = escapeAttr(candidate);
        nodeEl =
          host.querySelector<HTMLElement>(`me-tpc[data-nodeid="${escaped}"]`) ||
          host.querySelector<HTMLElement>(`[data-nodeid="${escaped}"]`);
        if (nodeEl) break;
      }
      if (!nodeEl) {
        const selectedNormalized = selectedNodeIdRef.current
          ? normalizeNodeId(selectedNodeIdRef.current)
          : null;
        const isStillSelected = selectedNormalized === normalizedNodeId;
        const missCount = (missingRectCountRef.current[normalizedNodeId] ?? 0) + 1;
        missingRectCountRef.current[normalizedNodeId] = missCount;
        if (missCount === 1 || missCount === 4) {
          logMindElixirDebug("selected_rect_missing_node", {
            nodeId: normalizedNodeId,
            missCount,
            selectedNodeId: selectedNodeIdRef.current,
            isStillSelected,
          });
        }
        if (isStillSelected && missCount <= 4) {
          if (rectRetryNodeIdRef.current !== normalizedNodeId) {
            if (rectRetryRafRef.current !== null) {
              window.cancelAnimationFrame(rectRetryRafRef.current);
              rectRetryRafRef.current = null;
            }
            if (rectRetryTimerRef.current !== null) {
              window.clearTimeout(rectRetryTimerRef.current);
              rectRetryTimerRef.current = null;
            }
            rectRetryNodeIdRef.current = normalizedNodeId;
            rectRetryRafRef.current = window.requestAnimationFrame(() => {
              rectRetryRafRef.current = null;
              rectRetryNodeIdRef.current = null;
              updateSelectedRect(normalizedNodeId);
            });
            rectRetryTimerRef.current = window.setTimeout(() => {
              rectRetryTimerRef.current = null;
              rectRetryNodeIdRef.current = null;
              updateSelectedRect(normalizedNodeId);
            }, 96);
          }
          return;
        }
        delete missingRectCountRef.current[normalizedNodeId];
        if (!isStillSelected) return;
        logMindElixirDebug("selected_rect_cleared_after_retries", {
          nodeId: normalizedNodeId,
          missCount,
          selectedNodeId: selectedNodeIdRef.current,
        });
        setSelectedRect(null);
        setSelectedNoteText(null);
        selectedNodeElRef.current = null;
        return;
      }
      const recoveredMissCount = missingRectCountRef.current[normalizedNodeId] ?? 0;
      if (recoveredMissCount > 0) {
        logMindElixirDebug("selected_rect_recovered", {
          nodeId: normalizedNodeId,
          recoveredFromMissCount: recoveredMissCount,
        });
      }
      delete missingRectCountRef.current[normalizedNodeId];
      if (rectRetryNodeIdRef.current === normalizedNodeId) {
        if (rectRetryRafRef.current !== null) {
          window.cancelAnimationFrame(rectRetryRafRef.current);
          rectRetryRafRef.current = null;
        }
        if (rectRetryTimerRef.current !== null) {
          window.clearTimeout(rectRetryTimerRef.current);
          rectRetryTimerRef.current = null;
        }
        rectRetryNodeIdRef.current = null;
      }
      const rect = nodeEl.getBoundingClientRect();
      const hostRect = wrapper.getBoundingClientRect();
      setSelectedRect(
        new DOMRect(
          rect.left - hostRect.left,
          rect.top - hostRect.top,
          rect.width,
          rect.height
        )
      );
      const note =
        (nodeEl as HTMLElement & { nodeObj?: AnyNode }).nodeObj?.note ?? null;
      setSelectedNoteText(note && note.trim().length > 0 ? note : null);
      selectedNodeElRef.current = nodeEl;
    },
    [elRef, escapeAttr, wrapperRef]
  );

  const applySelectionFromElement = useCallback(
    (nodeEl: HTMLElement, nodeId: string) => {
      const wrapper = wrapperRef.current;
      if (!wrapper) return;
      const normalizedNodeId = normalizeNodeId(nodeId);
      const rect = nodeEl.getBoundingClientRect();
      const hostRect = wrapper.getBoundingClientRect();
      const note =
        (nodeEl as HTMLElement & { nodeObj?: AnyNode }).nodeObj?.note ?? null;

      const normalizedLatest =
        normalizeMindData(latestMindDataRef.current) ??
        syncLatestMindDataFromMind();
      if (normalizedLatest?.node) {
        const latestNode = findNodeById(normalizedLatest.node, nodeId);
        const latestNodeHighlight = latestNode?.highlight?.variant ?? null;
        if (latestNodeHighlight) {
          nodeEl.setAttribute("data-highlight", latestNodeHighlight);
        } else {
          nodeEl.removeAttribute("data-highlight");
        }
      }

      lastClickedNodeRef.current = { id: normalizedNodeId, at: Date.now() };
      selectedNodeIdRef.current = normalizedNodeId;
      selectedNodeElRef.current = nodeEl;
      setSelectedNodeId(normalizedNodeId);
      setSelectedRect(
        new DOMRect(
          rect.left - hostRect.left,
          rect.top - hostRect.top,
          rect.width,
          rect.height
        )
      );
      setSelectedNoteText(note && note.trim().length > 0 ? note : null);
      setMobileActionNodeId(null);
      logMindElixirDebug("selection_applied", {
        nodeId: normalizedNodeId,
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      });
      requestAnimationFrame(() => updateSelectedRect(normalizedNodeId));
      window.setTimeout(() => updateSelectedRect(normalizedNodeId), 80);
    },
    [
      findNodeById,
      latestMindDataRef,
      normalizeMindData,
      setMobileActionNodeId,
      syncLatestMindDataFromMind,
      updateSelectedRect,
      wrapperRef,
    ]
  );

  const clearSearchHighlights = useCallback(() => {
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
  }, [getNodeElById, restoreSearchMark]);

  const setSearchHighlights = useCallback(
    (ids: string[], query = "") => {
      clearSearchHighlights();
      ids.forEach((id) => {
        const el = getNodeElById(id);
        if (el) {
          el.setAttribute("data-search", "true");
          searchHighlightIdsRef.current.add(id);
          applySearchMark(el, query);
        }
      });
    },
    [applySearchMark, clearSearchHighlights, getNodeElById]
  );

  const setSearchActive = useCallback(
    (id?: string | null) => {
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
    },
    [getNodeElById]
  );

  const focusNodeById = useCallback(
    (id: string) => {
      const el = getNodeElById(id);
      if (!el) return;
      const normalizedNodeId = normalizeNodeId(id);
      selectedNodeIdRef.current = normalizedNodeId;
      setSelectedNodeId(normalizedNodeId);
      selectedNodeElRef.current = el;
      requestAnimationFrame(() => updateSelectedRect(normalizedNodeId));
      const host = elRef.current;
      const mind = mindRef.current;
      if (host && mind?.move) {
        const rect = el.getBoundingClientRect();
        const hostRect = host.getBoundingClientRect();
        const targetX = rect.left + rect.width / 2;
        const targetY = rect.top + rect.height / 2;
        const insetLeft = Math.max(
          0,
          Math.min(focusInsetLeftRef.current, hostRect.width * 0.8)
        );
        const visibleWidth = Math.max(0, hostRect.width - insetLeft);
        const centerX =
          hostRect.left +
          insetLeft +
          (visibleWidth > 0 ? visibleWidth / 2 : hostRect.width / 2);
        const centerY = hostRect.top + hostRect.height / 2;
        mind.move(centerX - targetX, centerY - targetY);
        return;
      }
      el.scrollIntoView({ block: "center", inline: "center", behavior: "smooth" });
    },
    [elRef, focusInsetLeftRef, getNodeElById, mindRef, updateSelectedRect]
  );

  const handleExitFocus = useCallback(() => {
    const mind = mindRef.current;
    if (!mind) return;
    mind.cancelFocus?.();
    setSelectedNodeId(null);
    setSelectedRect(null);
    setSelectedNoteText(null);
    selectedNodeElRef.current = null;
    setIsFocusMode(false);
    logMindElixirDebug("selection_cleared_by_focus_exit");
  }, [mindRef]);

  const handleHighlightClick = useCallback(
    (targetNodeId?: string | null) => {
      const mind = mindRef.current;
      const selectedId = targetNodeId
        ? normalizeNodeId(targetNodeId)
        : selectedNodeIdRef.current
          ? normalizeNodeId(selectedNodeIdRef.current)
          : null;
      if (!mind || !selectedId) return;
      const exactSelectedEl =
        selectedNodeElRef.current ??
        getNodeElById(selectedId) ??
        null;
      const liveNode =
        (exactSelectedEl as (HTMLElement & { nodeObj?: AnyNode }) | null)
          ?.nodeObj ?? null;
      const resolvedTargetId = liveNode?.id ?? selectedId;
      const rawCurrent = mind.getData?.() ?? mind.getAllData?.() ?? null;
      const currentNormalized = normalizeMindData(rawCurrent);
      const pathByRef =
        currentNormalized?.node && liveNode
          ? findNodePathByRef(currentNormalized.node, liveNode)
          : null;
      const normalized =
        currentNormalized ??
        syncLatestMindDataFromMind() ??
        normalizeMindData(latestMindDataRef.current);
      if (!normalized) return;
      const next = cloneMindData(normalized.data);
      const nextNode = normalizeMindData(next)?.node;
      if (!nextNode) return;
      const target =
        (pathByRef ? getNodeByPath(nextNode, pathByRef) : null) ??
        findNodeById(nextNode, resolvedTargetId);
      if (!target) return;
      const nextHighlight = target.highlight?.variant
        ? null
        : { variant: highlightVariant };
      if (nextHighlight) {
        target.highlight = nextHighlight;
      } else {
        delete target.highlight;
      }
      if (liveNode) {
        if (nextHighlight) {
          liveNode.highlight = nextHighlight;
        } else {
          delete liveNode.highlight;
        }
      }
      expandPathToId(nextNode, resolvedTargetId);
      latestMindDataRef.current = next;
      if (exactSelectedEl) {
        if (nextHighlight?.variant) {
          exactSelectedEl.setAttribute("data-highlight", nextHighlight.variant);
        } else {
          exactSelectedEl.removeAttribute("data-highlight");
        }
      }
      onChangeRef.current?.({
        name: "toggleHighlight",
        id: target.id ?? resolvedTargetId,
        value: nextHighlight,
      });
      requestAnimationFrame(() => updateSelectedRect(selectedId));
    },
    [
      cloneMindData,
      expandPathToId,
      findNodeById,
      findNodePathByRef,
      getNodeElById,
      getNodeByPath,
      highlightVariant,
      latestMindDataRef,
      mindRef,
      normalizeMindData,
      onChangeRef,
      syncLatestMindDataFromMind,
      updateSelectedRect,
    ]
  );

  const selectedNodeIsRoot = Boolean(
    (
      selectedNodeElRef.current as (HTMLElement & { nodeObj?: AnyNode }) | null
    )?.nodeObj?.root ||
      !(
        selectedNodeElRef.current as
          | (HTMLElement & { nodeObj?: AnyNode })
          | null
      )?.nodeObj?.parent?.id
  );

  return {
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
  };
}
