import { Prisma, type PrismaClient } from "@/infra/prisma/generated/client";

import type { DescendantRowWithBlob } from "../types";

export const nodeDescendantsBulkWithBlobExtension = {
  name: "nodeDescendantsBulkWithBlob",
  client: {
    async getDescendantsBulkWithBlob(
      rootNodeIds: string[],
    ): Promise<DescendantRowWithBlob[]> {
      // Obtener el contexto del cliente Prisma
      const ctx = Prisma.getExtensionContext(this) as unknown as PrismaClient;

      // Ejecutar la consulta raw para obtener los descendientes
      return ctx.$queryRaw<DescendantRowWithBlob[]>`
        SELECT *
        FROM get_descendants_bulk_with_blob(${rootNodeIds});
      `;
    },
  },
} as const;
