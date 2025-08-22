// components/diagram/DiagramView.tsx
"use client";

import { MyFlowEdge, MyFlowNode } from "@/app/types/diagram";
import { classicStyle } from "@/styles/presets";
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
import "@xyflow/react/dist/style.css";
import { CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import DiagramStyleSelector from "../DiagramStyleSelector";
import { CustomNode } from "./CustomNode";

const nodeTypes = { custom: CustomNode };

// ---------- 작은 유틸 ----------
const safeParseJSON = <T = any,>(text: string | null): T | null => {
  if (!text) return null;
  try { return JSON.parse(text) as T; } catch { return null; }
};
const now = () => (typeof performance !== "undefined" ? performance.now() : Date.now());
const shortId = () => Math.random().toString(36).slice(2, 8);
const makeNodeId = () => `n_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
const makeEdgeId = (s: string, t: string) => `e_${s}_${t}_${Math.random().toString(36).slice(2, 5)}`;

interface DiagramViewProps {
  summaryId: string;
  nodes: MyFlowNode[];
  edges: MyFlowEdge[];
}

export default function DiagramView({ summaryId, nodes, edges }: DiagramViewProps) {
  // ---------- state ----------
  const [stylePreset, setStylePreset] = useState(classicStyle);
  const [stylePickerOpen, setStylePickerOpen] = useState(false);

  const [flowNodes, setFlowNodes] = useState<MyFlowNode[]>([]);
  const [flowEdges, setFlowEdges] = useState<MyFlowEdge[]>([]);

  const [autoSave, setAutoSave] = useState(true);
  const [dirty, setDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // ---------- 스타일 계산(하이라이트 시 인라인 색 제거) ----------
  const computeNodeStyle = useCallback(
    (node: MyFlowNode): CSSProperties => {
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

  // ---------- API ----------
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

  // ---------- 실제 동작 콜백(아이덴티티 바뀔 수 있음) ----------
  const onUpdateNodeReal = useCallback(
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

  const onHighlightChangeReal = useCallback(
    async (nodeId: string, next: boolean) => {
      const reqId = shortId();
      const t0 = now();

      // 1) 낙관적 갱신
      setFlowNodes((prev) =>
        prev.map((n) => {
          if (String(n.id) !== String(nodeId)) return n;
          const candidate: MyFlowNode = {
            ...n,
            data: { ...(n.data as any), highlighted: next } as any,
          };
          return { ...candidate, style: computeNodeStyle(candidate) };
        })
      );

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

          const reason =
            json?.message
              ? `${json.message}${json?.detail ? ` — ${JSON.stringify(json.detail)}` : ""}`
              : rawText || "Unknown error";
          toast.error(`하이라이트 저장 실패 (${res.status} ${res.statusText})`, {
            description: reason,
          });
          return;
        }

        toast.success(next ? "하이라이트 적용됨" : "하이라이트 해제됨");
      } catch {
        // 네트워크 오류 → 롤백
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
        console.log(`[HL ${reqId}] done in ${dt}ms`);
      }
    },
    [summaryId, computeNodeStyle]
  );

  const onAddChildReal = useCallback(
    (parentId: string) => {
      setFlowNodes((prevNodes) => {
        const parent = prevNodes.find((n) => n.id === parentId);

        const pos = parent
          ? {
              x: parent.position.x + 260,
              y: parent.position.y + 160 + Math.round(Math.random() * 40 - 20),
            }
          : { x: 0, y: 0 };

        const newId = makeNodeId();
        const newNode: MyFlowNode = {
          id: newId,
          type: "custom",
          position: pos,
          data: {
            ...(parent?.data as any),
            nodeType: "description",
            title: "",
            description: "새 항목",
            highlighted: false,
          } as any,
        };

        const nextNodes = [...prevNodes, { ...newNode, style: computeNodeStyle(newNode) }];

        setFlowEdges((prevEdges) => {
          const edge = { id: makeEdgeId(parentId, newId), source: parentId, target: newId };
          const nextEdges = [...prevEdges, edge];

          if (autoSave) {
            saveTempDiagram(nextNodes, nextEdges);
          } else {
            setDirty(true);
          }
          return nextEdges;
        });

        return nextNodes;
      });
    },
    [autoSave, saveTempDiagram, computeNodeStyle]
  );

  const onDeleteNodeReal = useCallback(
    (nodeId: string) => {
      setFlowNodes((prevNodes) => {
        const nextNodes = prevNodes.filter((n) => n.id !== nodeId);
        setFlowEdges((prevEdges) => {
          const nextEdges = prevEdges.filter((e) => e.source !== nodeId && e.target !== nodeId);
          if (autoSave) {
            saveTempDiagram(nextNodes, nextEdges);
          } else {
            setDirty(true);
          }
          return nextEdges;
        });
        return nextNodes;
      });
    },
    [autoSave, saveTempDiagram]
  );

  const onDetachFromParentReal = useCallback(
    (nodeId: string) => {
      setFlowEdges((prevEdges) => {
        const nextEdges = prevEdges.filter((e) => e.target !== nodeId);
        if (autoSave) {
          saveTempDiagram(flowNodes, nextEdges);
        } else {
          setDirty(true);
        }
        return nextEdges;
      });
    },
    [autoSave, flowNodes, saveTempDiagram]
  );

  // ---------- 최신 콜백을 담는 ref + 브리지(항상 안정) ----------
  const handlersRef = useRef({
    onUpdateNode: onUpdateNodeReal,
    onHighlightChange: onHighlightChangeReal,
    onAddChild: onAddChildReal,
    onDeleteNode: onDeleteNodeReal,
    onDetachFromParent: onDetachFromParentReal,
  });
  // ref 갱신 (state 변경 없음 → 리렌더 유발 안 함)
  useEffect(() => {
    handlersRef.current = {
      onUpdateNode: onUpdateNodeReal,
      onHighlightChange: onHighlightChangeReal,
      onAddChild: onAddChildReal,
      onDeleteNode: onDeleteNodeReal,
      onDetachFromParent: onDetachFromParentReal,
    };
  }, [
    onUpdateNodeReal,
    onHighlightChangeReal,
    onAddChildReal,
    onDeleteNodeReal,
    onDetachFromParentReal,
  ]);

  // 브리지: 아이덴티티가 변하지 않는 콜백을 노드에 주입
  const onUpdateBridge = useCallback((...args: any[]) => {
    return handlersRef.current.onUpdateNode(...(args as Parameters<typeof onUpdateNodeReal>));
  }, []);
  const onHighlightBridge = useCallback((...args: any[]) => {
    return handlersRef.current.onHighlightChange(...(args as Parameters<typeof onHighlightChangeReal>));
  }, []);
  const onAddChildBridge = useCallback((...args: any[]) => {
    return handlersRef.current.onAddChild(...(args as Parameters<typeof onAddChildReal>));
  }, []);
  const onDeleteNodeBridge = useCallback((...args: any[]) => {
    return handlersRef.current.onDeleteNode(...(args as Parameters<typeof onDeleteNodeReal>));
  }, []);
  const onDetachFromParentBridge = useCallback((...args: any[]) => {
    return handlersRef.current.onDetachFromParent(...(args as Parameters<typeof onDetachFromParentReal>));
  }, []);

  // ---------- props → state 초기화 (콜백/브리지는 안정적이므로 의존성 X) ----------
  useEffect(() => {
    const styled: MyFlowNode[] = (nodes ?? []).map((node) => {
      const withRuntime: MyFlowNode = {
        ...node,
        type: "custom",
        data: {
          ...(node.data as any),
          onUpdate: onUpdateBridge,
          onHighlightChange: onHighlightBridge,
          onAddChild: onAddChildBridge,
          onDeleteNode: onDeleteNodeBridge,
          onDetachFromParent: onDetachFromParentBridge,
          highlighted: !!(node.data as any)?.highlighted,
        } as any,
      };
      return { ...withRuntime, style: computeNodeStyle(withRuntime) };
    });
    setFlowNodes(styled);
    setFlowEdges((edges ?? []) as MyFlowEdge[]);
  }, [nodes, edges, computeNodeStyle, onUpdateBridge, onHighlightBridge, onAddChildBridge, onDeleteNodeBridge, onDetachFromParentBridge]);

  // ---------- reactflow 변경 핸들러 ----------
  const onNodesChange = useCallback(
    (changes: any) => setFlowNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setFlowEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  // ---------- UI ----------
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
              onClick={async () => {
                setIsSaving(true);
                try {
                  const res = await fetch(`/api/summaries/${summaryId}/reset-diagram`, { method: "POST" });
                  const data = await res.json();
                  if (data.diagram_json) {
                    const freshNodes = (data.diagram_json.nodes || []) as MyFlowNode[];
                    const mapped = freshNodes.map((n) => {
                      const withRuntime: MyFlowNode = {
                        ...n,
                        type: "custom",
                        data: {
                          ...(n.data as any),
                          onUpdate: onUpdateBridge,
                          onHighlightChange: onHighlightBridge,
                          onAddChild: onAddChildBridge,
                          onDeleteNode: onDeleteNodeBridge,
                          onDetachFromParent: onDetachFromParentBridge,
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
              }}
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
