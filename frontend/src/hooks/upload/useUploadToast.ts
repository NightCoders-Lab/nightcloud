import { useEffect, useRef } from "react";
import { useUploadJob } from "./useUploadJob";
import {
  cancelUploadToast,
  createUploadToast,
  errorUploadToast,
  successUploadToast,
  updateUploadToast,
  warningUploadToast,
} from "@/utils/toasts/uploadToast";
import type { Id } from "react-toastify";
import { getGlobalProgress } from "@/utils/getGlobalProgress";

const UPDATE_INTERVAL_MS = 100;

/**
 * @description Hook para gestionar la creación, actualización y finalización de un toast de subida de archivos basado en el estado de las subidas.
 */
export function useUploadToast() {
  const { queue, active, completed, failed, cancelled, cancelAll } =
    useUploadJob();

  const toastIdRef = useRef<Id>(null);
  // Para controlar la frecuencia de actualización del toast
  const lastUpdateRef = useRef<number>(0);
  const lastProgressRef = useRef<number>(0);

  const progress = getGlobalProgress(queue, active, completed, failed);

  // Gestionar la creación, actualización y finalización del toast
  useEffect(() => {
    // Comprobar si hay actividad de subida
    const hasActivity = queue.length > 0 || active.length > 0;

    // Crear el toast si hay actividad y no existe uno
    if (hasActivity && !toastIdRef.current) {
      toastIdRef.current = createUploadToast();
      lastUpdateRef.current = Date.now();
    }

    // Actualizar el toast si existe y hay actividad
    if (toastIdRef.current && hasActivity) {
      // Controlar la frecuencia de actualización
      const now = Date.now();
      // Calcular el tiempo desde la última actualización
      const timeSinceLastUpdate = now - lastUpdateRef.current;
      // Calcular el cambio significativo en el progreso
      const progressChangedSignificantly = Math.abs(
        progress - lastProgressRef.current
      );

      if (
        timeSinceLastUpdate >= UPDATE_INTERVAL_MS ||
        progressChangedSignificantly ||
        progress === 100 ||
        progress === 0
      ) {
        updateUploadToast(toastIdRef.current, () => cancelAll(), progress);
        lastUpdateRef.current = now;
        lastProgressRef.current = progress;
      }
    }
  }, [queue.length, active.length, progress, cancelAll]);

  // Efecto para finalizar el toast cuando todas las subidas han terminado
  useEffect(() => {
    // Si no hay un toast activo, no hacer nada
    if (!toastIdRef.current) return;

    // Comprobar si está idle
    const isIdle = queue.length === 0 && active.length === 0;
    if (!isIdle) return;

    const successCount = completed.length;
    const errorCount = failed.length;
    const cancelledCount = cancelled.length;
    const totalProcessed = successCount + errorCount + cancelledCount;

    // Si no se procesó nada (ej: se limpió el store), cerramos silenciosamente
    if (totalProcessed === 0) {
      toastIdRef.current = null;
      return;
    }

    // Mostrar el toast final según los resultados
    if (errorCount === 0 && cancelledCount === 0) {
      // Si fue exitoso (0 errores y 0 cancelados)
      successUploadToast(toastIdRef.current);
    } else if (successCount === 0 && errorCount === 0) {
      // Si fue cancelado
      cancelUploadToast(toastIdRef.current);
    } else if (errorCount > 0 && successCount > 0) {
      // Si hubo errores pero también subidas exitosas
      warningUploadToast(
        toastIdRef.current,
        `${successCount} files uploaded, ${errorCount} failed.`
      );
    } else {
      // Si hubo solo errores
      errorUploadToast(toastIdRef.current);
    }

    // Resetear la referencia del toast
    toastIdRef.current = null;
    lastProgressRef.current = 0;
  }, [
    queue.length,
    active.length,
    failed.length,
    cancelled.length,
    completed.length,
    failed,
  ]);
}
