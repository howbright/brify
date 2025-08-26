// app/hooks/useHistory.ts
"use client";
import { useCallback, useState } from "react";
import { MyFlowEdge, MyFlowNode } from "@/app/types/diagram";

export type DiagramSnapshot = { nodes: MyFlowNode[]; edges: MyFlowEdge[] };

const deepClone = <T,>(v: T): T => {
  // 함수는 빠져도 됨(복원 시 브리지 콜백 재주입하므로)
  // structuredClone 있으면 그걸 쓰고, 없으면 JSON 사용
  try {
    // @ts-ignore
    return typeof structuredClone === "function" ? structuredClone(v) : JSON.parse(JSON.stringify(v));
  } catch {
    return JSON.parse(JSON.stringify(v));
  }
};

export function useHistory(limit = 100) {
  const [past, setPast] = useState<DiagramSnapshot[]>([]);
  const [future, setFuture] = useState<DiagramSnapshot[]>([]);

  const canUndo = past.length > 0;
  const canRedo = future.length > 0;

  const push = useCallback((current: DiagramSnapshot) => {
    setPast(prev => {
      const next = [...prev, deepClone(current)];
      return next.length > limit ? next.slice(next.length - limit) : next;
    });
    setFuture([]); // 새 분기 시작
  }, [limit]);

  const undo = useCallback((current: DiagramSnapshot): DiagramSnapshot | null => {
    let prevSnap: DiagramSnapshot | null = null;
    setPast(prev => {
      if (!prev.length) return prev;
      prevSnap = prev[prev.length - 1];
      return prev.slice(0, -1);
    });
    if (prevSnap) {
      setFuture(f => [...f, deepClone(current)]);
      return deepClone(prevSnap);
    }
    return null;
  }, []);

  const redo = useCallback((current: DiagramSnapshot): DiagramSnapshot | null => {
    let nextSnap: DiagramSnapshot | null = null;
    setFuture(prev => {
      if (!prev.length) return prev;
      nextSnap = prev[prev.length - 1];
      return prev.slice(0, -1);
    });
    if (nextSnap) {
      setPast(p => [...p, deepClone(current)]);
      return deepClone(nextSnap);
    }
    return null;
  }, []);

  const clear = useCallback(() => {
    setPast([]); setFuture([]);
  }, []);

  return { canUndo, canRedo, push, undo, redo, clear };
}
