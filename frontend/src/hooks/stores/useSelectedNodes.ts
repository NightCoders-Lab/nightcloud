import { useAppStore } from "@/stores/useAppStore";

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
