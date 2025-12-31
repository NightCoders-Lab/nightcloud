import type { Blob } from "@/domain/blobs/blob";

import type {
  FileNode,
  DirectoryNode,
  FileNodeLite,
  DirectoryNodeLite,
  CreateFileNodeParams,
  CreateDirectoryNodeParams,
  CreateFileNodeLiteParams,
  CreateDirectoryNodeLiteParams,
  FileNodeWithBlob,
} from "./node";

// Factory para crear nodos de archivo y directorio

/**
 * @description Crea un nodo de archivo
 * @param param0 Parámetros para crear el nodo de archivo
 * @returns Nodo de archivo
 */
export function createFileNode({
  id,
  parentId,
  rootId,
  blobId,
  name,
  size,
  mime,
  createdAt,
  updatedAt,
}: CreateFileNodeParams): FileNode {
  return {
    id,
    parentId,
    rootId,
    blobId,
    name,
    isDir: false,
    size,
    mime,
    createdAt,
    updatedAt,
  };
}

/**
 * @description Crea un nodo de archivo con su blob asociado
 * @param param0 Parámetros para crear el nodo de archivo junto con el blob
 * @returns Nodo de archivo con blob
 */
export function createFileNodeWithBlob({
  id,
  parentId,
  rootId,
  blob,
  name,
  size,
  mime,
  createdAt,
  updatedAt,
}: CreateFileNodeParams & { blob: Blob }): FileNodeWithBlob {
  return {
    id,
    parentId,
    rootId,
    blobId: blob.id,
    name,
    isDir: false,
    size,
    mime,
    createdAt,
    updatedAt,
    blob,
  };
}

/**
 * @description Crea un nodo de directorio
 * @param param0 Parámetros para crear el nodo de directorio
 * @returns Nodo de directorio
 */
export function createDirectoryNode({
  id,
  parentId,
  rootId,
  name,
  size,
  createdAt,
  updatedAt,
}: CreateDirectoryNodeParams): DirectoryNode {
  return {
    id,
    parentId,
    rootId,
    blobId: null,
    name,
    isDir: true,
    size,
    mime: "inode/directory",
    createdAt,
    updatedAt,
  };
}

/**
 * @description Crea un nodo de archivo ligero
 * @param param0 Parámetros para crear el nodo de archivo ligero
 * @returns Nodo de archivo ligero
 */
export function createFileNodeLite({
  id,
  parentId,
  rootId,
  blobId,
  name,
  size,
  mime,
}: CreateFileNodeLiteParams): FileNodeLite {
  return {
    id,
    parentId,
    rootId,
    blobId,
    name,
    isDir: false,
    size,
    mime,
  };
}

/**
 * @description Crea un nodo de directorio ligero
 * @param param0 Parámetros para crear el nodo de directorio ligero
 * @returns Nodo de directorio ligero
 */
export function createDirectoryNodeLite({
  id,
  parentId,
  rootId,
  name,
  size,
}: CreateDirectoryNodeLiteParams): DirectoryNodeLite {
  return {
    id,
    parentId,
    rootId,
    blobId: null,
    name,
    isDir: true,
    size,
    mime: "inode/directory",
  };
}
