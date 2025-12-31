import type { FileNodeWithBlob, Node, NodeLite } from "@/domain/nodes/node";
import {
  createDirectoryNode,
  createDirectoryNodeLite,
  createFileNode,
  createFileNodeLite,
} from "@/domain/nodes/node.factory";
import type { PrismaNode, PrismaNodeWithBlob } from "@/types/prisma";

import { isFileNode } from "../guards/node";
import type { AncestorRow, DescendantRow } from "../prisma/types";

/**
 * @description Mapea un nodo Prisma a un nodo de dominio.
 * @param n Nodo Prisma a mapear
 * @returns Nodo de dominio mapeado
 */
export function fromPrismaNode(n: PrismaNode): Node {
  return n.isDir
    ? createDirectoryNode({
        id: n.id,
        parentId: n.parentId,
        rootId: n.rootId,
        name: n.name,
        size: n.size,
        createdAt: n.createdAt,
        updatedAt: n.updatedAt,
      })
    : createFileNode({
        id: n.id,
        parentId: n.parentId,
        rootId: n.rootId,
        name: n.name,
        size: n.size,
        mime: n.mime,
        blobId: n.blobId!,
        createdAt: n.createdAt,
        updatedAt: n.updatedAt,
      });
}

/**
 * @description Mapea un nodo Prisma con blob a un nodo de dominio con blob.
 * @param n Nodo Prisma con blob a mapear
 * @returns Nodo de dominio con blob mapeado
 */
export function fromPrismaNodeWithBlob(
  n: PrismaNodeWithBlob,
): FileNodeWithBlob {
  if (!isFileNode(n)) throw new Error("Node is not a file node");

  return {
    ...createFileNode({
      id: n.id,
      parentId: n.parentId,
      rootId: n.rootId,
      name: n.name,
      size: n.size,
      mime: n.mime,
      blobId: n.blobId,
      createdAt: n.createdAt,
      updatedAt: n.updatedAt,
    }),
    blob: n.blob!, // Blob siempre estará presente en este contexto al ser un archivo
  };
}

/**
 * @description Mapea una fila de ancestro a un nodo de dominio.
 * @param r Fila de ancestro a mapear
 * @returns Nodo de dominio mapeado
 */
export function fromAncestorRow(r: AncestorRow): NodeLite {
  return r.isDir
    ? createDirectoryNodeLite({
        id: r.id,
        parentId: r.parentId,
        rootId: r.rootId,
        name: r.name,
        size: r.size,
      })
    : createFileNodeLite({
        id: r.id,
        parentId: r.parentId,
        rootId: r.rootId,
        name: r.name,
        size: r.size,
        mime: r.mime,
        blobId: r.blobId!,
      });
}

/**
 * @description Mapea una fila de descendiente a un nodo de dominio.
 * @param r Fila de descendiente a mapear
 * @returns Nodo de dominio mapeado
 */
export function fromDescendantRow(r: DescendantRow): NodeLite {
  return fromAncestorRow(r);
}
