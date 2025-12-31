import { useEffect } from "react";
import { useUploadJob } from "./useUploadJob";
import { uploadFiles } from "@/api/NodeAPI";
import { buildUploadFormData } from "@/utils/build/buildUploadFormData";


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

  useEffect(() => {
    if (paused) return;

    // Calcular los slots disponibles
    const availableSlots = maxConcurrency - active.length;
    if (availableSlots <= 0) return;

    // Obtener los trabajos a iniciar
    const jobsToStart = queue.slice(0, availableSlots);

    // Si no hay trabajos para iniciar, no hacer nada
    if (jobsToStart.length === 0) return;

    // Iniciar los trabajos
    jobsToStart.forEach((job) => {
      // Iniciar el trabajo y obtener el controlador de aborto
      const startedJob = startJob(job.id);
      if (!startedJob?.controller) return;

      // Construir el FormData para la subida
      const formData = buildUploadFormData(
        startedJob.files,
        startedJob.parentId
      );

      // Iniciar la subida de archivos
      uploadFiles(formData, startedJob.controller.signal, async (p) => {
        updateProgress(startedJob.id, p.percent);
      })
        .then((data) => completeJob(startedJob.id, data))
        .catch((err) => {
          // Si la subida fue abortada, no marcar como fallida
          if (startedJob.controller?.signal.aborted) {
            cancelJob(startedJob.id);
            return;
          }
          // Marcar el trabajo como fallido
          failJob(startedJob.id, err);
        });
    });
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
