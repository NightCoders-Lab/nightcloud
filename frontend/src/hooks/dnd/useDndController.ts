import type {
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
} from "@dnd-kit/core";
import { useDrag } from "../stores/useDrag";
import { isNodeDrag } from "./utils/dndGuards";
import { useNodeDropStrategy } from "./strategies/useNodeDropStategy";
import { useBulkNodesDropStrategy } from "./strategies/useBulkNodesDropStategy";
import { useSelectedNodes } from "../stores/useSelectedNodes";

export function useDndController() {
  // Hooks y funciones para manejar el drag and drop en la aplicación
  const { startDrag, setOver, endDrag, type } = useDrag();
  const { selectedNodes } = useSelectedNodes();

  // Importar las estrategias de drop
  const { handleNodeDrop } = useNodeDropStrategy();
  const { handleBulkNodesDrop } = useBulkNodesDropStrategy();

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const data = active.data.current;

    if (!data || !isNodeDrag(data)) return;

    // Verificar si el nodo arrastrado está en la selección actual
    const isDraggedNodeSelected = selectedNodes.some((n) => n.id === data.id);

    // Determinar si se debe iniciar un drag de múltiples nodos
    const shouldStartBulkDrag =
      isDraggedNodeSelected && selectedNodes.length > 1;

    // Si es así, iniciar un drag de múltiples nodos
    if (shouldStartBulkDrag) {
      startDrag("nodes", selectedNodes);
      return;
    }

    // Si no, iniciar un drag de un solo nodo
    startDrag("node", data);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;

    setOver(over?.data.current ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const currentType = type; // Guardamos el tipo actual antes de finalizar el drag

    // Si no hay target, finalizar el drag y salir
    if (!event.over) return endDrag();

    switch (currentType) {
      case "node": {
        handleNodeDrop(event);
        break;
      }
      case "nodes": {
        handleBulkNodesDrop(event);
        break;
      }
      default: {
        endDrag();
        break;
      }
    }
  };

  return {
    handleDragStart,
    handleDragOver,
    handleDragEnd,
  };
}
