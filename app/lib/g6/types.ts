export type NodeKind = "title" | "description";

export type OriginalDiagramNode = { //db에 들어있는 구조를 정의함.
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


// G6 쪽으로 넘길 데이터의 최소 형태(버전 차이를 피하려고 light 타입 사용)
export type G6Node = {
  id: string;
  /** 그리기/인터랙션에서 쓸 수 있도록 원본 데이터도 달아둠 */
  data: {
    label: string;
    title: string;
    description: string;
    nodeType: NodeKind;
  };
  /** 필요하면 여기서 타입/스타일 지정 가능 */
  // type?: string;
  // style?: Record<string, unknown>;
};

export type G6Edge = {
  id?: string;
  source: string;
  target: string;
  data?: Record<string, unknown>;
};

export type G6GraphData = {
  nodes: G6Node[];
  edges: G6Edge[];
};