import type { StateCreator } from "zustand";
import type { FileWithPath } from "react-dropzone";

type FileWithId = { id: string; file: FileWithPath };

export type UploadStagingType = {
  stagedFiles: FileWithId[];
  stageFiles: (files: FileWithPath[]) => void;
  removeFileFromStaging: (file: FileWithId) => void;
  clearStagedFiles: () => void;
};

// 10,000 es seguro dentro de los limites del navegador,
// Aparte se subiran bajo concurrencia de acuerdo al limite configurado.
const MAX_UPLOAD_LIMIT = 10000;

export const createUploadStaging: StateCreator<UploadStagingType> = (
  set,
  get
) => ({
  stagedFiles: [],
  stageFiles: (files: FileWithPath[]) => {
    const stagedFiles = get().stagedFiles;

    // Variable para posibles errores
    let error = null;

    // Limitar archivos en staging
    if (stagedFiles.length >= MAX_UPLOAD_LIMIT) {
      error = `Upload staging limit of ${MAX_UPLOAD_LIMIT} files reached.`;
      return { error };
    }

    // Si al agregar los nuevos archivos se excede el límite, recortar la lista
    if (stagedFiles.length + files.length > MAX_UPLOAD_LIMIT) {
      files = files.slice(0, MAX_UPLOAD_LIMIT - stagedFiles.length); // Solo agregar hasta el límite
      error = `Only ${MAX_UPLOAD_LIMIT - stagedFiles.length} files were added.`;
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
