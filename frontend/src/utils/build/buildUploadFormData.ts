import type { NodeType } from "@/types";
import type { FileWithPath } from "react-dropzone";

export function buildUploadFormData(
  files: FileWithPath[],
  parentId: NodeType["id"] | null
) {
  const formData = new FormData();

  // Crear el manifiesto de archivos
  const manifest = files.map((file) => ({
    name: file.name,
    path: (file.path || file.webkitRelativePath || file.name).replaceAll(
      "\\",
      "/"
    ),
    size: file.size.toString(), // Convertir size a string por compatibilidad
    mimeType: file.type,
  }));

  // Por cada archivo, agregarlo al FormData
  for (const file of files) {
    formData.append("file", file);
  }

  // Agregar el parentId si existe
  if (parentId) formData.append("parentId", parentId);

  // Agregar el manifiesto al FormData
  formData.append("manifest", JSON.stringify(manifest));

  return formData;
}
