import type { UploadJob } from "@/types/upload.types";

/**
 * @description Calcula el progreso global de todas las subidas
 * @param queue Cola de trabajos
 * @param active Trabajos activos
 * @param completed Trabajos completados
 * @param failed Trabajos fallidos
 * @returns Progreso global en porcentaje (0-100)
 */
export function getGlobalProgress(
  queue: UploadJob[],
  active: UploadJob[],
  completed: UploadJob[],
  failed: UploadJob[]
) {
  // Calcular el total de trabajos
  const total = queue.length + active.length + completed.length + failed.length;

  // Si no hay trabajos, el progreso es 0
  if (total === 0) return 0;

  // Calcular el progreso global
  const completedProgress = completed.length * 100; // Cada trabajo completado aporta 100%
  const failedProgress = failed.length * 100; // Cada trabajo fallido aporta 100%
  // Sumar el progreso de los trabajos activos
  const activeProgress = active.reduce((acc, job) => acc + job.progress, 0);

  // Calcular el porcentaje global
  return Math.round(
    (completedProgress + failedProgress + activeProgress) / total
  );
}
