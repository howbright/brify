export type NodeKind = "title" | "description";

export type OriginalDiagramNode = {
  id: string;
  title: string;
  description: string;
  nodeType: NodeKind;
  children: string[];
};

/** G6 트리 노드(중첩 구조) */
export type G6TreeNode = {
  id: string;
  /** 원본 데이터 그대로 보관 (라벨 등에서 사용) */
  data?: {
    title?: string;
    description?: string;
    nodeType?: NodeKind;
  };
  children?: G6TreeNode[];
};
