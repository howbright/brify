// components/diagram/DiagramView.tsx
"use client";

import { classicStyle } from "@/styles/presets";
import "@xyflow/react/dist/style.css";
import { CSSProperties, useCallback, useEffect, useMemo, useState } from "react";
import DiagramStyleSelector from "../DiagramStyleSelector";
import { CustomNode } from "./CustomNode";
import { MyFlowEdge, MyFlowNode } from "@/app/types/diagram";
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  applyEdgeChanges,
  applyNodeChanges,
  type EdgeChange,
} from "@xyflow/react";
import { toast } from "sonner";

const nodeTypes = { custom: CustomNode };

interface DiagramViewProps {
  summaryId: string;
  nodes: MyFlowNode[];
  edges: MyFlowEdge[];
}

// ⬇ (선택) 파일 어느 곳에 두어도 되는 작은 유틸
const safeParseJSON = <T = any,>(text: string | null): T | null => {
  if (!text) return null;
  try { return JSON.parse(text) as T; } catch { return null; }
};
const now = () => (typeof performance !== "undefined" ? performance.now() : Date.now());
const shortId = () => Math.random().toString(36).slice(2, 8);


export default function DiagramView({ summaryId, nodes, edges }: DiagramViewProps) {
  const [stylePreset, setStylePreset] = useState(classicStyle);
  const [stylePickerOpen, setStylePickerOpen] = useState(false);

  const [flowNodes, setFlowNodes] = useState<MyFlowNode[]>([]);
  const [flowEdges, setFlowEdges] = useState<MyFlowEdge[]>([]);

  const [autoSave, setAutoSave] = useState(true);
  const [dirty, setDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // ⬇ 하이라이트일 때 인라인 색이 클래스를 가리지 않도록 정리
  const computeNodeStyle = useCallback(
    (node: MyFlowNode): CSSProperties => {
      // preset만 기준으로 (과거 node.style의 색을 섞지 않음)
      const base: CSSProperties = { ...(stylePreset.node as CSSProperties) };
      const isHighlighted = !!(node.data as any)?.highlighted;

      if (isHighlighted) {
        delete (base as any).background;
        delete (base as any).backgroundColor;
        delete (base as any).backgroundImage;
        delete (base as any).borderColor;
        delete (base as any).boxShadow; // ring 가림 방지
      }
      return base;
    },
    [stylePreset]
  );

  // ✅ 하이라이트 토글(낙관적 갱신 → API 저장 → 실패 롤백)
  const onHighlightChange = useCallback(
    async (nodeId: string, next: boolean) => {
      const reqId = shortId();
      const t0 = now();
  
      // 콘솔 그룹으로 묶어서 보기 쉽게
      // eslint-disable-next-line no-console
      console.groupCollapsed(
        `%c[HL ${reqId}] toggle`,
        "color:#9333ea;font-weight:700",
        { nodeId, next }
      );
  
      // 1) 낙관적 갱신 (+ 스타일 재계산)
      setFlowNodes((prev) => {
        let hit = false;
        const updated = prev.map((n) => {
          if (String(n.id) !== String(nodeId)) return n;
          hit = true;
          const candidate: MyFlowNode = {
            ...n,
            data: { ...(n.data as any), highlighted: next } as any,
          };
          const styled = { ...candidate, style: computeNodeStyle(candidate) };
          // eslint-disable-next-line no-console
          console.log(`[HL ${reqId}] optimistic ->`, {
            id: n.id,
            highlighted: next,
            styleAfter: styled.style,
          });
          return styled;
        });
        if (!hit) {
          // eslint-disable-next-line no-console
          console.warn(`[HL ${reqId}] node not found in local state`, { nodeId });
        }
        return updated;
      });
  
      // 2) 서버 저장
      try {
        const res = await fetch(`/api/summary/highlight`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ summaryId, nodeId, highlighted: next }),
        });
        const rawText = await res.text();
        const json = safeParseJSON<any>(rawText);
  
        if (!res.ok) {
          // eslint-disable-next-line no-console
          console.warn(
            `[HL ${reqId}] server !ok`,
            { status: res.status, statusText: res.statusText, json, rawText }
          );
  
          // 3) 실패 롤백 (+ 스타일 재계산)
          setFlowNodes((prev) =>
            prev.map((n) => {
              if (String(n.id) !== String(nodeId)) return n;
              const candidate: MyFlowNode = {
                ...n,
                data: { ...(n.data as any), highlighted: !next } as any,
              };
              return { ...candidate, style: computeNodeStyle(candidate) };
            })
          );
  
          // 사용자에게도 명확히
          const reason =
            json?.message
              ? `${json.message}${
                  json?.detail ? ` — ${JSON.stringify(json.detail)}` : ""
                }`
              : rawText || "Unknown error";
          toast.error(`하이라이트 저장 실패 (${res.status} ${res.statusText})`, {
            description: reason,
          });
          return;
        }
  
        // 성공 로그
        // eslint-disable-next-line no-console
        console.log(`[HL ${reqId}] server ok`, { json });
  
        // (선택) 서버가 정규화된 스냅샷을 돌려주지 않으니,
        // 낙관적 갱신 상태를 그대로 유지.
        toast.success(next ? "하이라이트 적용됨" : "하이라이트 해제됨");
      } catch (err: any) {
        // 네트워크 오류 등
        // eslint-disable-next-line no-console
        console.error(`[HL ${reqId}] fetch error`, err);
  
        // 롤백
        setFlowNodes((prev) =>
          prev.map((n) => {
            if (String(n.id) !== String(nodeId)) return n;
            const candidate: MyFlowNode = {
              ...n,
              data: { ...(n.data as any), highlighted: !next } as any,
            };
            return { ...candidate, style: computeNodeStyle(candidate) };
          })
        );
  
        toast.error("하이라이트 저장 중 네트워크 오류");
      } finally {
        const dt = (now() - t0).toFixed(1);
        // eslint-disable-next-line no-console
        console.groupEnd?.();
        // eslint-disable-next-line no-console
        console.log(`%c[HL ${reqId}] done in ${dt}ms`, "color:#22c55e");
      }
    },
    [summaryId, computeNodeStyle, setFlowNodes]
  );

  // === API CALLS ===
  const saveTempDiagram = useCallback(
    async (nodesArg: any, edgesArg: any) => {
      setIsSaving(true);
      try {
        await fetch(`/api/summaries/${summaryId}/temp-diagram`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nodes: nodesArg, edges: edgesArg }),
        });
      } finally {
        setIsSaving(false);
      }
    },
    [summaryId]
  );

  const commitDiagram = useCallback(
    async (nodesArg: any, edgesArg: any) => {
      setIsSaving(true);
      try {
        await fetch(`/api/summaries/${summaryId}/commit-diagram`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nodes: nodesArg, edges: edgesArg }),
        });
        setDirty(false);
      } finally {
        setIsSaving(false);
      }
    },
    [summaryId]
  );

 

  const onUpdateNode = useCallback(
    (id: string, newText: string, type: "title" | "description") => {
      setFlowNodes((nds) => {
        const newNodes = nds.map((n) =>
          n.id === id
            ? {
                ...n,
                data: {
                  ...(n.data as any),
                  title: type === "title" ? newText : (n.data as any).title,
                  description:
                    type === "description" ? newText : (n.data as any).description,
                } as any,
              }
            : n
        );

        if (autoSave) {
          saveTempDiagram(newNodes, flowEdges);
        } else {
          setDirty(true);
        }
        return newNodes;
      });
    },
    [autoSave, flowEdges, saveTempDiagram]
  );

  const resetDiagram = useCallback(async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/summaries/${summaryId}/reset-diagram`, { method: "POST" });
      const data = await res.json();
      if (data.diagram_json) {
        const freshNodes = (data.diagram_json.nodes || []) as MyFlowNode[];
        const mapped = freshNodes.map((n) => {
          const withRuntime: MyFlowNode = {
            ...n,
            type: "custom" as const,
            data: {
              ...(n.data as any),
              onUpdate: onUpdateNode,
              onHighlightChange,
              highlighted: !!(n.data as any)?.highlighted,
            } as any,
          };
          return { ...withRuntime, style: computeNodeStyle(withRuntime) };
        });
        setFlowNodes(mapped);
        setFlowEdges((data.diagram_json.edges || []) as MyFlowEdge[]);
      }
      setDirty(false);
    } finally {
      setIsSaving(false);
    }
  }, [summaryId, onUpdateNode, onHighlightChange, computeNodeStyle]);

  // props → state 초기화 (단 하나의 useEffect만 사용)
  useEffect(() => {
    const styled: MyFlowNode[] = (nodes ?? []).map((node) => {
      const withRuntime: MyFlowNode = {
        ...node,
        type: "custom" as const,
        data: {
          ...(node.data as any),
          onUpdate: onUpdateNode,
          onHighlightChange,
          highlighted: !!(node.data as any)?.highlighted,
        } as any,
      };
      return { ...withRuntime, style: computeNodeStyle(withRuntime) };
    });
    setFlowNodes(styled);
    setFlowEdges((edges ?? []) as MyFlowEdge[]);
  }, [nodes, edges, onUpdateNode, onHighlightChange, computeNodeStyle]);

  const onNodesChange = useCallback(
    (changes: any) => setFlowNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setFlowEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  return (
    <div className="h-[600px] border rounded bg-white relative">
      {/* 상단 바 */}
      <div className="absolute top-2 right-2 flex items-center gap-2 z-10 bg-white/80 px-3 py-1 rounded shadow">
        <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
          <span>자동 저장</span>
          <input
            type="checkbox"
            checked={autoSave}
            onChange={(e) => setAutoSave(e.target.checked)}
          />
        </label>

        {!autoSave && (
          <>
            <button
              onClick={() => commitDiagram(flowNodes, flowEdges)}
              disabled={!dirty || isSaving}
              className="px-3 py-1 bg-blue-500 text-white rounded disabled:opacity-50"
            >
              {isSaving ? "저장 중..." : "저장하기"}
            </button>
            <button
              onClick={resetDiagram}
              className="px-3 py-1 bg-gray-300 rounded"
            >
              초기화
            </button>
          </>
        )}
        {autoSave && (
          <span className="text-xs text-gray-500">
            {isSaving ? "자동 저장 중..." : "모두 저장됨"}
          </span>
        )}
      </div>

      <ReactFlowProvider>
        <ReactFlow<MyFlowNode, MyFlowEdge>
          nodes={flowNodes}
          edges={flowEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
          panOnScroll
          panOnDrag
          zoomOnScroll={false}
          nodesDraggable={true}
          elementsSelectable={true}
          nodeTypes={nodeTypes}
        >
          <MiniMap style={{ width: 100, height: 70 }} zoomable pannable />
          <Controls position="top-left" />
          <Background />
        </ReactFlow>
      </ReactFlowProvider>

      <DiagramStyleSelector
        open={stylePickerOpen}
        onClose={() => setStylePickerOpen(false)}
        onSelect={(style) => setStylePreset(style)}
      />
    </div>
  );
}
