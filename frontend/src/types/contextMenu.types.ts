import type { NodeType } from ".";

export type ContextMenuRegistry = {
  node: { selectedNode: NodeType };
  nodes: { selectedNodes: NodeType[] };
  nodeAreas: void;
  modal: void;
};

// Extraemos las claves automáticamente: "node" | "nodes" | "canvas" | "user"
export type ContextMenuType = keyof ContextMenuRegistry;
