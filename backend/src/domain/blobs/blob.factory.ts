import type { Blob, CreateBlobParams } from "./blob";

/**
 * @description Factory para crear blobs
 * @param param0 Parámetros para crear el blob
 * @returns Blob creado
 */
export function createBlob({
  id,
  hash,
  size,
  mime,
  storageKey,
  storageType,
  createdAt,
}: CreateBlobParams): Blob {
  return {
    id,
    hash,
    size,
    mime,
    storageKey,
    storageType,
    createdAt,
  };
}
