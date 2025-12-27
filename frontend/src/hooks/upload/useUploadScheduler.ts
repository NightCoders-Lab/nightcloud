import { useEffect, useRef } from "react";
import { useUploadJob } from "./useUploadJob";
import { uploadFiles } from "@/api/NodeAPI";
import { buildUploadFormData } from "@/utils/build/buildUploadFormData";

const BATCH_DELAY = 500; // Milisegundos de espera entre batches

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

  // Referencia para controlar el cooldown entre batches
  const isCoolingDownRef = useRef(false);

  useEffect(() => {
    if (paused) return;

    const availableSlots = maxConcurrency - active.length;
    if (availableSlots <= 0) return;

    const jobsToStart = queue.slice(0, availableSlots);

    jobsToStart.forEach((job) => {
      const startedJob = startJob(job.id);
      if (!startedJob?.controller) return;

      const formData = buildUploadFormData(
        startedJob.files,
        startedJob.parentId
      );

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

    // Activar cooldown cuando este batch termine
    isCoolingDownRef.current = true;

    // Configurar el temporizador para desactivar el cooldown
    const cooldownTimer = setTimeout(() => {
      isCoolingDownRef.current = false;
    }, BATCH_DELAY);

    // Limpiar el temporizador al rerenderizar o desmontar
    return () => clearTimeout(cooldownTimer);
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
