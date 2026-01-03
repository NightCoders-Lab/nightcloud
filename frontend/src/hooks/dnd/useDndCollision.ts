import { pointerWithin } from "@dnd-kit/core";

/**
 * @description Hook para configurar la detección de colisiones en drag and drop.
 * @returns Estrategia de detección de colisiones
 */
export function useDndCollision() {
  // Con el collisionDetection=pointerWithin, el over sera el elemento bajo el cursor literal,
  // Por defecto se calcula en base al rect de cada elemento, pero asi podria no ser preciso
  // al usar el snapCenterToCursor en el DragOverlay de los nodos para centrar el elemento arrastrado al cursor.
  // Por ende opte por usar pointerWithin que es más intuitivo en este caso para calcular el over en base al cursor.
  // En el futuro si se necesita mas precision se podria implementar un callback para collision personalizado que combine ambos metodos.

  return pointerWithin;
}
