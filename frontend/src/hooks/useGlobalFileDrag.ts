import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

/**
 * @description Hook para detectar si se están arrastrando archivos sobre la ventana global de la aplicación, ignorando si el modal de subida de archivos está abierto.
 * @returns {boolean} Estado activo de arrastre de archivos
 */
export function useGlobalFileDrag() {
  const [active, setActive] = useState(false);
  const dragCounter = useRef(0);

  // Obtener los parámetros de la URL
  const location = useLocation();
  // Obtener los query params
  const queryParams = new URLSearchParams(location.search);
  // Verificar si el modal de subida de archivos está abierto
  const isUploadModalOpen = queryParams.get("action") === "upload-files";

  useEffect(() => {
    // Cuando el cursor entra en el área
    const onDragEnter = (e: DragEvent) => {
      // Solo activar si se están arrastrando archivos
      if (e.dataTransfer?.types.includes("Files") && !isUploadModalOpen) {
        dragCounter.current++;
        setActive(true);
      }
    };

    // Cuando el cursor sale del área
    const onDragLeave = () => {
      // Disminuir el contador de drag
      dragCounter.current--;
      // Si el contador llega a 0, desactivar el estado activo
      if (dragCounter.current <= 0) {
        setActive(false);
      }
    };

    // Cuando se suelta el archivo
    const onDrop = () => {
      // Resetear el contador y el estado activo
      dragCounter.current = 0;
      // Desactivar el estado activo
      setActive(false);
    };

    // Añadir los event listeners
    globalThis.addEventListener("dragenter", onDragEnter);
    globalThis.addEventListener("dragleave", onDragLeave);
    globalThis.addEventListener("drop", onDrop);

    // Limpiar los event listeners al desmontar
    return () => {
      globalThis.removeEventListener("dragenter", onDragEnter);
      globalThis.removeEventListener("dragleave", onDragLeave);
      globalThis.removeEventListener("drop", onDrop);
    };
  }, [isUploadModalOpen]);

  return active && !isUploadModalOpen;
}
