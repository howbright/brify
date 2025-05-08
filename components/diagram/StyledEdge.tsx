import { BaseEdge, EdgeProps, getBezierPath, getSmoothStepPath, getStraightPath } from "@xyflow/react";

export default function StyledEdge(props: EdgeProps & { stylePreset: any }) {
  const { sourceX, sourceY, targetX, targetY, stylePreset, markerEnd } = props;
  const type = stylePreset.edge.type;

  let path: string = "";
  if (type === "step") {
    path = getSmoothStepPath({
      sourceX,
      sourceY,
      targetX,
      targetY,
    })[0];
  } else if (type === "straight") {
    path = getStraightPath({
      sourceX,
      sourceY,
      targetX,
      targetY,
    })[0];
  } else {
    path = getBezierPath({
      sourceX,
      sourceY,
      targetX,
      targetY,
    })[0];
  }

  return (
    <BaseEdge
      {...props}
      path={path}
      style={{
        stroke: stylePreset.edge.stroke,
        strokeWidth: 2,
      }}
      markerEnd={markerEnd}
    />
  );
}
