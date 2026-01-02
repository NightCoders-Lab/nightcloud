import type { FileWithPath } from "react-dropzone";
import { useUploadJob } from "./useUploadJob";
import type { NodeType } from "@/types";

/**
 * @description Hook para manejar la subida de archivos a una carpeta específica.
 * @param parentId ID del nodo padre donde se subirán los archivos
 * @returns Objeto con la función para subir archivos
 */
export function useUploadFiles(parentId: NodeType["id"] | null) {
  const { enqueue } = useUploadJob();

  return {
    uploadFiles: (files: FileWithPath[]) => {
      enqueue(files, parentId);
    },
  };
}
