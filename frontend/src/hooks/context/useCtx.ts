import { useAppStore } from "@/stores/useAppStore";

/**
 * @description Hook para manejar el menú contextual
 * @returns {Object} Estado y funciones del menú contextual
 */
export function useCtx() {
  const { isOpen, position, type, openCtx, closeCtx } = useAppStore();

  return {
    isOpen,
    position,
    type,
    openCtx,
    closeCtx,
  };
}
