// components/diagram/CustomNode.tsx
import { MyFlowNode } from "@/app/types/diagram";
import { Handle, NodeProps, Position } from "@xyflow/react";
import clsx from "clsx";
import { useEffect, useRef, useState } from "react";

export function CustomNode({ id, data, selected }: NodeProps<MyFlowNode>) {
  const isTitle = data.nodeType === "title";
  const [editing, setEditing] = useState(false);
  const [tempText, setTempText] = useState(data.title || data.description);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
        "rounded-lg border p-3 shadow-sm text-sm max-w-[250px] break-words cursor-pointer",
        isTitle
          ? "bg-blue-100 border-blue-300 text-blue-900"
          : "bg-gray-100 border-gray-300 text-gray-700",
        selected && "ring-2 ring-blue-400"
      )}
      onDoubleClick={startEdit}
    >
      {editing ? (
        <textarea
          ref={textareaRef}
          className="w-full border rounded px-1 text-sm resize-none focus:outline-none"
          autoFocus
          value={tempText}
          onChange={(e) => setTempText(e.target.value)}
          onBlur={finishEdit}
          onKeyDown={handleKeyDown}
          rows={1} // 초기 높이 최소화
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
