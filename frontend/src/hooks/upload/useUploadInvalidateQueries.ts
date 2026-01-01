import { useQueryClient } from "@tanstack/react-query";
import { useUploadJob } from "./useUploadJob";
import { useEffect, useRef } from "react";
import type { NodeType } from "@/types";

export function useUploadInvalidateQueries() {
  const queryClient = useQueryClient();
  const { queue, active, completed } = useUploadJob();

  // Referencia para evitar invalidaciones en los diferentes batches de subida
  const invalidatedRef = useRef(false);

  // Efecto para invalidar las queries cuando todas las subidas se han completado
  useEffect(() => {
    const isIdle = queue.length === 0 && active.length === 0;
    const hasCompletedJobs = completed.length > 0;

    // Si no está idle o no hay trabajos completados, no hacer nada
    if (!isIdle || !hasCompletedJobs) return;
    // Si ya se ha invalidado en este batch, no hacer nada
    if (invalidatedRef.current) return;

    // Obtener los IDs de los padres de los trabajos completados
    const parentIds = new Set<NodeType["id"] | null>();
    // Agregar los parentIds de los trabajos completados
    completed.forEach((job) => {
      parentIds.add(job.parentId);
    });

    // Invalidar las queries de los nodos padres
    parentIds.forEach((parentId) => {
      queryClient.invalidateQueries({
        queryKey: ["nodes", parentId ?? "root"],
      });
      // Si hay un parentId, invalidar también los detalles del nodo padre
      if (parentId) {
        queryClient.invalidateQueries({ queryKey: ["node", "details", parentId] });
      }
    });

    // Invalidar las estadísticas de la nube
    queryClient.invalidateQueries({ queryKey: ["cloudStats"] });

    invalidatedRef.current = true;
  }, [queue.length, active.length, completed, queryClient]);

  // Resetear la referencia cuando haya trabajos en cola o activos
  useEffect(() => {
    // Si hay trabajos en cola o activos, resetear la referencia
    if (queue.length > 0 || active.length > 0) {
      // Resetear la referencia
      invalidatedRef.current = false;
    }
  }, [queue.length, active.length]);
}
