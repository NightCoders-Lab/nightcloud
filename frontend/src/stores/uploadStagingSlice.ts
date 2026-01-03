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

// Generar un identificador unico para un archivo basado en sus propiedades
const getFileSignature = (file: FileWithPath) => {
  return `${file.path || file.name}-${file.size}-${file.lastModified}`;
};

export const createUploadStaging: StateCreator<UploadStagingType> = (
  set,
  get
) => ({
  stagedFiles: [],
  stageFiles: (incomingFiles: FileWithPath[]) => {
    // Obtener los archivos actualmente en staging
    const currentStagedFiles = get().stagedFiles;

    // Variable para posibles errores
    let error = null;

    // Limitar archivos en staging
    if (currentStagedFiles.length >= MAX_UPLOAD_LIMIT) {
      error = `Upload staging limit of ${MAX_UPLOAD_LIMIT} files reached.`;
      return { error };
    }

    // Conjunto de firmas de archivos ya en staging para evitar duplicados
    const existingSignatures = new Set(
      currentStagedFiles.map((f) => getFileSignature(f.file))
    );

    // Listar solo los archivos que no estan ya en staging
    let uniqueFilesToAdd: FileWithPath[] = [];

    // Filtrar archivos duplicados
    for (const file of incomingFiles) {
      // Obtener la firma del archivo
      const signature = getFileSignature(file);

      // Si la firma ya existe, saltar este archivo
      if (existingSignatures.has(signature)) {
        continue;
      }

      // Si no existe, agregar a la lista y marcar la firma como existente
      uniqueFilesToAdd.push(file);
      existingSignatures.add(signature);
    }

    // No hay archivos nuevos para agregar
    if (uniqueFilesToAdd.length === 0) return;

    // Si al agregar los nuevos archivos se excede el límite, recortar la lista
    if (
      currentStagedFiles.length + uniqueFilesToAdd.length >
      MAX_UPLOAD_LIMIT
    ) {
      const availableSlots = MAX_UPLOAD_LIMIT - currentStagedFiles.length;
      uniqueFilesToAdd = uniqueFilesToAdd.slice(0, availableSlots);
      error = `Only ${
        MAX_UPLOAD_LIMIT - currentStagedFiles.length
      } files were added.`;
    }

    set((prev) => ({
      stagedFiles: [
        ...prev.stagedFiles,
        ...uniqueFilesToAdd.map((file) => ({
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
