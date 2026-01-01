import { Prisma, type PrismaClient } from "@/infra/prisma/generated/client";

import type { DescendantRow } from "../types";

export const nodeDescendantsBulkExtension = {
  name: "nodeDescendantsBulk",
  client: {
    async getDescendantsBulk(rootNodeIds: string[]): Promise<DescendantRow[]> {
      // Obtener el contexto del cliente Prisma
      const ctx = Prisma.getExtensionContext(this) as unknown as PrismaClient;

      // Ejecutar la consulta raw para obtener los descendientes
      return ctx.$queryRaw<DescendantRow[]>`
        SELECT *
        FROM get_descendants_bulk(${rootNodeIds});
      `;
    },
  },
} as const;
