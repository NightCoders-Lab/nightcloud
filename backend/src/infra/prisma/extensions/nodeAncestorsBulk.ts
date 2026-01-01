import { Prisma, type PrismaClient } from "@/infra/prisma/generated/client";

import type { AncestorRow } from "../types";

export const nodeAncestorsBulkExtension = {
  name: "nodeAncestorsBulk",
  client: {
    async getAncestorsBulk(rootNodeIds: string[]): Promise<AncestorRow[]> {
      // Obtener el contexto del cliente Prisma
      const ctx = Prisma.getExtensionContext(this) as unknown as PrismaClient;

      // Ejecutar la consulta raw para obtener los ancestros
      return ctx.$queryRaw<AncestorRow[]>`
        SELECT *
        FROM get_ancestors_bulk(${rootNodeIds});
      `;
    },
  },
} as const;
