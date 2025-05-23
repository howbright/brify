// components/diagram/CustomNode.tsx
import { MyNode } from "@/app/types/tree";
import { Handle, NodeProps, Position } from "@xyflow/react";

export function CustomNode(props: NodeProps<MyNode>) {
  const { data } = props;

  const isTitle = data.nodeType === "title";

  return (
    <div
      className={`rounded-lg border p-3 shadow-sm whitespace-pre-wrap text-sm ${
        isTitle
          ? "bg-blue-100 border-blue-300 text-blue-900"
          : "bg-gray-100 border-gray-300 text-gray-700"
      }`}
    >
      {isTitle ? (
        <strong>{data.title}</strong>
      ) : (
        <span>{data.description}</span>
      )}
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
