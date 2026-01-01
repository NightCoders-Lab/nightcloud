import { useAppStore } from "@/stores/useAppStore";
import type {
  ContextMenuRegistry,
  ContextMenuType,
} from "@/types/contextMenu.types";

export function useCtxPayload<T extends ContextMenuType>(
  expectedType: T
) {
  const { type, payload } = useAppStore();

  // Si el menú abierto no es el que esperamos, devolvemos null
  if (type !== expectedType) return null;

  // TypeScript no puede inferir que payload es del tipo correcto, así que hacemos un casteo
  return payload as ContextMenuRegistry[T];
}
