// components/diagram/CustomNode.tsx
import { MyFlowNode } from "@/app/types/diagram";
import { Handle, NodeProps, Position, useReactFlow } from "@xyflow/react";
import clsx from "clsx";
import { useEffect, useRef, useState } from "react";

// MyNodeData 타입에는 highlighted/onHighlightChange가 없으므로, 로컬에서 확장해서 사용
type HighlightableData = MyFlowNode["data"] & {
  highlighted?: boolean;
  onHighlightChange?: (id: string, next: boolean) => void;
};

export function CustomNode({ id, data, selected }: NodeProps<MyFlowNode>) {
  const d = data as HighlightableData;
  const isTitle = d.nodeType === "title";

  // 편집 상태
  const [editing, setEditing] = useState(false);
  const [tempText, setTempText] = useState(d.title || d.description);

  // ✅ 하이라이트: 로컬 즉시 반영 + 부모 값과 동기화
  const [hl, setHl] = useState(!!d.highlighted);
  useEffect(() => {
    setHl(!!d.highlighted);
  }, [d.highlighted]);

  const toggleHighlight = () => {
    const next = !hl; // 1) 로컬 즉시 반영
    setHl(next);
    d.onHighlightChange?.(id, next); // 2) 부모에 위임(낙관적 저장)
  };

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 👇 편집 중 노드 드래그 OFF (엔진 레벨)
  const { setNodes } = useReactFlow();
  useEffect(() => {
    setNodes((nds) =>
      nds.map((n) => (n.id === id ? { ...n, draggable: !editing } : n))
    );
    return () => {
      setNodes((nds) =>
        nds.map((n) => (n.id === id ? { ...n, draggable: true } : n))
      );
    };
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

  return (
    <div
      className={clsx(
        "relative rounded-lg border p-3 shadow-sm text-sm max-w-[250px] break-words transition",
        // 기본 배경/텍스트
        isTitle
          ? "bg-blue-100 border-blue-300 text-blue-900"
          : "bg-gray-100 border-gray-300 text-gray-700",

        // ✅ 하이라이트 배경/테두리 (선택 유무와 무관하게 적용)
        hl &&
          "bg-gradient-to-br from-fuchsia-50 to-indigo-50 border-fuchsia-300",

        // ✅ 링/글로우
        selected
          ? hl
            ? "ring-2 ring-fuchsia-500 ring-offset-2 ring-offset-white"
            : "ring-2 ring-blue-400"
          : hl
          ? "ring-2 ring-fuchsia-400 ring-offset-2 ring-offset-white shadow-lg shadow-fuchsia-300/50 scale-[1.01]"
          : "",

        // 편집 중 캔버스 팬 차단용 힌트
        editing ? "cursor-text nopan" : "cursor-pointer"
      )}
      onDoubleClick={startEdit}
      data-highlighted={hl ? "true" : "false"} // 디버깅 확인용
    >
      {/* ⭐ 하이라이트 배지: 하이라이트 && 미선택 && 비편집 */}
      {hl && !editing && !selected && (
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
      {/* 선택 시 우측 액션(편집/하이라이트) */}
      // 선택 시 우측 액션 버튼 묶음
      {selected && !editing && (
        <div
          className="absolute -right-2 top-1/2 -translate-y-1/2 flex flex-col gap-1 z-10 nodrag nopan nowheel"
          onPointerDown={(e) => e.stopPropagation()}
        >
          {/* 편집 버튼 */}
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

          {/* 하이라이트 토글 */}
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

          {/* ✅ 자식 추가 */}
          <button
            type="button"
            title="자식 노드 추가"
            aria-label="자식 노드 추가"
            className="rounded-full bg-white border border-emerald-300 text-emerald-700 shadow p-1 hover:bg-emerald-50"
            onClick={() => (data as any).onAddChild?.(id)}
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

          {/* ✅ 노드 삭제 */}
          <button
            type="button"
            title="노드 삭제"
            aria-label="노드 삭제"
            className="rounded-full bg-white border border-rose-300 text-rose-700 shadow p-1 hover:bg-rose-50"
            onClick={() => {
              if (confirm("이 노드와 연결을 삭제할까요?")) {
                (data as any).onDeleteNode?.(id);
              }
            }}
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

          {/* (선택) 부모와의 연결만 끊기 */}
          {/* <button onClick={() => (data as any).onDetachFromParent?.(id)}>⤴︎</button> */}
        </div>
      )}
      {editing ? (
        <textarea
          ref={textareaRef}
          className="w-full border rounded px-1 text-sm resize-none focus:outline-none nodrag nowheel"
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
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
