import type { OriginalDiagramNode, G6TreeNode } from "./types";

/** flat nodes(+children ids) → 중첩 트리(단일 루트). 루트가 여러 개면 가짜 루트를 만든다 */
export function normalizeToG6Tree(input: { nodes: OriginalDiagramNode[] } | OriginalDiagramNode[] | any): G6TreeNode | null {
  const items: OriginalDiagramNode[] = Array.isArray(input) ? input : input?.nodes || [];
  if (!items.length) return null;

  const byId = new Map<string, OriginalDiagramNode>(items.map(n => [n.id, n]));
  const childSet = new Set<string>();
  items.forEach(n => (n.children || []).forEach(cid => childSet.add(cid)));

  // 루트 후보
  const roots = items.filter(n => !childSet.has(n.id));

  // OriginalDiagramNode -> G6TreeNode (재귀)
  const build = (n: OriginalDiagramNode): G6TreeNode => ({
    id: n.id,
    data: { title: n.title, description: n.description, nodeType: n.nodeType },
    children: (n.children || [])
      .filter(cid => byId.has(cid))
      .map(cid => build(byId.get(cid)!)),
  });

  if (roots.length === 1) {
    return build(roots[0]);
  }

  // 루트가 없거나 여러 개인 경우 가짜 루트 생성
  return {
    id: "__ROOT__",
    data: { title: "ROOT" },
    children: roots.length ? roots.map(build) : items.map(build),
  };
}
