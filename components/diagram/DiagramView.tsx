// components/diagram/DiagramView.tsx
"use client";

import { MyFlowEdge, MyFlowNode } from "@/app/types/diagram";
import { classicStyle } from "@/styles/presets";
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowInstance,
  ReactFlowProvider,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type EdgeChange,
  type Connection,
  OnInit,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import DiagramStyleSelector from "../DiagramStyleSelector";
import { CustomNode } from "./CustomNode";

// 분리된 유틸/훅
import { useAutoSave } from "@/app/hooks/useAutoSave";
import type { DiagramSnapshot } from "@/app/hooks/useHistory";
import { useHistory } from "@/app/hooks/useHistory";
import { useNodeStyle } from "@/app/hooks/useNodeStyle";
import {
  makeEdgeId,
  makeNodeId,
  now,
  safeParseJSON,
  shortId,
} from "@/utils/diagram";
import ConfirmDialog from "../ui/ConfirmDialog";

// ELK
import type { ElkNode, ElkExtendedEdge, LayoutOptions } from "elkjs";
import { getElk } from "@/app/lib/diagram/reactflow-auto-layout";

const nodeTypes = { custom: CustomNode };

// 레이아웃 알고리즘 타입
type ElkAlgorithm = "layered" | "radial" | "force" | "stress" | "random";

