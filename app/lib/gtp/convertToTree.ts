// lib/gpt/convertToTree.ts
import type { TreeNode } from "@/app/types/tree";

export function convertToTree(data: unknown): TreeNode | null {
  if (
    !data ||
    typeof data !== "object" ||
    Array.isArray(data) ||
    !("id" in data) ||
    !("nodeType" in data)
  ) {
    return null;
  }

  const node = data as any;

  return {
    id: String(node.id),
    title: typeof node.title === "string" ? node.title : "",
    description: typeof node.description === "string" ? node.description : "",
    nodeType: node.nodeType === "title" || node.nodeType === "description"
      ? node.nodeType
      : "description", // fㅌallback
    children: Array.isArray(node.children)
      ? node.children.map(convertToTree).filter(Boolean) as TreeNode[]
      : [],
  };
}
