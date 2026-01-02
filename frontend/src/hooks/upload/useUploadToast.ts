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

  // Calcular el progreso global de las subidas
  const progress = getGlobalProgress(queue, active, completed, failed);

  // Comprobar si hay actividad de subida
  const hasActivity = queue.length > 0 || active.length > 0;

  // Función para procesar la creación del toast
  const processCreation = () => {
    // Crear el toast si hay actividad y no existe uno
    if (hasActivity && !toastIdRef.current) {
      toastIdRef.current = createUploadToast();
      lastUpdateRef.current = Date.now();
    }
  };

  // Función para procesar la actualización del toast
  const processUpdate = () => {
    // Actualizar el toast solo si existe y hay actividad
    if (!toastIdRef.current || !hasActivity) return;

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
  };

  // Función para procesar la finalización del toast
  const processCompletion = () => {
    // Finalizar el toast solo si no hay actividad
    if (hasActivity || !toastIdRef.current) return;

    const successCount = completed.length;
    const errorCount = failed.length;
    const cancelledCount = cancelled.length;
    const totalProcessed = successCount + errorCount + cancelledCount;

    // Si no se procesó nada (ej: se limpió el store), cerramos silenciosamente
    if (totalProcessed === 0) {
      toastIdRef.current = null;
      return;
    }

    // Finalizar el toast según los resultados
    finalizeToast(successCount, errorCount, cancelledCount);

    // Resetear la referencia del toast
    toastIdRef.current = null;
    lastProgressRef.current = 0;
  };

  // Función para finalizar el toast según los resultados de la subida
  const finalizeToast = (
    successCount: number,
    errorCount: number,
    cancelledCount: number
  ) => {
    // Obtener el id del toast actual
    const id = toastIdRef.current!;

    // Si fue exitoso (0 errores y 0 cancelados)
    if (errorCount === 0 && cancelledCount === 0) {
      successUploadToast(id);
      return;
    }

    // Si fue cancelado
    if (successCount === 0 && errorCount === 0) {
      cancelUploadToast(id);
      return;
    }

    // Si hubo errores pero también subidas exitosas
    if (errorCount > 0 && successCount > 0) {
      warningUploadToast(
        id,
        `${successCount} files uploaded, ${errorCount} failed.`
      );
      return;
    }

    // Default: Si hubo solo errores
    errorUploadToast(id);
  };

  // Efecto para gestionar el ciclo de vida del toast de subida
  useEffect(() => {
    processCreation();
    processUpdate();
    processCompletion();

    // Desactivar la regla de exhaustividad de dependencias porque queremos que este efecto
    // se ejecute solo cuando cambie el estado de las subidas, no por cambios en las funciones.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    hasActivity,
    progress,
    queue.length,
    active.length,
    completed.length,
    failed.length,
    cancelled.length,
    cancelAll,
  ]);
}
