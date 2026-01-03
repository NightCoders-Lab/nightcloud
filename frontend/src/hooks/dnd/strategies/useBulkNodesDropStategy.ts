import { getDropData } from "@/utils/getDropData";
import type { DragEndEvent } from "@dnd-kit/core";
import { useDrag } from "@/hooks/stores/useDrag";
import { useBulkMoveNodes } from "@/hooks/nodes/bulk/useBulkMoveNodes";
import { useSelectedNodes } from "@/hooks/stores/useSelectedNodes";
import { toast } from "react-toastify";

export function useBulkNodesDropStrategy() {
  const { setSelectedNodes, selectedNodes } = useSelectedNodes();
  const { setDropping, endDrag } = useDrag();
  const { bulkMoveNodesAsync } = useBulkMoveNodes();

  // Manejar el fin del drag
  const handleBulkNodesDrop = async (event: DragEndEvent) => {
    // Obtener datos del drag and drop
    const data = getDropData(event);
    if (!data) return;

    // Extraer datos necesarios
    const { overId, overData } = data;

    // Si no hay datos actuales, no hacer nada
    if (!selectedNodes || !overData) return;
    if (!selectedNodes.length) return;

    // Prevenir mover una carpeta dentro de si misma
    if (selectedNodes.some((n) => n.id === overId)) {
      return toast.info("Cannot move a folder into itself.", {
        autoClose: 2000,
      });
    }

    // Obtener los nodos activos y sobre el que se solto
    const activeNodes = selectedNodes;
    const overNodeId = overId === "breadcrumb:root" ? null : overData.id;

    // Indicar que se está en proceso de dropping
    setDropping(true);

    await bulkMoveNodesAsync({
      nodeIds: activeNodes.map((n) => n.id),
      destinationFolderId: overNodeId,
    }).catch(() => {});

    // Limpiar la seleccion de nodos
    setSelectedNodes([]);

    // Indicar que ya no se está en proceso de dropping
    setDropping(false);

    // Finalizar el drag
    endDrag();
  };

  return {
    handleBulkNodesDrop,
  };
}
