import { useAppStore } from "@/stores/useAppStore";

/**
 * @description Hook para gestionar la opción seleccionada en una lista.
 * @returns {Object} Estado y funciones para manejar la opción seleccionada en la lista
 */
export function useList() {
  const { listSelectedOption, listSetSelectedOption } = useAppStore();
  return {
    listSelectedOption,
    listSetSelectedOption,
  };
}
