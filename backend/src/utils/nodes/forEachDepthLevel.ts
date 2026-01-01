import type { AncestorRow, DescendantRow } from "@/infra/prisma/types";

type NodeDepthTree = (AncestorRow | DescendantRow)[];

/**
 * @description Ejecuta un callback para cada nivel de profundidad en un árbol de nodos.
 * @param nodes Árbol de nodos con profundidad
 * @param callback Callback a ejecutar por cada nivel de profundidad
 */
export default async function forEachDepthLevel(
  nodes: NodeDepthTree,
  callback: (depthNodes: NodeDepthTree) => Promise<void>,
) {
  let i = 0;

  // Mientras queden nodos por procesar
  while (i < nodes.length) {
    // Obtener la profundidad actual
    const currentDepth = nodes[i].depth;

    // Almacenar los nodos del nivel actual
    const levelNodes: NodeDepthTree = [];

    // Procesar todos los nodos del mismo nivel de profundidad
    while (i < nodes.length && nodes[i].depth === currentDepth) {
      levelNodes.push(nodes[i]);
      i++;
    }

    // Ejecutar el callback para el nivel actual
    await callback(levelNodes);
  }
}
