import { Prisma, type PrismaClient } from "@/infra/prisma/generated/client";

import type { NodeSearchResult } from "../types";

export const nodeSearchExtension = {
  name: "nodeSearch",
  client: {
    async search({
      rootId,
      parentId,
      nameQuery,
      limit,
    }: {
      rootId: string;
      parentId: NodeSearchResult["parentId"] | null;
      nameQuery: string;
      limit?: number;
    }): Promise<NodeSearchResult[]> {
      // Obtener el contexto del cliente Prisma
      const ctx = Prisma.getExtensionContext(this) as unknown as PrismaClient;

      if (!nameQuery || nameQuery.trim().length === 0) {
        return [];
      }

      // Si no se especifica un límite, no lo aplicamos
      if (limit == null || limit <= 0) {
        return ctx.$queryRaw<NodeSearchResult[]>`
          SELECT *
          FROM search_nodes(
            ${rootId}::uuid, 
            ${parentId ?? null}::uuid, 
            ${nameQuery}
          )
        `;
      }

      // Ejecutar la consulta SQL para buscar nodos por nombre con límite (max 50 en la función SQL)
      return ctx.$queryRaw<NodeSearchResult[]>`
        SELECT *
        FROM search_nodes(
          ${rootId}::uuid, 
          ${parentId ?? null}::uuid, 
          ${nameQuery},
          ${limit}
        )
      `;
    },
  },
} as const;
