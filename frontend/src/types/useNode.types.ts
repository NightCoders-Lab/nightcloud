export const NODE_QUERY_MODES = [
  "node",
  "children",
  "ancestors",
  "descendants",
] as const;

export type NodeQueryFlag = (typeof NODE_QUERY_MODES)[number];

export type UseNodeMode =
  // Modos individuales
  | "node"
  | "children"
  | "ancestors"
  | "descendants"

  // Combinaciones de modos
  | "node+children"
  | "node+ancestors"
  | "node+descendants"
  | "children+ancestors"
  | "children+descendants"
  | "ancestors+descendants"

  // Combinaciones de tres modos
  | "node+children+ancestors"
  | "node+children+descendants"
  | "node+ancestors+descendants"
  | "children+ancestors+descendants"

  // los cuatro modos
  | "all";
