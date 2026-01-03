import { PointerSensor, useSensor, useSensors } from "@dnd-kit/core";

export function useDndSensors() {
  // Configurar sensores para el drag and drop
  return useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Activar el drag solo si se mueve 8px
      },
    })
  );
}
