import type { Blob } from "@/domain/blobs/blob";
import type { PrismaBlob } from "@/types/prisma";

/**
 * @description Mapea un blob Prisma a un blob de dominio.
 * @param b Blob Prisma a mapear
 * @returns Blob de dominio mapeado
 */
export function fromPrismaBlob(b: PrismaBlob): Blob {
  return {
    id: b.id,
    hash: b.hash,
    size: BigInt(b.size),
    mime: b.mime,
    storageKey: b.storageKey,
    storageType: b.storageType,
    createdAt: b.createdAt,
  };
}
