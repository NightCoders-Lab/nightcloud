import type { Node, NodeLite } from "@/domain/nodes/node";
import {
  createDirectoryNode,
  createDirectoryNodeLite,
  createFileNode,
  createFileNodeLite,
} from "@/domain/nodes/node.factory";
import type { Node as PrismaNode } from "@/infra/prisma/generated/client";

import type { AncestorRow, DescendantRow } from "../prisma/types";

/**
 * @description Mapea un nodo Prisma a un nodo de dominio.
 * @param n Nodo Prisma a mapear
 * @returns Nodo de dominio mapeado
 */
export function fromPrismaNode(n: PrismaNode): Node {
  return n.isDir
    ? createDirectoryNode(n.id, n.parentId, n.name, n.hash, n.size, {
        createdAt: n.createdAt,
        updatedAt: n.updatedAt,
      })
    : createFileNode(n.id, n.parentId, n.name, n.hash, n.size, n.mime, {
        createdAt: n.createdAt,
        updatedAt: n.updatedAt,
      });
}

/**
 * @description Mapea una fila de ancestro a un nodo de dominio.
 * @param r Fila de ancestro a mapear
 * @returns Nodo de dominio mapeado
 */
export function fromAncestorRow(r: AncestorRow): NodeLite {
  return r.isDir
    ? createDirectoryNodeLite(r.id, r.parentId, r.name, r.hash, r.size)
    : createFileNodeLite(r.id, r.parentId, r.name, r.hash, r.size, r.mime);
}

/**
 * @description Mapea una fila de descendiente a un nodo de dominio.
 * @param r Fila de descendiente a mapear
 * @returns Nodo de dominio mapeado
 */
export function fromDescendantRow(r: DescendantRow): NodeLite {
  return fromAncestorRow(r);
}
