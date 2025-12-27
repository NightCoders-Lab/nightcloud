import { useEffect, useRef } from "react";
import { useUploadJob } from "./useUploadJob";
import {
  cancelUploadToast,
  createUploadToast,
  errorUploadToast,
  successUploadToast,
  updateUploadToast,
} from "@/utils/toasts/uploadToast";
import type { Id } from "react-toastify";
import { getGlobalProgress } from "@/utils/getGlobalProgress";

export function useUploadToast() {
  const { queue, active, completed, failed, cancelled, cancelAll } =
    useUploadJob();

  const toastIdRef = useRef<Id>(null);

  const progress = getGlobalProgress(queue, active, completed, failed);

  // Gestionar la creación, actualización y finalización del toast
  useEffect(() => {
    // Comprobar si hay actividad de subida
    const hasActivity = queue.length > 0 || active.length > 0;

    // Crear el toast si hay actividad y no existe uno
    if (hasActivity && !toastIdRef.current) {
      toastIdRef.current = createUploadToast();
    }

    // Actualizar el toast si existe y hay actividad
    if (toastIdRef.current && hasActivity) {
      updateUploadToast(toastIdRef.current, () => cancelAll(), progress);
    }
  }, [queue.length, active.length, progress, cancelAll]);

  // Efecto para finalizar el toast cuando todas las subidas han terminado
  useEffect(() => {
    // Si no hay un toast activo, no hacer nada
    if (!toastIdRef.current) return;

    // Comprobar si está idle
    const isIdle = queue.length === 0 && active.length === 0;
    if (!isIdle) return;

    const hasSuccess = completed.length > 0;
    const hasError = failed.length > 0;
    const hasCancelled = cancelled.length > 0;

    // Finalizar el toast según el resultado de las subidas
    if (!hasSuccess && hasCancelled) {
      cancelUploadToast(toastIdRef.current);
    } else if (hasError) {
      console.log(failed);
      errorUploadToast(toastIdRef.current);
    } else if (hasSuccess) {
      successUploadToast(toastIdRef.current);
    }

    // Resetear la referencia del toast
    toastIdRef.current = null;
  }, [
    queue.length,
    active.length,
    failed.length,
    cancelled.length,
    completed.length,
    failed,
  ]);
}
