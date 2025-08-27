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

// 분리된 유틸/훅
import {
  safeParseJSON,
  now,
  shortId,
  makeNodeId,
  makeEdgeId,
} from "@/utils/diagram";
import { useAutoSave } from "@/app/hooks/useAutoSave";
import { useNodeStyle } from "@/app/hooks/useNodeStyle";
import { useHistory } from "@/app/hooks/useHistory";
import type { DiagramSnapshot } from "@/app/hooks/useHistory";
import ConfirmDialog from "../ui/ConfirmDialog";

const nodeTypes = { custom: CustomNode };

// ---------- 타입 ----------
type NodeId = string | number;
type OnUpdateNode = (
  id: string,
  newText: string,
  type: "title" | "description"
) => void;
type OnHighlightChange = (
  nodeId: string,
  next: boolean
) => void | Promise<void>;
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

export default function DiagramView({
  summaryId,
  nodes,
  edges,
}: DiagramViewProps) {
  // ---------- state ----------
  const [stylePreset, setStylePreset] = useState(classicStyle);
  const [stylePickerOpen, setStylePickerOpen] = useState(false);

  const [flowNodes, setFlowNodes] = useState<MyFlowNode[]>([]);
  const [flowEdges, setFlowEdges] = useState<MyFlowEdge[]>([]);

  // 자동저장(디바운스 + flush)
  const { isSaving, save, flush } = useAutoSave(summaryId, 250);

  // 스타일 계산 훅 (memoized)
  const computeNodeStyle = useNodeStyle(stylePreset);

  // 히스토리(Undo/Redo)
  const history = useHistory(100);

  // 컴포넌트 내부 state (기존 state들 옆)
  const [openResetDialog, setOpenResetDialog] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // (선택) ReactFlow 강제 리마운트 키
  const [rfKey, setRfKey] = useState(0);

  // ---------- 실제 동작 콜백 ----------
  const onUpdateNodeReal: OnUpdateNode = useCallback(
    (id, newText, type) => {
      history.push({ nodes: flowNodes, edges: flowEdges });

      setFlowNodes((nds) => {
        const newNodes = nds.map((n) =>
          String(n.id) === String(id)
            ? {
                ...n,
                data: {
                  ...(n.data as any),
                  title: type === "title" ? newText : (n.data as any).title,
                  description:
                    type === "description"
                      ? newText
                      : (n.data as any).description,
                } as any,
              }
            : n
        );
        save(newNodes, flowEdges);
        return newNodes;
      });
    },
    [flowNodes, flowEdges, save, history]
  );

  const onHighlightChangeReal: OnHighlightChange = useCallback(
    async (nodeId, next) => {
      history.push({ nodes: flowNodes, edges: flowEdges });

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

          const reason = json?.message
            ? `${json.message}${
                json?.detail ? ` — ${JSON.stringify(json.detail)}` : ""
              }`
            : rawText || "Unknown error";
          toast.error(
            `하이라이트 저장 실패 (${res.status} ${res.statusText})`,
            { description: reason }
          );
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
    [summaryId, computeNodeStyle, flowNodes, flowEdges, history]
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
  const onHighlightBridge: Handlers["onHighlightChange"] = useCallback(
    (...args) => {
      return handlersRef.current.onHighlightChange(...args);
    },
    []
  );
  const onAddChildBridge: Handlers["onAddChild"] = useCallback((...args) => {
    return handlersRef.current.onAddChild(...args);
  }, []);
  const onDeleteNodeBridge: Handlers["onDeleteNode"] = useCallback(
    (...args) => {
      return handlersRef.current.onDeleteNode(...args);
    },
    []
  );
  const onDetachFromParentBridge: Handlers["onDetachFromParent"] = useCallback(
    (...args) => {
      return handlersRef.current.onDetachFromParent(...args);
    },
    []
  );

  // ---------- onAddChild / onDelete / onDetach ----------
  const onAddChildReal: OnAddChild = useCallback(
    (parentId) => {
      history.push({ nodes: flowNodes, edges: flowEdges });

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

        const nextNodes = [
          ...prevNodes,
          { ...newNode, style: computeNodeStyle(newNode) },
        ];

        setFlowEdges((prevEdges) => {
          const edge = {
            id: makeEdgeId(pId, newId),
            source: pId,
            target: newId,
          };
          const nextEdges = [...prevEdges, edge];

          save(nextNodes, nextEdges);
          return nextEdges;
        });

        return nextNodes;
      });
    },
    [
      flowNodes,
      flowEdges,
      save,
      computeNodeStyle,
      onUpdateBridge,
      onHighlightBridge,
      onAddChildBridge,
      onDeleteNodeBridge,
      onDetachFromParentBridge,
      history,
    ]
  );

  const onDeleteNodeReal: OnDeleteNode = useCallback(
    (nodeId) => {
      history.push({ nodes: flowNodes, edges: flowEdges });

      setFlowNodes((prevNodes) => {
        const nextNodes = prevNodes.filter(
          (n) => String(n.id) !== String(nodeId)
        );
        setFlowEdges((prevEdges) => {
          const nextEdges = prevEdges.filter(
            (e) =>
              String(e.source) !== String(nodeId) &&
              String(e.target) !== String(nodeId)
          );
          save(nextNodes, nextEdges);
          return nextEdges;
        });
        return nextNodes;
      });
    },
    [flowNodes, flowEdges, save, history]
  );

  const onDetachFromParentReal: OnDetachFromParent = useCallback(
    (nodeId) => {
      history.push({ nodes: flowNodes, edges: flowEdges });

      setFlowEdges((prevEdges) => {
        const nextEdges = prevEdges.filter(
          (e) => String(e.target) !== String(nodeId)
        );
        save(flowNodes, nextEdges);
        return nextEdges;
      });
    },
    [flowNodes, flowEdges, save, history]
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

  const doReset = useCallback(async () => {
    try {
      setIsResetting(true);
      await flush(); // 자동저장 큐 비우기

      const res = await fetch("/api/summary/reset-diagram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ summaryId }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error("초기화 실패", { description: json?.message ?? "" });
        return;
      }

      const effective = json?.effective_diagram_json;
      const baseNodes: any[] = Array.isArray(effective?.nodes)
        ? effective.nodes
        : [];
      const baseEdges: any[] = Array.isArray(effective?.edges)
        ? effective.edges
        : [];

      // 런타임 콜백 주입 + 스타일 적용
      const styled: MyFlowNode[] = baseNodes.map((node) => {
        const withRuntime: MyFlowNode = {
          ...node,
          id: String(node.id),
          type: "custom" as const,
          data: {
            ...(node.data || {}),
            onUpdate: onUpdateBridge,
            onHighlightChange: onHighlightBridge,
            onAddChild: onAddChildBridge,
            onDeleteNode: onDeleteNodeBridge,
            onDetachFromParent: onDetachFromParentBridge,
            highlighted: !!node?.data?.highlighted,
            userCreated: !!node?.data?.userCreated,
          } as any,
        };
        return { ...withRuntime, style: computeNodeStyle(withRuntime) };
      });

      const mappedEdges: MyFlowEdge[] = baseEdges.map((e: any) => ({
        ...e,
        id: String(e.id),
        source: String(e.source),
        target: String(e.target),
      }));

      // 즉시 화면에 반영
      setFlowNodes(styled);
      setFlowEdges(mappedEdges);
      history.clear();

      // (선택) ReactFlow 내부 스토어를 깔끔히 비우고 재마운트
      setRfKey((k) => k + 1);

      toast.success("초기 상태로 되돌렸어요.");
    } catch (err) {
      console.error(err);
      toast.error("초기화 중 오류가 발생했습니다.");
    } finally {
      setIsResetting(false);
      setOpenResetDialog(false);
    }
  }, [
    summaryId,
    flush,
    computeNodeStyle,
    onUpdateBridge,
    onHighlightBridge,
    onAddChildBridge,
    onDeleteNodeBridge,
    onDetachFromParentBridge,
    history,
  ]);

  // ---------- props → state 초기화 (무한루프 방지 가드) ----------
  const lastInitSigRef = useRef<string>("");
  useEffect(() => {
    const sig = JSON.stringify({
      n: (nodes ?? []).map((n) => String(n.id)),
      e: (edges ?? []).map((e) => String(e.id)),
    });
    if (sig === lastInitSigRef.current) return;
    lastInitSigRef.current = sig;

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
    history.clear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    nodes,
    edges,
    onUpdateBridge,
    onHighlightBridge,
    onAddChildBridge,
    onDeleteNodeBridge,
    onDetachFromParentBridge,
    history,
  ]);

  // 스타일 프리셋이 바뀔 때만 스타일 재계산
  useEffect(() => {
    setFlowNodes((prev) =>
      prev.map((n) => ({ ...n, style: computeNodeStyle(n) }))
    );
  }, [computeNodeStyle]);

  // ---------- React Flow 변경 핸들러 ----------
  const onNodesChange = useCallback(
    (changes: any) => {
      const ended =
        Array.isArray(changes) &&
        changes.some((c) => c.type === "position" && c.dragging === false);

      setFlowNodes((prev) => {
        if (ended) history.push({ nodes: prev, edges: flowEdges });
        const next = applyNodeChanges(changes, prev);
        if (ended) save(next, flowEdges);
        return next;
      });
    },
    [flowEdges, save, history]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) =>
      setFlowEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  // 드래그 종료 시 보수적으로 flush
  const onNodeDragStop = useCallback(() => {
    flush();
  }, [flush]);

  // ---------- 단축키: Undo/Redo ----------
  const applySnapshot = useCallback(
    (snap: DiagramSnapshot | null) => {
      if (!snap) return;

      const styled: MyFlowNode[] = (snap.nodes ?? []).map((node) => {
        const withRuntime: MyFlowNode = {
          ...node,
          id: String(node.id),
          type: "custom" as const,
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

      const mappedEdges = (snap.edges ?? []).map((e) => ({
        ...e,
        id: String(e.id),
        source: String(e.source),
        target: String(e.target),
      })) as MyFlowEdge[];

      setFlowNodes(styled);
      setFlowEdges(mappedEdges);
      save(styled, mappedEdges);
      flush();
    },
    [
      computeNodeStyle,
      onUpdateBridge,
      onHighlightBridge,
      onAddChildBridge,
      onDeleteNodeBridge,
      onDetachFromParentBridge,
      save,
      flush,
    ]
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMac = /Mac|iPhone|iPad|iPod/i.test(navigator.platform);
      const mod = isMac ? e.metaKey : e.ctrlKey;
      if (!mod) return;

      const key = e.key.toLowerCase();

      if (key === "z" && !e.altKey) {
        e.preventDefault();
        const snap = e.shiftKey
          ? history.redo({ nodes: flowNodes, edges: flowEdges })
          : history.undo({ nodes: flowNodes, edges: flowEdges });
        applySnapshot(snap);
      } else if (key === "y") {
        e.preventDefault();
        const snap = history.redo({ nodes: flowNodes, edges: flowEdges });
        applySnapshot(snap);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [history, flowNodes, flowEdges, applySnapshot]);

  // ---------- UI ----------
  return (
    <div className="h-[600px] border rounded bg-white relative">
      {/* 상단 바 */}
      <div className="absolute top-2 right-2 flex items-center gap-2 z-10 bg-white/80 px-3 py-1 rounded shadow">
        <button
          onClick={() => setOpenResetDialog(true)}
          disabled={isResetting}
          className="px-3 py-1 text-sm rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-60"
        >
          {isResetting ? "초기화 중..." : "초기화"}
        </button>
        <span className="text-xs text-gray-500">
          {isSaving ? "자동 저장 중..." : "모두 저장됨"}
        </span>
      </div>

      <ReactFlowProvider>
        <ReactFlow<MyFlowNode, MyFlowEdge>
          key={rfKey}    
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
      <ConfirmDialog
        open={openResetDialog}
        onOpenChange={setOpenResetDialog}
        onConfirm={doReset} // ← 아래 (B)에서 정의
        title="정말 초기 상태로 되돌릴까요?"
        description="임시 저장본이 삭제되고, 처음 AI가 만든 다이어그램으로 돌아갑니다."
        actionLabel="초기화"
      />
    </div>
  );
}
