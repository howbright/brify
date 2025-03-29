export interface TreeNode {
    id: string;
    label: string;
    children?: TreeNode[];
  }
  
  export interface DiagramNode {
    id: string;
    data: { label: string };
    position: { x: number; y: number };
  }
  
  export interface DiagramEdge {
    id: string;
    source: string;
    target: string;
  }
  