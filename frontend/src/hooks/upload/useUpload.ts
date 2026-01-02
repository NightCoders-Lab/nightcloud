import { useAppStore } from "@/stores/useAppStore";

/**
 * @description Hook para gestionar el estado y las acciones relacionadas con la subida de archivos.
 * @returns Un objeto con el estado y las funciones de subida de archivos.
 */
export function useUpload() {
  const {
    upload: {
      isUploading,
      progress,
      status,
      controller,
      setProgress,
      setController,
      start,
      cancel,
      finish,
      fail,
      reset,
    },
  } = useAppStore();

  return {
    isUploading,
    progress,
    status,
    controller,
    setProgress,
    setController,
    start,
    cancel,
    finish,
    fail,
    reset,
  };
}