// 엣지 타입들
type EdgeType = "bezier" | "simplebezier" | "smoothstep" | "step" | "straight";

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

  // 컴포넌트 내부 state
  const [openResetDialog, setOpenResetDialog] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // ReactFlow 강제 리마운트 키
  const [rfKey, setRfKey] = useState(0);

  // 레이아웃 알고리즘 현재 선택 상태
  const [layoutAlg, setLayoutAlg] = useState<ElkAlgorithm>("layered");

  // 엣지 스타일 + 세부 옵션 상태
  const [edgeType, setEdgeType] = useState<EdgeType>("smoothstep");
  const [bezierCurvature, setBezierCurvature] = useState<number>(0.25); // 0~1
  const [stepBorderRadius, setStepBorderRadius] = useState<number>(8); // px
  const [stepOffset, setStepOffset] = useState<number>(20); // px
  const [smoothBorderRadius, setSmoothBorderRadius] = useState<number>(12); // px
  const [smoothOffset, setSmoothOffset] = useState<number>(20); // px

  // ReactFlow 인스턴스 보관 (fitView 호출용)
  const rfInstanceRef = useRef<ReactFlowInstance<MyFlowNode, MyFlowEdge> | null>(null);

  // onInit
  const onInit: OnInit<MyFlowNode, MyFlowEdge> = useCallback((instance) => {
    rfInstanceRef.current = instance;
    requestAnimationFrame(() => {
      instance.fitView({
        padding: 0.02,
        includeHiddenNodes: false,
        maxZoom: 1.4,
      });
    });
  }, []);
  // 현재 edgeType에 맞는 pathOptions 생성
  const currentPathOptions = useMemo(() => {
    if (edgeType === "bezier" || edgeType === "simplebezier") {
      return { curvature: bezierCurvature };
    }
    if (edgeType === "smoothstep") {
      return { borderRadius: smoothBorderRadius, offset: smoothOffset };
    }
    if (edgeType === "step") {
      return { borderRadius: stepBorderRadius, offset: stepOffset };
    }
    return undefined;
  }, [
    edgeType,
    bezierCurvature,
    smoothBorderRadius,
    smoothOffset,
    stepBorderRadius,
    stepOffset,
  ]);

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

      // 낙관적 갱신
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

      // 서버 저장
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
        console.log(`[HL ${reqId}] done in ${dt}ms`);
      }
    },
    [summaryId, computeNodeStyle, flowNodes, flowEdges, history]
  );

  // 레이아웃 적용
  const applyElkLayout = useCallback(
    async (alg: ElkAlgorithm = layoutAlg) => {
      try {
        const elk = await getElk();

        // ===== 1) ELK 그래프로 변환 =====
        const DEFAULT_W = 220;
        const DEFAULT_H = 100;

        const elkChildren: ElkNode[] = flowNodes.map((n) => ({
          id: String(n.id),
          width: (n as any).width ?? (n.style as any)?.width ?? DEFAULT_W,
          height: (n as any).height ?? (n.style as any)?.height ?? DEFAULT_H,
        }));

        const elkEdges: ElkExtendedEdge[] = flowEdges.map((e) => ({
          id: String(e.id),
          sources: [String(e.source)],
          targets: [String(e.target)],
        }));

        // ===== 2) 알고리즘별 옵션 =====
        const base: Record<string, string> = {
          "elk.algorithm": alg,
          "elk.spacing.nodeNode": "60",
          "elk.spacing.edgeNode": "24",
        };

        if (alg === "layered") {
          base["elk.direction"] = "DOWN"; // 필요시 UI로 확장 (UP/LEFT/RIGHT)
          base["elk.layered.spacing.nodeNodeBetweenLayers"] = "40";
          base["elk.layered.crossingMinimization.strategy"] = "LAYER_SWEEP";
        } else if (alg === "radial") {
          base["elk.radial.radius"] = "auto";
          base["elk.radial.minimalRadius"] = "80";
        } else if (alg === "force") {
          base["elk.quality"] = "max";
          base["elk.force.iterations"] = "500";
          base["elk.force.repulsivePower"] = "1.0";
        } else if (alg === "stress") {
          base["elk.stress.descent.threshold"] = "0.01";
          base["elk.stress.descent.maxIterations"] = "500";
        }

        const layoutOptions = base as unknown as LayoutOptions;

        // ===== 3) 레이아웃 실행 =====
        const result = await elk.layout({
          id: "root",
          children: elkChildren,
          edges: elkEdges,
          layoutOptions,
        });

        // ===== 4) 결과 좌표/크기 맵 =====
        type P = { x: number; y: number; w: number; h: number };
        const pos = new Map<string, P>();
        (result.children ?? []).forEach((c: any) => {
          pos.set(String(c.id), {
            x: (c.x ?? 0) as number,
            y: (c.y ?? 0) as number,
            w: (c.width ?? DEFAULT_W) as number,
            h: (c.height ?? DEFAULT_H) as number,
          });
        });

        // ===== 5) 노드 업데이트 =====
        const nextNodes = flowNodes.map((n) => {
          const p = pos.get(String(n.id));
          return p
            ? { ...n, position: { x: p.x, y: p.y }, dragging: false }
            : n;
        });

        // ===== 6) 엣지 핸들 방향 자동 지정 + 현재 edgeType & pathOptions 적용 =====
        const pickSideByVector = (dx: number, dy: number) => {
          if (Math.abs(dx) >= Math.abs(dy)) {
            return dx >= 0 ? "right" : "left";
          } else {
            return dy >= 0 ? "bottom" : "top";
          }
        };
        const toHandles = (side: "right" | "left" | "top" | "bottom") => {
          switch (side) {
            case "right":
              return { source: "r-out", target: "l-in" };
            case "left":
              return { source: "l-out", target: "r-in" };
            case "top":
              return { source: "t-out", target: "b-in" };
            case "bottom":
              return { source: "b-out", target: "t-in" };
          }
        };

        const nextEdges = flowEdges.map((e) => {
          const s = pos.get(String(e.source));
          const t = pos.get(String(e.target));
          if (!s || !t)
            return {
              ...e,
              type: edgeType as any,
              // XYFlow v11: pathOptions를 직접 지원. 안전하게 data에도 같이 넣자.
              pathOptions: currentPathOptions as any,
              data: { ...(e as any).data, pathOptions: currentPathOptions },
            };

          const sx = s.x + s.w / 2;
          const sy = s.y + s.h / 2;
          const tx = t.x + t.w / 2;
          const ty = t.y + t.h / 2;

          const side = pickSideByVector(tx - sx, ty - sy);
          const { source, target } = toHandles(side);

          return {
            ...e,
            sourceHandle: source,
            targetHandle: target,
            type: edgeType as any,
            pathOptions: currentPathOptions as any,
            data: { ...(e as any).data, pathOptions: currentPathOptions },
          };
        });

        // ===== 7) 상태 반영 & 보기 정렬 & 저장 =====
        setFlowNodes(nextNodes);
        setFlowEdges(nextEdges);

        requestAnimationFrame(() => {
          rfInstanceRef.current?.fitView({
            padding: 0.06,
            includeHiddenNodes: false,
            maxZoom: 1.4,
          });
        });

        save(nextNodes, nextEdges);
        setLayoutAlg(alg);
        toast.success(`레이아웃 적용됨: ${alg}`);
      } catch (e: any) {
        console.error(e);
        toast.error("레이아웃 적용 실패", {
          description: e?.message ?? String(e),
        });
      }
    },
    [flowNodes, flowEdges, layoutAlg, edgeType, currentPathOptions, save]
  );

  // 새 엣지 연결 시 현재 edgeType & pathOptions 적용
  const onConnect = useCallback(
    (params: Connection) => {
      setFlowEdges((eds) =>
        addEdge(
          {
            ...params,
            type: edgeType,
            pathOptions: currentPathOptions as any,
            data: { ...(params as any).data, pathOptions: currentPathOptions },
          } as any,
          eds
        )
      );
      // 저장은 setFlowEdges 이후 비동기 반영 → 약간 지연 후 flush하거나 onEdgesChange에서 저장
      setTimeout(() => save(flowNodes, flowEdges), 0);
    },
    [edgeType, currentPathOptions, flowNodes, flowEdges, save]
  );

  // ---------- 핸들러 ref & 브리지 ----------
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
            type: edgeType as any,
            pathOptions: currentPathOptions as any,
            data: { pathOptions: currentPathOptions },
          } as any;
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
      edgeType,
      currentPathOptions,
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
        type: (e as any).type ?? (edgeType as any),
        pathOptions:
          (e as any).pathOptions ?? (currentPathOptions as any),
        data: {
          ...(e as any).data,
          pathOptions:
            (e as any).data?.pathOptions ?? currentPathOptions,
        },
      }));

      // 즉시 화면에 반영
      setFlowNodes(styled);
      setFlowEdges(mappedEdges);
      history.clear();

      // ReactFlow 재마운트(선택)
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
    edgeType,
    currentPathOptions,
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
      type: ((e as any).type ?? edgeType) as any,
      pathOptions:
        (e as any).pathOptions ?? (currentPathOptions as any),
      data: {
        ...(e as any).data,
        pathOptions:
          (e as any).data?.pathOptions ?? currentPathOptions,
      },
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
    edgeType,
    currentPathOptions,
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

  // ---------- 엣지 타입/옵션 적용 유틸 ----------
  const refreshAllEdgesWithCurrentOptions = useCallback(() => {
    setFlowEdges((prev) => {
      const updated = prev.map((e) => ({
        ...e,
        type: edgeType as any,
        pathOptions: currentPathOptions as any,
        data: { ...(e as any).data, pathOptions: currentPathOptions },
      }));
      // 저장
      save(flowNodes, updated);
      return updated;
    });
  }, [edgeType, currentPathOptions, flowNodes, save]);

  const applyEdgeType = useCallback(
    (t: EdgeType) => {
      setEdgeType(t);
      // 타입 변경 즉시 반영
      setFlowEdges((prev) => {
        const updated = prev.map((e) => ({
          ...e,
          type: t as any,
          pathOptions: currentPathOptions as any,
          data: { ...(e as any).data, pathOptions: currentPathOptions },
        }));
        save(flowNodes, updated);
        return updated;
      });
    },
    [currentPathOptions, flowNodes, save]
  );

  // 옵션 슬라이더들이 바뀔 때마다 전체 엣지 갱신
  useEffect(() => {
    refreshAllEdgesWithCurrentOptions();
  }, [refreshAllEdgesWithCurrentOptions]);

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
        type: ((e as any).type ?? edgeType) as any,
        pathOptions:
          (e as any).pathOptions ?? (currentPathOptions as any),
        data: {
          ...(e as any).data,
          pathOptions:
            (e as any).data?.pathOptions ?? currentPathOptions,
        },
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
      edgeType,
      currentPathOptions,
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
        {/* Layout 선택 */}
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-500 mr-1">Layout:</span>
          {(["layered", "radial", "force", "stress"] as ElkAlgorithm[]).map(
            (alg) => (
              <button
                key={alg}
                onClick={() => applyElkLayout(alg)}
                className={`px-2 py-1 text-xs rounded border transition-transform hover:scale-[1.02] ${
                  layoutAlg === alg
                    ? "bg-gray-900 text-white"
                    : "border-gray-300 hover:bg-gray-100"
                }`}
              >
                {alg}
              </button>
            )
          )}
        </div>

        <div className="w-px h-5 bg-gray-200 mx-2" />

        {/* Edge 스타일 선택 */}
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-500 mr-1">Edge:</span>
          {(
            ["bezier", "simplebezier", "smoothstep", "step", "straight"] as EdgeType[]
          ).map((t) => (
            <button
              key={t}
              onClick={() => applyEdgeType(t)}
              className={`px-2 py-1 text-xs rounded border transition-transform hover:scale-[1.02] ${
                edgeType === t
                  ? "bg-gray-900 text-white"
                  : "border-gray-300 hover:bg-gray-100"
              }`}
              title={t}
            >
              {t}
            </button>
          ))}
        </div>

        {/* 엣지 디테일 옵션 (타입별로 노출) */}
        {edgeType === "bezier" || edgeType === "simplebezier" ? (
          <div className="flex items-center gap-2 ml-2">
            <label className="text-xs text-gray-500">curvature</label>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={bezierCurvature}
              onChange={(e) => setBezierCurvature(Number(e.target.value))}
            />
            <span className="text-xs text-gray-600 w-8 text-right">
              {bezierCurvature.toFixed(2)}
            </span>
          </div>
        ) : null}

        {edgeType === "step" || edgeType === "smoothstep" ? (
          <>
            <div className="flex items-center gap-2 ml-2">
              <label className="text-xs text-gray-500">radius</label>
              <input
                type="range"
                min={0}
                max={24}
                step={1}
                value={
                  edgeType === "smoothstep" ? smoothBorderRadius : stepBorderRadius
                }
                onChange={(e) =>
                  edgeType === "smoothstep"
                    ? setSmoothBorderRadius(Number(e.target.value))
                    : setStepBorderRadius(Number(e.target.value))
                }
              />
              <span className="text-xs text-gray-600 w-6 text-right">
                {edgeType === "smoothstep"
                  ? smoothBorderRadius
                  : stepBorderRadius}
              </span>
            </div>
            <div className="flex items-center gap-2 ml-2">
              <label className="text-xs text-gray-500">offset</label>
              <input
                type="range"
                min={0}
                max={80}
                step={2}
                value={edgeType === "smoothstep" ? smoothOffset : stepOffset}
                onChange={(e) =>
                  edgeType === "smoothstep"
                    ? setSmoothOffset(Number(e.target.value))
                    : setStepOffset(Number(e.target.value))
                }
              />
              <span className="text-xs text-gray-600 w-8 text-right">
                {edgeType === "smoothstep" ? smoothOffset : stepOffset}
              </span>
            </div>
          </>
        ) : null}

        <div className="w-px h-5 bg-gray-200 mx-2" />

        <button
          onClick={() => setOpenResetDialog(true)}
          disabled={isResetting}
          className="px-3 py-1 text-sm rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-60 transition-transform hover:scale-[1.02]"
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
          onInit={onInit}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeDragStop={onNodeDragStop}
          onConnect={onConnect}
          fitView
          fitViewOptions={{ padding: 0.03, includeHiddenNodes: false }}
          minZoom={0.2}
          maxZoom={1.6}
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
        onConfirm={doReset}
        title="정말 초기 상태로 되돌릴까요?"
        description="편집한 내용이 삭제되고, 처음 AI가 만든 다이어그램으로 돌아갑니다."
        actionLabel="초기화"
      />
    </div>
  );
}
