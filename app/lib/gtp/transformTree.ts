// 📁 lib/gpt/transformTree.ts
import { MyFlowEdge, MyFlowNode, TreeNode } from "@/app/types/diagram";
import ELK from "elkjs/lib/elk.bundled.js";

const elk = new ELK();

// 오버로드 시그니처 (선택: 에디터 자동완성/추론 향상을 위해)
export async function treeToFlowElements(
  tree: TreeNode
): Promise<{ nodes: MyFlowNode[]; edges: MyFlowEdge[] }>;
export async function treeToFlowElements(
  tree: TreeNode[]
): Promise<{ nodes: MyFlowNode[]; edges: MyFlowEdge[] }>;

/**
 * ✅ 단일 TreeNode든, TreeNode[]든 모두 지원
 */
export async function treeToFlowElements(
  tree: TreeNode | TreeNode[]
): Promise<{ nodes: MyFlowNode[]; edges: MyFlowEdge[] }> {
  const roots: TreeNode[] = Array.isArray(tree) ? tree : [tree];

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
      type: "custom" as const,
    });

    if (parentId) {
      edges.push({
        id: `e-${parentId}-${node.id}`,
        source: parentId,
        target: node.id,
      });
    }

    node.children?.forEach((child) => traverse(child, node.id));
  };

  roots.forEach((r) => traverse(r));

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
      sourceHandle: "a",
      targetHandle: "b",
    })),
  };

  // === ELK 레이아웃 계산 ===
  const layout = await elk.layout(graph);

  // === 루트(들) 중심으로 화면 가운데 정렬 ===
  const rootIds = roots.map((r) => r.id);
  const centers = rootIds.map((rid) => {
    const ln = layout.children?.find((n) => n.id === rid);
    return (ln?.x ?? 0) + (ln?.width ?? 0) / 2;
  });

  // 루트가 여러 개면 bounding box의 수평 중간값으로 정렬
  const centerX =
    centers.length > 0
      ? (Math.min(...centers) + Math.max(...centers)) / 2
      : 0;

  const offsetX = -centerX + 300; // 좌측 여백 300

  // === 좌표 적용 ===
  const positionedNodes: MyFlowNode[] = nodes.map((node) => {
    const layoutNode = layout.children?.find((n) => n.id === node.id);
    return {
      ...node,
      position: {
        x: (layoutNode?.x ?? 0) + offsetX,
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
