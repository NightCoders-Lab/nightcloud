import type { ListOption } from "@/stores/listSlice";
import type { NodeType } from "@/types";
import { FaFolder } from "react-icons/fa6";

/**
 * @description Construye una lista de opciones para nodos que son directorios. (SOLO PARA EL COMPONENTE LIST)
 * @param nodes Array de nodos a procesar
 * @returns Array de opciones para la lista
 */
export default function buildNodeDirListOptions(
  nodes: NodeType[]
): ListOption[] {
  const result = [];

  result.push(
    ...nodes
      .filter((n) => n.isDir)
      .map((n) => ({
        id: n.id,
        icon: FaFolder,
        name: n.name,
      }))
  );

  return result;
}
