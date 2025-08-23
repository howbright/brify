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
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import DiagramStyleSelector from "../DiagramStyleSelector";
import { CustomNode } from "./CustomNode";

// ⬇ 새로 분리된 훅/유틸
import { safeParseJSON, now, shortId, makeNodeId, makeEdgeId } from "@/utils/diagram";
import { useAutoSave } from "@/app/hooks/useAutoSave";
import { useNodeStyle } from "@/app/hooks/useNodeStyle";

const nodeTypes = { custom: CustomNode };

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

  // 자동저장(디바운스 + flush) 훅
  const { isSaving, save, flush } = useAutoSave(summaryId, 250);

  // 스타일 계산 훅
  const computeNodeStyle = useNodeStyle(stylePreset);

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
        // 자동저장
        save(newNodes, flowEdges);
        return newNodes;
      });
    },
    [flowEdges, save]
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
            userCreated: true,
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

          // 자동저장 (디바운스)
          save(nextNodes, nextEdges);
          return nextEdges;
        });

        return nextNodes;
      });
    },
    [
      save,
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
          // 자동저장 (디바운스)
          save(nextNodes, nextEdges);
          return nextEdges;
        });
        return nextNodes;
      });
    },
    [save]
  );

  const onDetachFromParentReal: OnDetachFromParent = useCallback(
    (nodeId) => {
      setFlowEdges((prevEdges) => {
        const nextEdges = prevEdges.filter((e) => String(e.target) !== String(nodeId));
        // 자동저장 (디바운스)
        save(flowNodes, nextEdges);
        return nextEdges;
      });
    },
    [flowNodes, save]
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
          userCreated: !!(node.data as any)?.userCreated,
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
        // 드래그가 ‘끝났을 때’만 저장 요청
        if (ended) save(next, flowEdges);
        return next;
      });
    },
    [flowEdges, save]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setFlowEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  // 드래그 종료 시 보수적으로 flush
  const onNodeDragStop = useCallback(() => {
    flush();
  }, [flush]);

  // ---------- UI ----------
  return (
    <div className="h-[600px] border rounded bg-white relative">
      {/* 상단 바 */}
      <div className="absolute top-2 right-2 flex items-center gap-2 z-10 bg-white/80 px-3 py-1 rounded shadow">
        <span className="text-xs text-gray-500">
          {isSaving ? "자동 저장 중..." : "모두 저장됨"}
        </span>
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
