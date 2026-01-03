import { useAppStore } from "@/stores/useAppStore";

/**
 * @description Hook para manejar el estado de drag and drop de nodos
 * @returns {DragSliceType} Estado y acciones de drag and drop
 */
export function useDrag() {
  const {
    drag: {
      isDragging,
      isDropping,
      type,
      active,
      target,
      startDrag,
      setOver,
      setDropping,
      endDrag,
    },
  } = useAppStore();

  return {
    isDragging,
    isDropping,
    type,
    active,
    target,
    startDrag,
    setOver,
    setDropping,
    endDrag,
  };
}
