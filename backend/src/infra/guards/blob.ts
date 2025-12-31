/**
 * @description TypeGuard que verifica si un objeto es un Blob.
 * @param blob Objeto a verificar
 * @returns true si el objeto es un Blob, false en caso contrario
 */
export function isBlob(blob: unknown): blob is Blob {
  if (typeof blob !== "object" || blob === null) return false;
  const blobRecord = blob as Record<string, unknown>;
  return (
    typeof blobRecord.id === "string" &&
    typeof blobRecord.hash === "string" &&
    typeof blobRecord.size === "bigint" &&
    typeof blobRecord.mime === "string" &&
    typeof blobRecord.storageKey === "string" &&
    typeof blobRecord.storageType === "string" &&
    blobRecord.createdAt instanceof Date
  );
}
