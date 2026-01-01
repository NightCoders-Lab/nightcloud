import { isUploadManifest } from "@/infra/guards/uploaded-file";

import { AppError } from "../errors/handler";

/**
 * @description Parsea y valida un manifiesto de subida.
 * @param raw Datos crudos del manifiesto
 * @param uploadedFilesCount Cantidad de archivos subidos
 * @returns Manifiesto parseado y validado, o null si no es válido
 */
export function parseManifest(raw: unknown, uploadedFilesCount: number) {
  if (typeof raw !== "string") return null;

  try {
    const parsed = JSON.parse(raw) as string;
    if (!isUploadManifest(parsed)) return null;

    if (parsed.length !== uploadedFilesCount) {
      throw new AppError("MANIFEST_MISMATCH_ERROR");
    }

    return parsed;
  } catch (err) {
    console.log("Error parsing manifest:");
    console.log(err);
    throw new AppError("INVALID_MANIFEST_FORMAT");
  }
}
