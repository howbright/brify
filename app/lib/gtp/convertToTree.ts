import type { TreeNode } from "@/app/types/tree";

export function convertToTree(flatList: unknown): TreeNode | null {
  if (!Array.isArray(flatList)) return null;

  const map = new Map<string, TreeNode & { childIds: string[] }>();

  for (const rawNode of flatList) {
    if (
      typeof rawNode !== "object" ||
      rawNode === null ||
      typeof rawNode.id !== "string" ||
      !("nodeType" in rawNode)
    ) {
      continue;
    }

    map.set(rawNode.id, {
      id: rawNode.id,
      title: typeof rawNode.title === "string" ? rawNode.title : "",
      description: typeof rawNode.description === "string" ? rawNode.description : "",
      nodeType:
        rawNode.nodeType === "title" || rawNode.nodeType === "description"
          ? rawNode.nodeType
          : "description",
      children: [],
      childIds: Array.isArray(rawNode.children) ? rawNode.children : [],
    });
  }

  // 관계 구성
  for (const node of map.values()) {
    node.childIds.forEach((childId) => {
      const child = map.get(childId);
      if (child) {
        node.children.push(child);
      }
    });
    delete (node as any).childIds; // childIds 제거
  }

  // 루트 노드 찾기 (id에 "-" 없는 title 타입을 루트로 간주)
  const root = [...map.values()].find(
    (n) => n.nodeType === "title" && !n.id.includes("-")
  );

  return root ?? null;
}
