import type { StateCreator } from "zustand";
import type { FileWithPath } from "react-dropzone";

type FileWithId = { id: string; file: FileWithPath };

export type UploadStagingType = {
  stagedFiles: FileWithId[];
  stageFiles: (files: FileWithPath[]) => void;
  removeFileFromStaging: (file: FileWithId) => void;
  clearStagedFiles: () => void;
};

export const createUploadStaging: StateCreator<UploadStagingType> = (
  set,
  get
) => ({
  stagedFiles: [],
  stageFiles: (files: FileWithPath[]) => {
    const stagedFiles = get().stagedFiles;
    const uploadLimit =
      Number(import.meta.env.VITE_API_UPLOAD_FILES_LIMIT) || 10;

    // Variable para posibles errores
    let error = null;

    // Limitar archivos en staging
    if (stagedFiles.length >= uploadLimit) {
      error = `Upload staging limit of ${uploadLimit} files reached.`;
      return { error };
    }

    // Si al agregar los nuevos archivos se excede el límite, recortar la lista
    if (stagedFiles.length + files.length > uploadLimit) {
      files = files.slice(0, uploadLimit - stagedFiles.length); // Solo agregar hasta el límite
      error = `Only ${uploadLimit - stagedFiles.length} files were added.`;
    }

    set((prev) => ({
      stagedFiles: [
        ...prev.stagedFiles,
        ...files.map((file) => ({
          id: crypto.randomUUID(),
          file,
        })),
      ],
    }));

    if (error) {
      return { error };
    }
  },
  removeFileFromStaging: (file: FileWithId) => {
    set((prev) => ({
      stagedFiles: prev.stagedFiles.filter((f) => f.id !== file.id),
    }));
  },
  clearStagedFiles: () => {
    set({ stagedFiles: [] });
  },
});
