import { useAppStore } from "@/stores/useAppStore";

/**
 * @description Hook para gestionar trabajos de subida de archivos.
 * @returns Un objeto con el estado y las acciones relacionadas con los trabajos de subida.
 */
export function useUploadJob() {
  const {
    queue,
    active,
    completed,
    failed,
    cancelled,
    maxConcurrency,
    paused,
    enqueue,
    startJob,
    updateProgress,
    completeJob,
    failJob,
    cancelJob,
    cancelAll,
    pauseAll,
    resumeAll,
  } = useAppStore();

  return {
    // Estado
    queue,
    active,
    completed,
    failed,
    cancelled,
    maxConcurrency,
    paused,

    // Acciones
    enqueue,
    startJob,
    updateProgress,
    completeJob,
    failJob,
    cancelJob,
    cancelAll,
    pauseAll,
    resumeAll,
  };
}
