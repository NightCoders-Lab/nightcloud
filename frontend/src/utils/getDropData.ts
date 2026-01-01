import type { DragEndEvent } from "@dnd-kit/core";

/**
 * @description Obtener datos del evento de drag and drop de DnD Kit
 * @param event DragEndEvent evento de fin de drag
 * @returns Objeto con datos del drag and drop o null si no hay un over valido
 */
export function getDropData(event: DragEndEvent) {
  // Obtener el elemento activo (el que se está arrastrando) y el elemento sobre el que se suelta (si es que existe)
  const { active, over } = event;

  // Si no hay un elemento sobre el que se suelta, retornar null
  if (!over) return null;

  // Retornar los datos relevantes
  return {
    activeId: active.id,
    overId: over.id,
    activeData: active.data.current,
    overData: over.data.current,
  };
}
