import type { NodeSearchType, NodeType } from ".";

// Types para cada tipo de acción de drag y drop y su payload asociado
export type DragRegistry = {
  node: NodeType | NodeSearchType;
  nodes: (NodeType | NodeSearchType)[];
};

// Extraemos las claves automáticamente: "node" | "nodes"
export type DragType = keyof DragRegistry;
