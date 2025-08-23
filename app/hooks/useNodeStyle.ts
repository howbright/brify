// hooks/useNodeStyle.ts
"use client";

import { useCallback, CSSProperties } from "react";
import type { MyFlowNode } from "@/app/types/diagram";

export function useNodeStyle(stylePreset: any) {
  const computeNodeStyle = useCallback(
    (node: MyFlowNode): CSSProperties => {
      const base: CSSProperties = { ...(stylePreset.node as CSSProperties) };
      const isHighlighted = !!(node.data as any)?.highlighted;
      const isUserCreated = !!(node.data as any)?.userCreated;

      if (isHighlighted || isUserCreated) {
        delete (base as any).background;
        delete (base as any).backgroundColor;
        delete (base as any).backgroundImage;
        delete (base as any).borderColor;
        delete (base as any).boxShadow;
      }
      return base;
    },
    [stylePreset]
  );

  return computeNodeStyle;
}
