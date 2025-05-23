// 📁 lib/gpt/transformTree.ts
import { MyNodeData, TreeNode } from "@/app/types/tree";
import type { Edge as FlowEdge, Node as FlowNode } from "@xyflow/react";
import ELK from "elkjs/lib/elk.bundled.js";

const elk = new ELK();

export async function treeToFlowElements(
  tree: TreeNode
): Promise<{
  nodes: FlowNode<MyNodeData>[];
  edges: FlowEdge[];
}> {
  const nodes: FlowNode<MyNodeData>[] = [];
  const edges: FlowEdge[] = [];

  const traverse = (node: TreeNode, parentId: string | null = null) => {
    nodes.push({
      id: node.id,
      data: { nodeType: node.nodeType, title: node.title, description: node.description },
      position: { x: 0, y: 0 },
      type: "default",
    });

    if (parentId) {
      edges.push({
        id: `e-${parentId}-${node.id}`,
        source: parentId,
        target: node.id,
        type: "default",
      });
    }

    node.children?.forEach((child) => traverse(child, node.id));
  };

  traverse(tree);

  const graph = {
    id: "root",
    layoutOptions: {
      "elk.algorithm": "layered",
      "elk.direction": "RIGHT",
      "elk.spacing.nodeNode": "40",
    },
    children: nodes.map((n) => ({
      id: n.id,
      width: 150,
      height: 50,
    })),
    edges: edges.map((e) => ({
      id: e.id,
      sources: [e.source],
      targets: [e.target],
      sourceHandle: 'a',
      targetHandle: 'b'
    })),
  };

  const layout = await elk.layout(graph);

  const positionedNodes: FlowNode<MyNodeData>[] = nodes.map((node) => {
    const layoutNode = layout.children?.find((n) => n.id === node.id);
    return {
      ...node,
      position: {
        x: layoutNode?.x ?? 0,
        y: layoutNode?.y ?? 0,
      },
    };
  });

  return { nodes: positionedNodes, edges };
}
