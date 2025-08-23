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
import {
  CSSProperties,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
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
const makeEdgeId = (s: string | number, t: string | number) =>
  `e_${String(s)}_${String(t)}_${Math.random().toString(36).slice(2, 5)}`;

// ---------- 타입 ----------
type NodeId = string | number;
type OnUpdateNode = (id: string, newText: string, type: "title" | "description") => void;
type OnHighlightChange = (nodeId: string, next: boolean) => void | Promise<void>;
type OnAddChild = (parentId: NodeId) => void;
type OnDeleteNode = (nodeId: string) => void;
type OnDetachFromParent = (nodeId: string) => void;

type Handlers = {
  onUpdateNode: OnUpdateNode;
  onHighlightChange: OnHighlightChange;
  onAddChild: OnAddChild;
  onDeleteNode: OnDeleteNode;
  onDetachFromParent: OnDetachFromParent;
};

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

  // ---------- 스타일 계산 (하이라이트·사용자생성일 때 인라인 색 제거) ----------
  const computeNodeStyle = useCallback(
    (node: MyFlowNode): CSSProperties => {
      const base: CSSProperties = { ...(stylePreset.node as CSSProperties) };
      const isHighlighted = !!(node.data as any)?.highlighted;
      const isUserCreated = !!(node.data as any)?.userCreated;

      if (isHighlighted || isUserCreated) {
        delete (base as any).background;
        delete (base as any).backgroundColor;
        delete (base as any).backgroundImage;
        delete (base as any).borderColor;
        delete (base as any).boxShadow;
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

  // ---------- 실제 동작 콜백 ----------
  const onUpdateNodeReal: OnUpdateNode = useCallback(
    (id, newText, type) => {
      setFlowNodes((nds) => {
        const newNodes = nds.map((n) =>
          String(n.id) === String(id)
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

  const onHighlightChangeReal: OnHighlightChange = useCallback(
    async (nodeId, next) => {
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

  // ---------- 핸들러 ref & 브리지 (항상 안정) ----------
  const handlersRef = useRef<Handlers>({
    onUpdateNode: () => {},
    onHighlightChange: () => {},
    onAddChild: () => {},
    onDeleteNode: () => {},
    onDetachFromParent: () => {},
  });

  const onUpdateBridge: Handlers["onUpdateNode"] = useCallback((...args) => {
    return handlersRef.current.onUpdateNode(...args);
  }, []);
  const onHighlightBridge: Handlers["onHighlightChange"] = useCallback((...args) => {
    return handlersRef.current.onHighlightChange(...args);
  }, []);
  const onAddChildBridge: Handlers["onAddChild"] = useCallback((...args) => {
    return handlersRef.current.onAddChild(...args);
  }, []);
  const onDeleteNodeBridge: Handlers["onDeleteNode"] = useCallback((...args) => {
    return handlersRef.current.onDeleteNode(...args);
  }, []);
  const onDetachFromParentBridge: Handlers["onDetachFromParent"] = useCallback((...args) => {
    return handlersRef.current.onDetachFromParent(...args);
  }, []);

  // ---------- onAddChild / onDelete / onDetach ----------
  const onAddChildReal: OnAddChild = useCallback(
    (parentId) => {
      setFlowNodes((prevNodes) => {
        const pId = String(parentId);
        const parent = prevNodes.find((n) => String(n.id) === pId);

        const pos = parent
          ? {
              x: parent.position.x + 260 + Math.round(Math.random() * 30 - 15),
              y: parent.position.y + 160 + Math.round(Math.random() * 40 - 20),
            }
          : { x: 0, y: 0 };

        const newId = String(makeNodeId());

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
            userCreated: true, // ⬅⬅ 사용자 생성 표시
            // 런타임 콜백 주입
            onUpdate: onUpdateBridge,
            onHighlightChange: onHighlightBridge,
            onAddChild: onAddChildBridge,
            onDeleteNode: onDeleteNodeBridge,
            onDetachFromParent: onDetachFromParentBridge,
          } as any,
        };

        const nextNodes = [...prevNodes, { ...newNode, style: computeNodeStyle(newNode) }];

        setFlowEdges((prevEdges) => {
          const edge = { id: makeEdgeId(pId, newId), source: pId, target: newId };
          const nextEdges = [...prevEdges, edge];

          if (autoSave) saveTempDiagram(nextNodes, nextEdges);
          else setDirty(true);

          return nextEdges;
        });

        return nextNodes;
      });
    },
    [
      autoSave,
      saveTempDiagram,
      computeNodeStyle,
      onUpdateBridge,
      onHighlightBridge,
      onAddChildBridge,
      onDeleteNodeBridge,
      onDetachFromParentBridge,
    ]
  );

  const onDeleteNodeReal: OnDeleteNode = useCallback(
    (nodeId) => {
      setFlowNodes((prevNodes) => {
        const nextNodes = prevNodes.filter((n) => String(n.id) !== String(nodeId));
        setFlowEdges((prevEdges) => {
          const nextEdges = prevEdges.filter(
            (e) => String(e.source) !== String(nodeId) && String(e.target) !== String(nodeId)
          );
          if (autoSave) saveTempDiagram(nextNodes, nextEdges);
          else setDirty(true);
          return nextEdges;
        });
        return nextNodes;
      });
    },
    [autoSave, saveTempDiagram]
  );

  const onDetachFromParentReal: OnDetachFromParent = useCallback(
    (nodeId) => {
      setFlowEdges((prevEdges) => {
        const nextEdges = prevEdges.filter((e) => String(e.target) !== String(nodeId));
        if (autoSave) saveTempDiagram(flowNodes, nextEdges);
        else setDirty(true);
        return nextEdges;
      });
    },
    [autoSave, flowNodes, saveTempDiagram]
  );

  // ref 갱신
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

  // ---------- props → state 초기화 (userCreated 보존) ----------
  useEffect(() => {
    const styled: MyFlowNode[] = (nodes ?? []).map((node) => {
      const withRuntime: MyFlowNode = {
        ...node,
        id: String(node.id),
        type: "custom",
        data: {
          ...(node.data as any),
          onUpdate: onUpdateBridge,
          onHighlightChange: onHighlightBridge,
          onAddChild: onAddChildBridge,
          onDeleteNode: onDeleteNodeBridge,
          onDetachFromParent: onDetachFromParentBridge,
          highlighted: !!(node.data as any)?.highlighted,
          userCreated: !!(node.data as any)?.userCreated, // ⬅ 보존
        } as any,
      };
      return { ...withRuntime, style: computeNodeStyle(withRuntime) };
    });

    const mappedEdges = (edges ?? []).map((e) => ({
      ...e,
      id: String(e.id),
      source: String(e.source),
      target: String(e.target),
    })) as MyFlowEdge[];

    setFlowNodes(styled);
    setFlowEdges(mappedEdges);
  }, [
    nodes,
    edges,
    computeNodeStyle,
    onUpdateBridge,
    onHighlightBridge,
    onAddChildBridge,
    onDeleteNodeBridge,
    onDetachFromParentBridge,
  ]);

  // ---------- React Flow 변경 핸들러 ----------
  const onNodesChange = useCallback(
    (changes: any) => {
      const ended =
        Array.isArray(changes) &&
        changes.some((c) => c.type === "position" && c.dragging === false);

      setFlowNodes((prev) => {
        const next = applyNodeChanges(changes, prev);
        if (ended) {
          if (autoSave) saveTempDiagram(next, flowEdges);
          else setDirty(true);
        }
        return next;
      });
    },
    [autoSave, flowEdges, saveTempDiagram]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setFlowEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  // 드래그 종료 시 한번 더 저장 (보수적)
  const onNodeDragStop = useCallback(() => {
    if (autoSave) saveTempDiagram(flowNodes, flowEdges);
    else setDirty(true);
  }, [autoSave, flowNodes, flowEdges, saveTempDiagram]);

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
                  if (data?.diagram_json) {
                    const freshNodes = (data.diagram_json.nodes || []) as MyFlowNode[];
                    const mapped = freshNodes.map((n) => {
                      const withRuntime: MyFlowNode = {
                        ...n,
                        id: String(n.id),
                        type: "custom",
                        data: {
                          ...(n.data as any),
                          onUpdate: onUpdateBridge,
                          onHighlightChange: onHighlightBridge,
                          onAddChild: onAddChildBridge,
                          onDeleteNode: onDeleteNodeBridge,
                          onDetachFromParent: onDetachFromParentBridge,
                          highlighted: !!(n.data as any)?.highlighted,
                          userCreated: !!(n.data as any)?.userCreated,
                        } as any,
                      };
                      return { ...withRuntime, style: computeNodeStyle(withRuntime) };
                    });

                    const mappedEdges = (data.diagram_json.edges || []).map((e: any) => ({
                      ...e,
                      id: String(e.id),
                      source: String(e.source),
                      target: String(e.target),
                    })) as MyFlowEdge[];

                    setFlowNodes(mapped);
                    setFlowEdges(mappedEdges);
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
          onNodeDragStop={onNodeDragStop}
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
