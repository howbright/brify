// components/diagram/CustomNode.tsx
import { MyFlowNode } from "@/app/types/diagram";
import { Handle, NodeProps, Position, useReactFlow } from "@xyflow/react";
import clsx from "clsx";
import { useEffect, useRef, useState } from "react";

export function CustomNode({ id, data, selected }: NodeProps<MyFlowNode>) {
  const isTitle = data.nodeType === "title";
  const [editing, setEditing] = useState(false);
  const [tempText, setTempText] = useState(data.title || data.description);
  const [highlighted, setHighlighted] = useState(false);

  const toggleHighlight = () => {
    setHighlighted((v) => !v);
    // (선택) 나중에 서버 저장을 붙일 거면:
    // data.onHighlightChange?.(id, !highlighted);
  };

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 👇 엔진 레벨에서 드래그 on/off
  const { setNodes } = useReactFlow();
  useEffect(() => {
    setNodes((nds) =>
      nds.map((n) => (n.id === id ? { ...n, draggable: !editing } : n))
    );
    // 언마운트 시 원복(안전)
    return () =>
      setNodes((nds) =>
        nds.map((n) => (n.id === id ? { ...n, draggable: true } : n))
      );
  }, [editing, id, setNodes]);

  const startEdit = () => {
    setEditing(true);
    setTempText(data.title || data.description);
  };

  const finishEdit = () => {
    setEditing(false);
    data.onUpdate?.(id, tempText, data.nodeType);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      finishEdit();
    }
  };

  // auto-resize textarea
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

        // 하이라이트 배경/테두리 (선택 유무와 무관하게 적용)
        highlighted &&
          "bg-gradient-to-br from-fuchsia-50 to-indigo-50 border-fuchsia-300",

        // 선택 상태 링
        selected
          ? highlighted
            ? // 하이라이트 + 선택: 보라색 링으로 더 또렷하게
              "ring-2 ring-fuchsia-500 ring-offset-2 ring-offset-white"
            : // 일반 선택: 기존 파랑 링
              "ring-2 ring-blue-400"
          : highlighted
          ? // 하이라이트 + 미선택: 보라 링/오프셋 + 글로우 + 살짝 확대
            "ring-2 ring-fuchsia-400 ring-offset-2 ring-offset-white shadow-lg shadow-fuchsia-300/50 scale-[1.01]"
          : "",

        editing ? "cursor-text nopan" : "cursor-pointer"
      )}
      onDoubleClick={startEdit}
    >
      {/* ⭐ 하이라이트 배지: 하이라이트 && 미선택 && 비편집 상태에서만 표시 */}
      {highlighted && !editing && !selected && (
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

      {/* 선택 시 우측 액션 버튼(편집/하이라이트 토글) */}
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

          {/* 하이라이트 토글 버튼 (이미 구현한 toggleHighlight 사용) */}
          <button
            type="button"
            title="하이라이트"
            aria-label="하이라이트"
            aria-pressed={highlighted}
            onClick={toggleHighlight}
            className={clsx(
              "rounded-full border shadow p-1",
              highlighted
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
        <strong>{data.title}</strong>
      ) : (
        <span>{data.description}</span>
      )}

      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
