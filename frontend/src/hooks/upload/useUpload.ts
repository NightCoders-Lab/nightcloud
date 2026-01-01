import { useAppStore } from "@/stores/useAppStore";

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
