import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useExplorer } from "@/hooks/explorer/useExplorer";

/**
 * @description Hook para sincronizar el contexto del explorador de nodos con la URL actual.
 * @returns El rootParentId obtenido de la URL, el contextRootId del explorador y la función resetExplorer.
 */
export function useExplorerContext() {
  const location = useLocation();
  const rootParentId = location.pathname.split("/").pop() || null; // Obtener el parentId de la URL
  const { contextRootId, setContextRootId, resetExplorer } = useExplorer();

  // Sincronizar el root lógico con la URL
  useEffect(() => {
    setContextRootId(rootParentId || undefined);
  }, [rootParentId, setContextRootId]);

  // Retornar el rootParentId y el contextRootId
  return { rootParentId, contextRootId, resetExplorer };
}
