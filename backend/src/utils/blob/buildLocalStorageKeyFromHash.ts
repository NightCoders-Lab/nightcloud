import type { Blob } from "@/domain/blobs/blob";

/**
 * @description Construye una storage key para almacenamiento local basada en el hash del blob.
 * @param hash Hash del blob
 * @returns Storage key en formato de carpetas
 */
export function buildLocalStorageKeyFromHash(hash: Blob["hash"]): string {
  // Usar los primeros 4 caracteres del hash para crear subdirectorios
  const p1 = hash.substring(0, 2); // Primeros dos caracteres
  const p2 = hash.substring(2, 4); // Siguientes dos caracteres

  // Construir la storage key en formato de carpetas
  return `${p1}/${p2}/${hash}`;
}
