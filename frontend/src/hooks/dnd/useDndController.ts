import type {
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
} from "@dnd-kit/core";
import { useDrag } from "../stores/useDrag";
import { isNodeDrag, isNodesDrag } from "./utils/dndGuards";
import { useNodeDropStrategy } from "./strategies/useNodeDropStategy";

export function useDndController() {
  // Hooks y funciones para manejar el drag and drop en la aplicación
  const { startDrag, setOver, endDrag, type } = useDrag();

  // Importar las estrategias de drop
  const { handleNodeDrop } = useNodeDropStrategy();

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const data = active.data.current;

    if (isNodeDrag(data)) {
      startDrag("node", data);
      return;
    }

    if (isNodesDrag(data)) {
      startDrag("nodes", data);
    }
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
