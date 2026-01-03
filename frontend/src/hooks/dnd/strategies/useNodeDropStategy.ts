import type { NodeType } from "@/types";
import type { DragEndEvent } from "@dnd-kit/core";
import { toast } from "react-toastify";
import { getDropData } from "../../../utils/getDropData";
import { useMoveNode } from "@/hooks/nodes/useMoveNode";
import { useDrag } from "@/hooks/stores/useDrag";

/**
 * @description Hook para manejar el movimiento de nodos al soltarlos en otro nodo mediante drag and drop.
 * @returns {Object} Objeto con la función handleNodeDrop para manejar el evento de soltar un nodo.
 */
export function useNodeDropStrategy() {
  const { setDropping, endDrag } = useDrag();
  const { moveNodeAsync } = useMoveNode();

  // Manejar el fin del drag
  const handleNodeDrop = async (event: DragEndEvent) => {
    // Obtener datos del drag and drop
    const data = getDropData(event);
    // Si no se arrastro sobre un nodo valido entonces no habra data y no se hace nada
    if (!data) return;

    const { activeId, overId, activeData, overData } = data;

    // Si no hay datos actuales, no hacer nada
    if (!activeData || !overData) return;

    // Prevenir mover una carpeta dentro de si misma
    if (activeId === overId) {
      endDrag();
      return toast.info("Cannot move a folder into itself.", {
        autoClose: 2000,
      });
    }

    // Obtener los nodos activos y sobre el que se solto
    const activeNode = activeData as NodeType; // Hacer un casteo ya que si o si debe ser un NodeType
    // Si se suelta sobre el breadcrumb root, el targetId es null
    // Sino, es el id del nodo sobre el que se suelta
    const overNodeId =
      overId === "breadcrumb:root" ? null : (overData as NodeType)?.id; // Castear a NodeType si no es root

    // Indicar que se está en proceso de dropping
    setDropping(true);

    // Ejecutar la mutacion para mover el nodo
    await moveNodeAsync({ node: activeNode, targetId: overNodeId }).catch(
      () => {}
    );

    // Indicar que ya no se está en proceso de dropping
    setDropping(false);

    // Finalizar el drag
    endDrag();
  };

  return { handleNodeDrop };
}
