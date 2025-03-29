// 📁 lib/gpt/transformTree.ts

import { Node, Edge } from "reactflow";
import ELK from "elkjs/lib/elk.bundled.js";
import { TreeNode } from "@/app/types/tree";

const elk = new ELK();

export async function treeToFlowElements(tree: TreeNode): Promise<{ nodes: Node[]; edges: Edge[] }> {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const traverse = (node: TreeNode, parentId: string | null = null) => {
    nodes.push({
      id: node.id,
      data: { label: node.label },
      position: { x: 0, y: 0 },
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
    children: nodes.map((n) => ({ id: n.id, width: 150, height: 50 })),
    edges: edges.map((e) => ({ id: e.id, sources: [e.source], targets: [e.target] })),
  };

  const layout = await elk.layout(graph);

  const positionedNodes = nodes.map((node) => {
    const layoutNode = layout.children?.find((n) => n.id === node.id);
    return {
      ...node,
      position: {
        x: layoutNode?.x || 0,
        y: layoutNode?.y || 0,
      },
    };
  });

  return { nodes: positionedNodes, edges };
}