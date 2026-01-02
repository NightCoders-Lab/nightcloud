import { useAppStore } from "@/stores/useAppStore";

/**
 * @description Hook para gestionar los nodos seleccionados en la interfaz de usuario.
 * @returns {Object} Estado y funciones para manejar los nodos seleccionados
 */
export function useSelectedNodes() {
  const {
    selectedNodes,
    addSelectedNodes,
    setSelectedNodes,
    removeSelectedNode,
    clearSelectedNodes,
  } = useAppStore();

  return {
    selectedNodes,
    addSelectedNodes,
    setSelectedNodes,
    removeSelectedNode,
    clearSelectedNodes,
  };
}
