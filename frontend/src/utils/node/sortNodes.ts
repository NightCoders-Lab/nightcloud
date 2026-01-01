import type { NodeType, SortDirection } from "@/types";

export function sortNodesByDir(nodes: NodeType[]) {
  return Array.from(nodes).sort((a, b) => {
    if (a.isDir === b.isDir) {
      return a.name.localeCompare(b.name);
    }
    return a.isDir ? -1 : 1;
  });
}

export function sortNodesASC(nodes: NodeType[]) {
  return Array.from(nodes).sort((a, b) => {
    // Directorios primero
    if (a.isDir !== b.isDir) {
      return a.isDir ? -1 : 1;
    }

    // Luego por nombre ascendente
    return a.name.localeCompare(b.name);
  });
}

export function sortNodesDESC(nodes: NodeType[]) {
  return Array.from(nodes).sort((a, b) => {
    // Directorios primero
    if (a.isDir !== b.isDir) {
      return a.isDir ? -1 : 1;
    }

    // Luego por nombre descendente
    return b.name.localeCompare(a.name);
  });
}

// Tipo para la dirección de ordenamiento
export function toggleNameDirection(
  current: SortDirection,
  nodes: NodeType[]
): NodeType[] {
  return current === "asc" ? sortNodesDESC(nodes) : sortNodesASC(nodes);
}
