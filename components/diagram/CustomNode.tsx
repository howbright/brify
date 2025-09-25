// components/diagram/CustomNode.tsx
"use client";

import { MyFlowNode } from "@/app/types/diagram";
import { Handle, NodeProps, Position, useReactFlow } from "@xyflow/react";
import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import ConfirmDialog from "../ui/ConfirmDialog";

// ---- 타입 보조 ----
type Side = "t" | "r" | "b" | "l";
type IO = "in" | "out";
type HandleCounts = Partial<Record<`${Side}-${IO}`, number>>;

// 런타임에서 주입되는 확장 필드
type RuntimeData = MyFlowNode["data"] & {
  highlighted?: boolean;
  userCreated?: boolean;

  // 동적 핸들 개수 (레이아웃 유틸이 채워줌)
  handleCounts?: HandleCounts;

  // (선택) 루트 정책이 있으면 in 핸들 숨기는 데 쓸 수 있음
  isRoot?: boolean;
  parentId?: string | null;

  onHighlightChange?: (id: string, next: boolean) => void;
  onUpdate?: (id: string, text: string, type: "title" | "description") => void;
  onAddChild?: (parentId: string) => void;
  onDeleteNode?: (nodeId: string) => void;
  onDetachFromParent?: (nodeId: string) => void;
};

