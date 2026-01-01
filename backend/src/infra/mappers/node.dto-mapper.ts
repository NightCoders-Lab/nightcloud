import type { Node } from "@/domain/nodes/node";
import type {
  AncestorDTO,
  DescendantDTO,
  NodeDTO,
  NodeLiteDTO,
  NodeSearchDTO,
} from "@/dtos/node.dto";

import type { AncestorRow, NodeSearchResult } from "../prisma/types";

type NodePicked = Pick<
  Node,
  | "id"
  | "parentId"
  | "rootId"
  | "name"
  | "size"
  | "mime"
  | "isDir"
  | "createdAt"
  | "updatedAt"
>;

type NodeLitePicked = Pick<
  Node,
  "id" | "parentId" | "rootId" | "name" | "size" | "mime" | "isDir"
>;

type AncestorPicked = Pick<
  AncestorRow,
  "id" | "parentId" | "rootId" | "name" | "size" | "mime" | "isDir" | "depth"
>;

type DescendantPicked = Pick<
  AncestorRow,
  "id" | "parentId" | "rootId" | "name" | "size" | "mime" | "isDir" | "depth"
>;

/**
 * @description Mapea un nodo de dominio a un NodeDTO.
 * @param n Nodo de dominio a mapear
 * @returns NodeDTO mapeado
 */
export const toNodeDTO = (n: NodePicked): NodeDTO => ({
  id: n.id,
  parentId: n.parentId,
  rootId: n.rootId,
  name: n.name,
  size: n.size.toString(), // Convertir bigint a string por temas de incompatibilidad con JSON
  mime: n.mime,
  isDir: n.isDir,
  createdAt: n.createdAt,
  updatedAt: n.updatedAt,
});

/**
 * @description Mapea un nodo de dominio a un AncestorDTO.
 * @param n Nodo de dominio a mapear
 * @returns AncestorDTO mapeado
 */
export const toAncestorDTO = (n: AncestorPicked): AncestorDTO => ({
  id: n.id,
  parentId: n.parentId,
  rootId: n.rootId,
  name: n.name,
  size: n.size.toString(), // Convertir bigint a string por temas de incompatibilidad con JSON
  mime: n.mime,
  isDir: n.isDir,
  depth: n.depth,
});

/**
 * @description Mapea una lista de nodos de dominio a una lista de AncestorDTO.
 * @param nodes Lista de nodos de dominio a mapear
 * @returns Lista de AncestorDTO mapeados
 */
export const toAncestorDTOList = (nodes: AncestorPicked[]): AncestorDTO[] => {
  return nodes.filter((n) => n.rootId !== n.id).map(toAncestorDTO);
};

// Mismo mapeo que AncestorDTO, si cambia en el futuro se puede modificar aqui
/**
 * @description Mapea un nodo de dominio a un DescendantDTO.
 * @param n Nodo de dominio a mapear
 * @returns DescendantDTO mapeado
 */
export const toDescendantDTO = (n: DescendantPicked): DescendantDTO =>
  toAncestorDTO(n);

/**
 * @description Mapea un resultado de búsqueda de nodo a un NodeSearchDTO.
 * @param n Resultado de búsqueda de nodo a mapear
 * @returns NodeSearchDTO mapeado
 */
export const toNodeSearchDTO = (n: NodeSearchResult): NodeSearchDTO => ({
  id: n.id,
  parentId: n.parentId,
  name: n.name,
  size: n.size.toString(), // Convertir bigint a string por temas de incompatibilidad con JSON
  mime: n.mime,
  isDir: n.isDir,
  updatedAt: n.updatedAt,
});

/**
 * @description Mapea un nodo de dominio a un NodeLiteDTO.
 * @param n Nodo de dominio a mapear
 * @returns NodeLiteDTO mapeado
 */
export const toNodeLiteDTO = (n: NodeLitePicked): NodeLiteDTO => ({
  id: n.id,
  parentId: n.parentId,
  rootId: n.rootId,
  name: n.name,
  size: n.size.toString(), // Convertir bigint a string por temas de incompatibilidad con JSON
  mime: n.mime,
  isDir: n.isDir,
});
