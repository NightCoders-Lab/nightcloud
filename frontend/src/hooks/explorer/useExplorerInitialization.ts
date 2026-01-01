import { useEffect, useRef } from "react";
import { useExplorer } from "@/hooks/explorer/useExplorer";
import type { NodeType } from "@/types";
import { useAppStore } from "@/stores/useAppStore";

export function useExplorerInitialization(
  rootParentId?: string,
  nodeData?: NodeType
) {
  const { resetExplorer: resetToCurrentId } = useAppStore();
  const { resetExplorer } = useExplorer();
  const hasInitializedRef = useRef(false);

  // Inicializar el explorador cuando rootParentId o nodeData cambien
  useEffect(() => {
    hasInitializedRef.current = false;
  }, [rootParentId]);

  // Al montar, resetear el explorador con el nodo actual
  useEffect(() => {
    // Si ya se ha inicializado, no hacer nada
    if (hasInitializedRef.current) return;

    // Si hay rootParentId, esperar a que nodeData esté disponible
    if (rootParentId) {
      // Si no hay nodeData, no hacer nada
      if (!nodeData) return;

      // Si el nodo obtenido no coincide con el rootParentId, resetear al ID
      // TODO: Creo que todavia podria dar algun bug falta testing
      if (nodeData.id !== rootParentId) {
        resetToCurrentId(rootParentId);
        return;
      }

      /// Resetear el explorador con el nodo obtenido
      resetExplorer(nodeData);
    } else {
      // Resetear el explorador a root
      resetExplorer();
    }

    // Marcar como inicializado
    hasInitializedRef.current = true;
  }, [rootParentId, nodeData, resetExplorer, resetToCurrentId]);
}