export function CustomNode({ id, data, selected }: NodeProps<MyFlowNode>) {
  const d = data as RuntimeData;
  const isTitle = d.nodeType === "title";

  // 편집 상태
  const [editing, setEditing] = useState(false);
  const [tempText, setTempText] = useState(d.title || d.description);

  // 하이라이트 로컬 상태 ↔ 부모 동기화
  const [hl, setHl] = useState(!!d.highlighted);
  useEffect(() => setHl(!!d.highlighted), [d.highlighted]);

  const toggleHighlight = () => {
    const next = !hl;
    setHl(next);
    d.onHighlightChange?.(id, next);
  };

  // 편집 중 드래그 OFF
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { setNodes } = useReactFlow();
  useEffect(() => {
    setNodes((nds) =>
      nds.map((n) => (n.id === id ? { ...n, draggable: !editing } : n))
    );
    return () =>
      setNodes((nds) =>
        nds.map((n) => (n.id === id ? { ...n, draggable: true } : n))
      );
  }, [editing, id, setNodes]);

  const startEdit = () => {
    setEditing(true);
    setTempText(d.title || d.description);
  };
  const finishEdit = () => {
    setEditing(false);
    d.onUpdate?.(id, tempText, d.nodeType);
  };
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      finishEdit();
    }
  };

  // textarea auto-resize
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [tempText, editing]);

  // ======== 배경/테두리 “서로 배타적” 분기 ========
  const isNote = !!d.userCreated;
  const isHl = hl && !isNote; // note가 우선: note면 하이라이트 배경은 비활성
  const baseBg = isTitle
    ? "bg-blue-100 border-blue-300 text-blue-900"
    : "bg-gray-100 border-gray-300 text-gray-700";
  const noteBg =
    "bg-amber-100 border-amber-300 text-amber-900 shadow-[0_6px_12px_-4px_rgba(245,158,11,0.35)] -rotate-1";
  const hlBg =
    "bg-gradient-to-br from-fuchsia-50 to-indigo-50 border-fuchsia-300";

  const colorBlock = isNote ? noteBg : isHl ? hlBg : baseBg;

  // 링/글로우도 note는 별도 경로
  const ringBlock = selected
    ? isNote
      ? "ring-2 ring-amber-400 ring-offset-2 ring-offset-white"
      : isHl
      ? "ring-2 ring-fuchsia-500 ring-offset-2 ring-offset-white"
      : "ring-2 ring-blue-400"
    : isNote
    ? "shadow-md shadow-amber-300/40"
    : isHl
    ? "ring-2 ring-fuchsia-400 ring-offset-2 ring-offset-white shadow-lg shadow-fuchsia-300/50 scale-[1.01]"
    : "";

  // 삭제 Confirm 다이얼로그 상태
  const handleDelete = () => {
    d.onDeleteNode?.(id);
  };

  // ======== 동적 핸들 렌더링 ========
  const hc = d.handleCounts || ({} as HandleCounts);

  function renderHandles(side: Side, io: IO, count = 0) {
    if (!count || count <= 0) return null;

    const position =
      side === "t" ? Position.Top :
      side === "b" ? Position.Bottom :
      side === "l" ? Position.Left  : Position.Right;

    return Array.from({ length: count }).map((_, i) => {
      const idStr = `${side}-${io}-${i}`;
      const pct = ((i + 1) / (count + 1)) * 100;

      const posProps =
        side === "t" || side === "b"
          ? { style: { left: `${pct}%` } as React.CSSProperties }
          : { style: { top: `${pct}%` } as React.CSSProperties };

      return (
        <Handle
          key={idStr}
          id={idStr}
          type={io === "in" ? "target" : "source"}
          position={position}
          {...posProps}
        />
      );
    });
  }

  // 폴백: handleCounts가 전혀 없으면 기존 4방향 핸들을 유지
  const useFallbackStaticHandles =
    !hc["t-in"] && !hc["b-in"] && !hc["l-in"] && !hc["r-in"] &&
    !hc["t-out"] && !hc["b-out"] && !hc["l-out"] && !hc["r-out"];

  return (
    <div
      className={clsx(
        "relative rounded-lg border p-4 shadow-sm text-sm max-w-[300px] break-words transition",
        colorBlock,
        ringBlock,
        editing ? "cursor-text nopan" : "cursor-pointer"
      )}
      onDoubleClick={startEdit}
      data-highlighted={hl ? "true" : "false"}
      data-usercreated={isNote ? "true" : "false"}
    >
      {/* ⭐ 하이라이트 배지 (note일 땐 숨김) */}
      {isHl && !editing && !selected && (
        <div
          className="absolute -top-2 -right-2 z-10 nodrag nopan nowheel"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div className="rounded-full bg-fuchsia-600 text-white shadow p-1">
            <svg
              viewBox="0 0 24 24"
              className="w-3.5 h-3.5"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
            </svg>
          </div>
        </div>
      )}

      {/* 우측 액션 */}
      {selected && !editing && (
        <div
          className="absolute -right-2 top-1/2 -translate-y-1/2 flex flex-col gap-1 z-10 nodrag nopan nowheel"
          onPointerDown={(e) => e.stopPropagation()}
        >
          {/* 편집 */}
          <button
            type="button"
            title="편집"
            aria-label="편집"
            className="rounded-full bg-white border border-blue-300 text-blue-700 shadow p-1 hover:bg-blue-50"
            onClick={startEdit}
          >
            <svg
              viewBox="0 0 24 24"
              className="w-4 h-4"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zm2.92 2.33H5v-.92l8.06-8.06.92.92L5.92 19.58zM20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.33-2.33a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
            </svg>
          </button>

          {/* 하이라이트 (note 모드에서도 토글은 가능) */}
          <button
            type="button"
            title="하이라이트"
            aria-label="하이라이트"
            aria-pressed={hl}
            onClick={toggleHighlight}
            className={clsx(
              "rounded-full border shadow p-1",
              hl
                ? "bg-fuchsia-600 text-white border-fuchsia-600"
                : "bg-white text-fuchsia-700 border-fuchsia-300 hover:bg-fuchsia-50"
            )}
          >
            <svg
              viewBox="0 0 24 24"
              className="w-4 h-4"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
            </svg>
          </button>

          {/* 자식 추가 */}
          <button
            type="button"
            title="자식 노드 추가"
            aria-label="자식 노드 추가"
            className="rounded-full bg-white border border-emerald-300 text-emerald-700 shadow p-1 hover:bg-emerald-50"
            onClick={() => d.onAddChild?.(id)}
          >
            <svg
              viewBox="0 0 24 24"
              className="w-4 h-4"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M11 11V6h2v5h5v2h-5v5h-2v-5H6v-2h5z" />
            </svg>
          </button>

          {/* 노드 삭제 → ConfirmDialog 사용 */}
          <button
            type="button"
            title="노드 삭제"
            aria-label="노드 삭제"
            className="rounded-full bg-white border border-rose-300 text-rose-700 shadow p-1 hover:bg-rose-50"
            onClick={handleDelete}
          >
            <svg
              viewBox="0 0 24 24"
              className="w-4 h-4"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M6 7h12v2H6V7zm2 3h8l-1 9H9l-1-9zm3-6h2l1 1h5v2H5V5h5l1-1z" />
            </svg>
          </button>
        </div>
      )}

      {editing ? (
        <textarea
          ref={textareaRef}
          className="w-full border rounded px-1 text-[15px] resize-none focus:outline-none nodrag nowheel"
          autoFocus
          value={tempText}
          onChange={(e) => setTempText(e.target.value)}
          onBlur={finishEdit}
          onKeyDown={handleKeyDown}
          rows={1}
        />
      ) : isTitle ? (
        <strong>{d.title}</strong>
      ) : (
        <span>{d.description}</span>
      )}

      {/* === 동적 핸들: handleCounts가 있으면 그 개수만큼 균등 분배로 렌더 === */}
      {!useFallbackStaticHandles && (
        <>
          {/* out */}
          {renderHandles("t", "out", hc["t-out"] ?? 0)}
          {renderHandles("b", "out", hc["b-out"] ?? 0)}
          {renderHandles("l", "out", hc["l-out"] ?? 0)}
          {renderHandles("r", "out", hc["r-out"] ?? 0)}

          {/* in (루트 정책이 있으면 숨길 수 있음) */}
          {!d.isRoot && (
            <>
              {renderHandles("t", "in", hc["t-in"] ?? 0)}
              {renderHandles("b", "in", hc["b-in"] ?? 0)}
              {renderHandles("l", "in", hc["l-in"] ?? 0)}
              {renderHandles("r", "in", hc["r-in"] ?? 0)}
            </>
          )}
        </>
      )}

      {/* === 폴백: handleCounts가 없으면 기존 4방향 고정 핸들 유지 === */}
      {useFallbackStaticHandles && (
        <>
          {/* out */}
          <Handle type="source" id="r-out" position={Position.Right} />
          <Handle type="source" id="l-out" position={Position.Left} />
          <Handle type="source" id="t-out" position={Position.Top} />
          <Handle type="source" id="b-out" position={Position.Bottom} />
          {/* in */}
          {!d.isRoot && (
            <>
              <Handle type="target" id="r-in" position={Position.Right} />
              <Handle type="target" id="l-in" position={Position.Left} />
              <Handle type="target" id="t-in" position={Position.Top} />
              <Handle type="target" id="b-in" position={Position.Bottom} />
            </>
          )}
        </>
      )}
    </div>
  );
}
