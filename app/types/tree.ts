import type { Node, NodeProps } from '@xyflow/react';

export interface TreeNode {
  id: string;
  nodeType: "title" | "description";
  title: string;
  description: string;
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

export type MyNode = Node<MyNodeData, 'custom'>;

// types.ts
export type MyNodeData = {
  nodeType: "title" | "description";
  title: string;
  description: string;
};
