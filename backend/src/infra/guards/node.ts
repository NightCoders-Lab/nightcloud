import type {
  DirectoryNode,
  DirectoryNodeLite,
  FileNode,
  FileNodeLite,
  FileNodeWithBlob,
} from "@/domain/nodes/node";

import { isBlob } from "./blob";

/**
 * @description TypeGuard que verifica si un nodo es un FileNode.
 * @param node Nodo a verificar
 * @returns true si el nodo es un FileNode, false en caso contrario
 */
export function isFileNode(node: unknown): node is FileNode {
  if (typeof node !== "object" || node === null) return false;
  const nodeRecord = node as Record<string, unknown>;
  return (
    typeof nodeRecord.id === "string" &&
    (typeof nodeRecord.parentId === "string" || nodeRecord.parentId === null) &&
    typeof nodeRecord.rootId === "string" &&
    typeof nodeRecord.blobId === "string" &&
    typeof nodeRecord.name === "string" &&
    typeof nodeRecord.size === "bigint" &&
    typeof nodeRecord.mime === "string" &&
    nodeRecord.mime !== "inode/directory" &&
    nodeRecord.isDir === false &&
    nodeRecord.createdAt instanceof Date &&
    nodeRecord.updatedAt instanceof Date
  );
}

/**
 * @description TypeGuard que verifica si un nodo es un FileNodeWithBlob.
 * @param node Nodo a verificar
 * @returns true si el nodo es un FileNodeWithBlob, false en caso contrario
 */
export function isFileNodeWithBlob(node: unknown): node is FileNodeWithBlob {
  if (!isFileNode(node)) return false;
  const nodeRecord = node as Record<keyof FileNodeWithBlob, unknown>;
  return (
    typeof nodeRecord.blob === "object" &&
    nodeRecord.blob !== null &&
    isBlob(nodeRecord.blob)
  );
}

/**
 * @description TypeGuard que verifica si un nodo es un DirectoryNode.
 * @param node Nodo a verificar
 * @returns true si el nodo es un DirectoryNode, false en caso contrario
 */
export function isDirectoryNode(node: unknown): node is DirectoryNode {
  if (typeof node !== "object" || node === null) return false;
  const nodeRecord = node as Record<string, unknown>;
  return (
    typeof nodeRecord.id === "string" &&
    (typeof nodeRecord.parentId === "string" || nodeRecord.parentId === null) &&
    typeof nodeRecord.rootId === "string" &&
    typeof nodeRecord.name === "string" &&
    typeof nodeRecord.size === "bigint" &&
    nodeRecord.mime === "inode/directory" &&
    nodeRecord.isDir === true &&
    nodeRecord.createdAt instanceof Date &&
    nodeRecord.updatedAt instanceof Date
  );
}

/**
 * @description TypeGuard que verifica si un nodo es un FileNodeLite.
 * @param node Nodo a verificar
 * @returns true si el nodo es un FileNodeLite, false en caso contrario
 */
export function isFileNodeLite(node: unknown): node is FileNodeLite {
  if (typeof node !== "object" || node === null) return false;
  const nodeRecord = node as Record<string, unknown>;
  return (
    typeof nodeRecord.id === "string" &&
    (typeof nodeRecord.parentId === "string" || nodeRecord.parentId === null) &&
    typeof nodeRecord.rootId === "string" &&
    typeof nodeRecord.blobId === "string" &&
    typeof nodeRecord.name === "string" &&
    typeof nodeRecord.size === "bigint" &&
    typeof nodeRecord.mime === "string" &&
    nodeRecord.mime !== "inode/directory" &&
    nodeRecord.isDir === false
  );
}

/**
 * @description TypeGuard que verifica si un nodo es un DirectoryNodeLite.
 * @param node Nodo a verificar
 * @returns true si el nodo es un DirectoryNodeLite, false en caso contrario
 */
export function isDirectoryNodeLite(node: unknown): node is DirectoryNodeLite {
  if (typeof node !== "object" || node === null) return false;
  const nodeRecord = node as Record<string, unknown>;
  return (
    typeof nodeRecord.id === "string" &&
    (typeof nodeRecord.parentId === "string" || nodeRecord.parentId === null) &&
    typeof nodeRecord.rootId === "string" &&
    typeof nodeRecord.name === "string" &&
    typeof nodeRecord.size === "bigint" &&
    nodeRecord.mime === "inode/directory" &&
    nodeRecord.isDir === true
  );
}
