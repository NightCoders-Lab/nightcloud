import { useEffect } from "react";
import { useUploadJob } from "./useUploadJob";
import { uploadFiles } from "@/api/NodeAPI";
import { buildUploadFormData } from "@/utils/build/buildUploadFormData";
import type { UploadJob } from "@/types/upload.types";

/**
 * @description Hook para gestionar la programación de subidas de archivos, iniciando nuevas subidas según la concurrencia máxima permitida y el estado de la cola.
 */
export function useUploadScheduler() {
  const {
    queue,
    active,
    paused,
    maxConcurrency,
    startJob,
    updateProgress,
    completeJob,
    failJob,
    cancelJob,
  } = useUploadJob();

  // Función para procesar cada trabajo
  const processJob = (job: UploadJob) => {
    // Iniciar el trabajo y obtener el controlador de aborto
    const startedJob = startJob(job.id);
    if (!startedJob?.controller) return;

    // Construir el FormData para la subida
    const formData = buildUploadFormData(startedJob.files, startedJob.parentId);

    // Iniciar la subida de archivos (con 3 reintentos en caso de fallar por saturacion o problemas de red)
    attemptUpload(startedJob, formData, 3, 1000); // Retardo inicial de 1s entre reintentos
  };

  // Función para intentar la subida con reintentos
  const attemptUpload = async (
    job: UploadJob,
    formData: FormData,
    retriesLeft: number,
    delayMs: number
  ) => {
    try {
      const data = await uploadFiles(
        formData,
        job.controller!.signal,
        async (p) => {
          updateProgress(job.id, p.percent);
        }
      );

      completeJob(job.id, data);
    } catch (err) {
      // Si la subida fue abortada, no marcar como fallida
      if (job.controller?.signal.aborted) {
        cancelJob(job.id);
        return;
      }

      if (retriesLeft > 0) {
        console.warn(
          `[Upload Retry] Job ${job.id} falló. Reintentando en 1s... (${retriesLeft} intentos restantes)`
        );

        // Esperar el delay antes de reintentar
        setTimeout(() => {
          if (!job.controller?.signal.aborted) {
            attemptUpload(job, formData, retriesLeft - 1, delayMs * 2); // Doble del retardo para el próximo intento
          }
        }, delayMs);

        return;
      }

      // Marcar el trabajo como fallido después de agotar los reintentos
      failJob(job.id, err);
    }
  };

  // Efecto para gestionar el inicio de nuevas subidas según la concurrencia máxima
  useEffect(() => {
    if (paused) return;

    // Calcular los slots disponibles
    const availableSlots = maxConcurrency - active.length;
    if (availableSlots <= 0) return;

    // Obtener los trabajos a iniciar
    const jobsToStart = queue.slice(0, availableSlots);

    // Si no hay trabajos para iniciar, no hacer nada
    if (jobsToStart.length === 0) return;

    const startTimeout = setTimeout(() => {
      // Iniciar los trabajos
      jobsToStart.forEach(processJob);
    }, 150); // Retardo de 150ms antes de iniciar nuevas subidas

    // Limpiar el timeout si el efecto se vuelve a ejecutar antes de que se complete
    return () => clearTimeout(startTimeout);

    // Desactivar la regla de exhaustividad de dependencias porque queremos que este efecto
    // se ejecute solo cuando cambie la cola, el estado activo, la pausa o la concurrencia máxima.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    queue,
    active.length,
    paused,
    maxConcurrency,
    startJob,
    updateProgress,
    completeJob,
    failJob,
    cancelJob,
  ]);
}
