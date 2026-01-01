import type { NodeSearchType, NodeType } from ".";

export type ContextMenuRegistry = {
  node: { selectedNode: NodeType | NodeSearchType };
  nodes: { selectedNodes: NodeType[] | NodeSearchType[] };
  nodeAreas: void;
  modal: void;
};

// Extraemos las claves automáticamente: "node" | "nodes" | "canvas" | "user"
export type ContextMenuType = keyof ContextMenuRegistry;
