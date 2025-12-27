import { useAppStore } from "@/stores/useAppStore";

/**
 * @description Hook para gestionar la etapa de subida de archivos.
 * @returns Un objeto con el estado y las acciones relacionadas con la etapa de subida.
 */
export function useUploadStage() {
  const { stageFiles, stagedFiles, removeFileFromStaging, clearStagedFiles } =
    useAppStore();

  return {
    stageFiles,
    stagedFiles,
    removeFileFromStaging,
    clearStagedFiles,
  };
}
