import { useQueryClient } from "@tanstack/react-query";
import { useUploadJob } from "./useUploadJob";
import { useEffect, useRef } from "react";
import type { NodeType } from "@/types";
import { sortNodesByDir } from "@/utils/node/sortNodes";

/**
 * @description Hook para sincronizar los nodos subidos con la caché de React Query aplicando optimistic updates.
 */
export function useUploadQuerySync() {
  const queryClient = useQueryClient();
  const { completed } = useUploadJob();
  const syncedRef = useRef<Set<string>>(new Set());

  // Función para fusionar nodos nuevos con los existentes, evitando duplicados
  const getMergedNodes = (
    oldNodes: NodeType[] | undefined,
    newNodes: NodeType[]
  ) => {
    // Inicializar los nodos actuales y un conjunto de IDs existentes
    const currentNodes = oldNodes || [];
    const existingIds = new Set(currentNodes.map((n) => n.id));

    // Filtrar los nuevos nodos para evitar duplicados
    const uniqueNewNodes = newNodes.filter((n) => !existingIds.has(n.id));

    // Si no hay nodos nuevos únicos, retornar los nodos actuales
    if (uniqueNewNodes.length === 0) return currentNodes;

    // Fusionar y ordenar los nodos
    const mergedNodes = sortNodesByDir([...currentNodes, ...uniqueNewNodes]);

    // Retornar los nodos fusionados
    return mergedNodes;
  };

  useEffect(() => {
    completed.forEach((job) => {
      // Si el trabajo no tiene datos del servidor, no hacer nada
      if (!job.serverData) return;
      // Si el trabajo ya ha sido sincronizado, no hacer nada
      if (syncedRef.current.has(job.id)) return;
      // Actualizar la caché de React Query para los nodos afectados
      queryClient.setQueryData(
        ["nodes", job.parentId],
        (oldData: NodeType[] | undefined) => {
          return getMergedNodes(oldData, job.serverData!);
        }
      );
      syncedRef.current.add(job.id);
    });
  }, [completed, queryClient]);
}
