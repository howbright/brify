type MindPreviewNode = {
  topic?: unknown;
  children?: unknown;
};

export type MapStructurePreview = {
  rootTopic: string;
  childTopics: string[];
  remainingChildCount: number;
};

function normalizeTopic(topic: unknown) {
  if (typeof topic !== "string") return "";
  return topic
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function getRootNode(rawMind: unknown): MindPreviewNode | null {
  if (!rawMind || typeof rawMind !== "object") return null;
  const mind = rawMind as { nodeData?: unknown };
  const root = mind.nodeData ?? rawMind;
  if (!root || typeof root !== "object") return null;
  return root as MindPreviewNode;
}

export function getMapStructurePreview(
  rawMind: unknown,
  maxChildren = 5
): MapStructurePreview | null {
  const root = getRootNode(rawMind);
  if (!root) return null;

  const rootTopic = normalizeTopic(root.topic);
  const children = Array.isArray(root.children) ? root.children : [];
  const childTopics = children
    .map((child) =>
      child && typeof child === "object"
        ? normalizeTopic((child as MindPreviewNode).topic)
        : ""
    )
    .filter(Boolean);

  if (!rootTopic && childTopics.length === 0) return null;

  return {
    rootTopic,
    childTopics: childTopics.slice(0, maxChildren),
    remainingChildCount: Math.max(childTopics.length - maxChildren, 0),
  };
}
