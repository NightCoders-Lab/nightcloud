import type { DB } from "@/config/db";
import type { Prisma } from "@/infra/prisma/generated/client";

// Tipo del cliente de Prisma
export type PrismaDbClient = ReturnType<typeof DB.getClient>;

// Tipo del cliente de transacciones de Prisma (compatible con extensiones)
export type PrismaTxClient = Parameters<
  Parameters<PrismaDbClient["$transaction"]>[0]
>[0];
export type PrismaBatchPayload = Prisma.BatchPayload;

// Tipos del modelo Node de Prisma
export type PrismaNode = Prisma.NodeGetPayload<object>;
export type PrismaNodeCreateInput = Prisma.NodeCreateInput;
export type PrismaNodeCreateManyInput = Prisma.NodeCreateManyInput;
export type PrismaNodeUpdateInput = Prisma.NodeUpdateInput;
export type PrismaNodeWithBlob = Prisma.NodeGetPayload<{
  include: { blob: true };
}>;

// Tipos del modelo Blob de Prisma
export type PrismaBlob = Prisma.BlobGetPayload<object>;
export type PrismaBlobCreateInput = Prisma.BlobCreateInput;
export type PrismaBlobUpdateInput = Prisma.BlobUpdateInput;
