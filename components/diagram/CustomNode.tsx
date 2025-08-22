// components/diagram/CustomNode.tsx
import { MyFlowNode } from "@/app/types/diagram";
import { Handle, NodeProps, Position, useReactFlow } from "@xyflow/react";
import clsx from "clsx";
import { useEffect, useRef, useState } from "react";

export function CustomNode({ id, data, selected }: NodeProps<MyFlowNode>) {
  const isTitle = data.nodeType === "title";
  const [editing, setEditing] = useState(false);
  const [tempText, setTempText] = useState(data.title || data.description);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

   // 👇 엔진 레벨에서 드래그 on/off
   const { setNodes } = useReactFlow();
   useEffect(() => {
     setNodes((nds) =>
       nds.map((n) => (n.id === id ? { ...n, draggable: !editing } : n))
     );
     // 언마운트 시 원복(안전)
     return () =>
       setNodes((nds) => nds.map((n) => (n.id === id ? { ...n, draggable: true } : n)));
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
        "relative rounded-lg border p-3 shadow-sm text-sm max-w-[250px] break-words",
        isTitle
          ? "bg-blue-100 border-blue-300 text-blue-900"
          : "bg-gray-100 border-gray-300 text-gray-700",
        selected && "ring-2 ring-blue-400",
        editing ? "cursor-text nopan" : "cursor-pointer" // 편집 중 캔버스 pan 차단 + 커서 전환
      )}
      onDoubleClick={startEdit}
    >
      {/* 선택 시 우측 액션 버튼 */}
      {selected && !editing && (
        <div
          className="absolute -right-2 top-1/2 -translate-y-1/2 flex flex-col gap-1 z-10 nodrag nopan nowheel"
          onPointerDown={(e) => e.stopPropagation()} // 드래그/팬 이벤트 상위 전파 방지
        >
          {/* 편집 버튼 */}
          <button
            type="button"
            title="편집"
            aria-label="편집"
            className="rounded-full bg-white border border-blue-300 text-blue-700 shadow p-1 hover:bg-blue-50"
            onClick={startEdit}
          >
            {/* 연필 아이콘 (인라인 SVG) */}
            <svg
              viewBox="0 0 24 24"
              className="w-4 h-4"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zm2.92 2.33H5v-.92l8.06-8.06.92.92L5.92 19.58zM20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.33-2.33a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
            </svg>
          </button>
  
          {/* TODO: 하이라이트 버튼 (나중에 구현)
          <button
            type="button"
            title="하이라이트"
            aria-label="하이라이트"
            className="rounded-full bg-white border border-amber-300 text-amber-700 shadow p-1 hover:bg-amber-50"
            onClick={() => data.onHighlight?.(id)}
          >
            <svg ... />
          </button>
          */}
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
