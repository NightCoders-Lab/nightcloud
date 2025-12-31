import { Prisma, type PrismaClient } from "@/infra/prisma/generated/client";

import type { DescendantRowWithBlob } from "../types";

export const nodeDescendantsWithBlobExtension = {
  name: "nodeDescendantsWithBlob",
  client: {
    async getDescendantsWithBlob(
      startNodeId: string,
    ): Promise<DescendantRowWithBlob[]> {
      // Obtener el contexto del cliente Prisma
      const ctx = Prisma.getExtensionContext(this) as unknown as PrismaClient;

      // Ejecutar la consulta raw para obtener los descendientes
      return ctx.$queryRaw<DescendantRowWithBlob[]>`
        SELECT *
        FROM get_descendants_with_blob(${startNodeId});
      `;
    },
  },
} as const;
