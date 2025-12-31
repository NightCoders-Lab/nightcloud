import type { Node } from "@/domain/nodes/node";
import type {
  DescendantRow,
  DescendantRowWithBlob,
} from "@/infra/prisma/types";

/**
 * @description Construye la ruta relativa de un nodo basado en su mapa de descendientes.
 * @param descendantMap mapa de descendientes donde la clave es el ID del nodo
 * @param rootNodeId ID del nodo raíz desde donde se construye la ruta
 * @param currentNodeId ID del nodo actual para el cual se construye la ruta
 * @returns Ruta relativa del nodo
 */
export default function buildRelativeNodePath(
  descendantMap: Map<string, DescendantRow | DescendantRowWithBlob>,
  rootNodeId: Node["id"],
  currentNodeId: Node["id"],
): string {
  // Iniciamos desde el nodo actual
  let currentNode = descendantMap.get(currentNodeId);
  const parts: string[] = [];

  while (currentNode) {
    // Agregamos el nombre actual al inicio de la lista
    parts.unshift(currentNode.name);

    // Si llegamos al nodo raíz que definimos, quiere decir que terminamos
    if (currentNode.id === rootNodeId) {
      break;
    }

    // Subimos al padre
    if (currentNode.parentId) {
      currentNode = descendantMap.get(currentNode.parentId);
    } else {
      // Si no tiene padre y no es el root (caso raro de data corrupta), salimos
      currentNode = undefined;
    }
  }

  console.log(`Ruta relativa construida: ${parts.join("/")}`);
  // Unimos las partes con '/' para formar la ruta relativa
  return parts.join("/");
}
