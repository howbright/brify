// components/diagram/CustomNode.tsx
import { MyNode } from "@/app/types/tree";
import { Handle, NodeProps, Position } from "@xyflow/react";
import { useState } from "react";

export function CustomNode(props: NodeProps<MyNode>) {
  const { id, data, selected } = props;
  const isTitle = data.nodeType === "title";

  // 편집 모드 상태
  const [editing, setEditing] = useState(false);
  const [tempText, setTempText] = useState(data.title || data.description);

  const startEdit = () => {
    setEditing(true);
    setTempText(data.title || data.description);
  };

  const finishEdit = () => {
    setEditing(false);
    if (data.onUpdate) {
      data.onUpdate(id, tempText);
    }
  };

  return (
    <div
      className={`rounded-lg border p-3 shadow-sm text-sm max-w-[250px] break-words 
                  ${isTitle
                    ? "bg-blue-100 border-blue-300 text-blue-900"
                    : "bg-gray-100 border-gray-300 text-gray-700"} 
                  ${selected ? "ring-2 ring-blue-400" : ""}`}
      onDoubleClick={startEdit}
    >
      {editing ? (
        <input
          className="w-full border rounded px-1 text-sm"
          autoFocus
          value={tempText}
          onChange={(e) => setTempText(e.target.value)}
          onBlur={finishEdit}
          onKeyDown={(e) => e.key === "Enter" && finishEdit()}
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
