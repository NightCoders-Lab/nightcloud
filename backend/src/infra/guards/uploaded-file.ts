import type { UploadedFile } from "@/domain/uploads/uploaded-file";
import type { UploadManifestEntry } from "@/types/upload";

/**
 * @description TypeGuard que verifica si un objeto es un UploadedFile.
 * @param obj Objeto a verificar
 * @returns true si el objeto es un UploadedFile, false en caso contrario
 */
export function isUploadedFile(obj: unknown): obj is UploadedFile {
  // Si no es un objeto o es null, no es UploadedFile
  if (typeof obj !== "object" || obj === null) return false;

  // Verificamos que tenga las propiedades necesarias
  const record = obj as Record<string, unknown>;
  return (
    typeof record.path === "string" &&
    typeof record.filename === "string" &&
    typeof record.originalname === "string" &&
    typeof record.mimetype === "string" &&
    typeof record.size === "bigint"
  );
}

/**
 * @description TypeGuard que verifica si un valor es un UploadManifestEntry[]
 * @param val Valor a verificar
 * @returns true si el valor es un UploadManifestEntry[], false en caso contrario
 */
export function isUploadManifest(val: unknown): val is UploadManifestEntry[] {
  // Si no es un array, no es UploadManifestEntry[]
  if (!Array.isArray(val)) return false;

  // Verificamos que cada entrada tenga las propiedades necesarias
  return val.every((entry) => {
    // Si no es un objeto o es null, no es UploadManifestEntry
    if (typeof entry !== "object" || entry === null) return false;

    // Le decimos que es un Record de string a unknown para verificar las propiedades
    const e = entry as Record<string, unknown>;

    // Verificamos las propiedades necesarias
    return (
      typeof e.name === "string" &&
      typeof e.path === "string" &&
      typeof e.size === "string" &&
      typeof e.mimeType === "string"
    );
  });
}
