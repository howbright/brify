import { Handle, Position } from "@xyflow/react";

export default function StyledNode({ data, stylePreset }: any) {
  const style = stylePreset.node;

  return (
    <>
    <div
      style={{
        backgroundColor: style.backgroundColor,
        border: `1px solid ${style.borderColor}`,
        borderRadius: style.borderRadius,
        fontFamily: style.font,
        padding: 10,
        boxShadow: style.shadow ? "2px 2px 6px rgba(0,0,0,0.2)" : "none",
      }}
    >
      {data.label}
    </div>
    <Handle type="source" position={Position.Right} id="a" />
    <Handle type="target" position={Position.Left} id="b"  />
    </>
  );
}
