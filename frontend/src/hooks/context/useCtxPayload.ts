import { useAppStore } from "@/stores/useAppStore";
import type {
  ContextMenuRegistry,
  ContextMenuType,
} from "@/types/contextMenu.types";

/**
 * @description Hook para obtener el payload del menú contextual si el tipo coincide con el esperado.
 * @param expectedType Tipo esperado del menú contextual
 * @returns El payload del menú contextual si el tipo coincide, o null en caso contrario
 */
export function useCtxPayload<T extends ContextMenuType>(
  expectedType: T
) {
  const { type, payload } = useAppStore();

  // Si el menú abierto no es el que esperamos, devolvemos null
  if (type !== expectedType) return null;

  // TypeScript no puede inferir que payload es del tipo correcto, así que hacemos un casteo
  return payload as ContextMenuRegistry[T];
}
