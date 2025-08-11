// 📁 lib/gpt/transformTree.ts
import { MyFlowEdge, MyFlowNode, TreeNode } from "@/app/types/diagram";
import ELK from "elkjs/lib/elk.bundled.js";

const elk = new ELK();

export async function treeToFlowElements(
  tree: TreeNode
): Promise<{ nodes: MyFlowNode[]; edges: MyFlowEdge[] }> {
  // ✅ 처음부터 MyFlowNode/MyFlowEdge로 선언
  const nodes: MyFlowNode[] = [];
  const edges: MyFlowEdge[] = [];

  // === 트리 순회 ===
  const traverse = (node: TreeNode, parentId: string | null = null) => {
    nodes.push({
      id: node.id,
      data: {
        nodeType: node.nodeType,
        title: node.title,
        description: node.description,
      },
      position: { x: 0, y: 0 },
      type: "custom" as const,   // ✅ 리터럴 고정
    });

    if (parentId) {
      edges.push({
        id: `e-${parentId}-${node.id}`,
        source: parentId,
        target: node.id,
        // type: 'default' // 굳이 지정 안 해도 됨
      });
    }

    node.children?.forEach((child) => traverse(child, node.id));
  };

  traverse(tree);

  // === ELK 그래프 ===
  const graph = {
    id: "root",
    layoutOptions: {
      "elk.algorithm": "layered",
      "elk.direction": "DOWN",
      "elk.spacing.nodeNode": "40",
      "elk.layered.spacing.nodeNodeBetweenLayers": "80",
      "elk.layered.spacing.nodeNodeBetweenColumns": "50",
    },
    children: nodes.map((n) => ({
      id: n.id,
      width: getNodeWidth(n.data.title, n.data.description),
      height: 60,
    })),
    edges: edges.map((e) => ({
      id: e.id,
      sources: [e.source],
      targets: [e.target],
      // ELK 전용 핸들 키 (선택)
      sourceHandle: "a",
      targetHandle: "b",
    })),
  };

  // === ELK 레이아웃 계산 ===
  const layout = await elk.layout(graph);

  // === 루트 노드 중심 좌표 계산 ===
  const rootLayoutNode = layout.children?.find((n) => n.id === tree.id);
  const rootCenterX =
    (rootLayoutNode?.x ?? 0) + (rootLayoutNode?.width ?? 0) / 2;

  // === 루트가 캔버스의 horizontal center(0)로 오도록 오프셋 ===
  const offsetX = -rootCenterX;

  // === 좌표 적용 ===
  const positionedNodes: MyFlowNode[] = nodes.map((node) => {
    const layoutNode = layout.children?.find((n) => n.id === node.id);
    return {
      ...node,
      position: {
        x: (layoutNode?.x ?? 0) + offsetX + 300, // 좌측 여백
        y: layoutNode?.y ?? 0,
      },
    };
  });

  return { nodes: positionedNodes, edges };
}

// === 노드 너비 계산 ===
function getNodeWidth(title: string, description?: string) {
  const textLength = (title?.length ?? 0) + (description?.length ?? 0);
  return Math.min(250, Math.max(150, textLength * 7));
}
