"use client";

import { useRef } from "react";

type AnyNode = {
  id: string;
  topic: string;
  root?: boolean;
  parent?: { id?: string } | null;
  highlight?: { variant?: string } | null;
  note?: string | null;
  children?: AnyNode[];
  expanded?: boolean;
};

type Params = {
  elRef: React.RefObject<HTMLDivElement | null>;
  wrapperRef: React.RefObject<HTMLDivElement | null>;
  mindRef: React.RefObject<any>;
  latestMindDataRef: React.RefObject<any>;
  focusInsetLeftRef: React.RefObject<number>;
  selectedNodeElRef: React.RefObject<HTMLElement | null>;
  selectedNodeIdRef: React.RefObject<string | null>;
  lastClickedNodeRef: React.RefObject<{ id: string | null; at: number }>;
  setSelectedNodeId: React.Dispatch<React.SetStateAction<string | null>>;
  setSelectedRect: React.Dispatch<React.SetStateAction<DOMRect | null>>;
  setSelectedNoteText: React.Dispatch<React.SetStateAction<string | null>>;
  setMobileActionNodeId: React.Dispatch<React.SetStateAction<string | null>>;
  setIsFocusMode: React.Dispatch<React.SetStateAction<boolean>>;
  normalizeMindData: (raw: any) => { data: any; node: AnyNode } | null;
  cloneMindData: <T>(data: T) => T;
  findNodeById: (node: AnyNode, id: string) => AnyNode | null;
  findNodePathByRef: (
    node: AnyNode | null | undefined,
    target: AnyNode,
    path?: number[]
  ) => number[] | null;
  getNodeByPath: (node: AnyNode | null | undefined, path: number[]) => AnyNode | null;
  expandPathToId: (node: AnyNode | null | undefined, targetId: string) => boolean;
  escapeAttr: (value: string) => string;
  escapeRegExp: (value: string) => string;
  highlightVariant: string;
  syncLatestMindDataFromMind: () => { data: any; node: AnyNode } | null;
};

export function useMindElixirFocusSearch({
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
}: Params) {
  const searchHighlightIdsRef = useRef<Set<string>>(new Set());
  const searchActiveIdRef = useRef<string | null>(null);

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

  const applySelectionFromElement = (nodeEl: HTMLElement, nodeId: string) => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const rect = nodeEl.getBoundingClientRect();
    const hostRect = wrapper.getBoundingClientRect();
    const relativeRect = new DOMRect(
      rect.left - hostRect.left,
      rect.top - hostRect.top,
      rect.width,
      rect.height
    );
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

    lastClickedNodeRef.current = { id: nodeId, at: Date.now() };
    selectedNodeIdRef.current = nodeId;
    selectedNodeElRef.current = nodeEl;
    setSelectedNodeId(nodeId);
    setSelectedRect(relativeRect);
    setSelectedNoteText(note && note.trim().length > 0 ? note : null);
    setMobileActionNodeId(null);

    requestAnimationFrame(() => updateSelectedRect(nodeId));
    window.setTimeout(() => updateSelectedRect(nodeId), 80);
  };

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
      } catch {}
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
    textEl.innerHTML = base.replace(
      re,
      (match) => `<mark class="me-search-mark">${match}</mark>`
    );
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

  const handleHighlightClick = (targetNodeId?: string | null) => {
    const mind = mindRef.current;
    const selectedId = targetNodeId ?? selectedNodeIdRef.current;
    if (!mind || !selectedId) return;
    const exactSelectedEl =
      selectedNodeElRef.current ??
      elRef.current?.querySelector<HTMLElement>(
        `me-tpc[data-nodeid="${escapeAttr(selectedId)}"]`
      ) ??
      elRef.current?.querySelector<HTMLElement>(
        `[data-nodeid="${escapeAttr(selectedId)}"]`
      ) ??
      null;
    const liveNode =
      (exactSelectedEl as (HTMLElement & { nodeObj?: AnyNode }) | null)?.nodeObj ??
      null;
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
    return {
      op: {
        name: "toggleHighlight",
        id: target.id ?? resolvedTargetId,
        value: nextHighlight,
      },
      selectedId,
    };
  };

  return {
    updateSelectedRect,
    applySelectionFromElement,
    getNodeElById,
    clearSearchHighlights,
    setSearchHighlights,
    setSearchActive,
    focusNodeById,
    handleExitFocus,
    handleHighlightClick,
  };
}
