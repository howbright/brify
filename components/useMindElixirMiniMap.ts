"use client";

import { useEffect, useRef } from "react";

type AnyNode = {
  id: string;
  parent?: { id?: string } | null;
};

type Params = {
  elRef: React.RefObject<HTMLDivElement | null>;
  mindRef: React.RefObject<any>;
  effectiveMode: "light" | "dark";
};

export function useMindElixirMiniMap({
  elRef,
  mindRef,
  effectiveMode,
}: Params) {
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
    pointerType: string | null;
  }>({ dragging: false, lastX: 0, lastY: 0, pointerType: null });
  const miniMapRafRef = useRef<number | null>(null);
  const miniMapDrawRef = useRef<() => void>(() => {});

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

      const isDarkMiniMap = effectiveMode === "dark";
      const miniMapBg = isDarkMiniMap
        ? "rgba(255, 255, 255, 0.08)"
        : "rgba(15, 23, 42, 0.06)";
      const miniMapEdge = isDarkMiniMap
        ? "rgba(226, 232, 240, 0.5)"
        : "rgba(51, 65, 85, 0.35)";
      const miniMapNode = isDarkMiniMap
        ? "rgba(241, 245, 249, 0.92)"
        : "rgba(51, 65, 85, 0.8)";
      const miniMapViewport = isDarkMiniMap
        ? "rgba(96, 165, 250, 0.95)"
        : "rgba(37, 99, 235, 0.75)";

      ctx.fillStyle = miniMapBg;
      ctx.fillRect(0, 0, rect.width, rect.height);

      ctx.strokeStyle = miniMapEdge;
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

      ctx.fillStyle = miniMapNode;
      points.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x * scale + offsetX, p.y * scale + offsetY, 2.2, 0, Math.PI * 2);
        ctx.fill();
      });

      const view = host.getBoundingClientRect();
      const vx = view.left * scale + offsetX;
      const vy = view.top * scale + offsetY;
      const vw = view.width * scale;
      const vh = view.height * scale;
      ctx.strokeStyle = miniMapViewport;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(vx, vy, vw, vh);
    };
  });

  useEffect(() => {
    const canvas = miniMapRef.current;
    if (!canvas) return;

    const moveViewportToMiniMapPoint = (clientX: number, clientY: number) => {
      const mind = mindRef.current;
      const bounds = miniMapBoundsRef.current;
      const host = elRef.current;
      if (!mind || !bounds || !host) return;

      const canvasRect = canvas.getBoundingClientRect();
      const miniX = clientX - canvasRect.left;
      const miniY = clientY - canvasRect.top;
      const hostRect = host.getBoundingClientRect();
      const viewCenterX = hostRect.left + hostRect.width / 2;
      const viewCenterY = hostRect.top + hostRect.height / 2;
      const targetX = (miniX - bounds.offsetX) / bounds.scale;
      const targetY = (miniY - bounds.offsetY) / bounds.scale;

      mind.move(viewCenterX - targetX, viewCenterY - targetY);
    };

    const handlePointerDown = (e: PointerEvent) => {
      miniMapDragRef.current.dragging = true;
      miniMapDragRef.current.lastX = e.clientX;
      miniMapDragRef.current.lastY = e.clientY;
      miniMapDragRef.current.pointerType = e.pointerType;
      canvas.setPointerCapture(e.pointerId);
      if (e.pointerType === "touch") {
        moveViewportToMiniMapPoint(e.clientX, e.clientY);
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!miniMapDragRef.current.dragging) return;
      if (miniMapDragRef.current.pointerType === "touch") {
        moveViewportToMiniMapPoint(e.clientX, e.clientY);
        miniMapDragRef.current.lastX = e.clientX;
        miniMapDragRef.current.lastY = e.clientY;
        return;
      }
      const mind = mindRef.current;
      const bounds = miniMapBoundsRef.current;
      if (!mind || !bounds) return;
      const dx = e.clientX - miniMapDragRef.current.lastX;
      const dy = e.clientY - miniMapDragRef.current.lastY;
      miniMapDragRef.current.lastX = e.clientX;
      miniMapDragRef.current.lastY = e.clientY;
      mind.move(-(dx / bounds.scale), -(dy / bounds.scale));
    };

    const handlePointerUp = (e: PointerEvent) => {
      miniMapDragRef.current.dragging = false;
      miniMapDragRef.current.pointerType = null;
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
  }, [elRef, mindRef]);

  useEffect(() => {
    return () => {
      if (miniMapRafRef.current) {
        cancelAnimationFrame(miniMapRafRef.current);
      }
    };
  }, []);

  return {
    miniMapRef,
    scheduleMiniMapDraw,
  };
}
