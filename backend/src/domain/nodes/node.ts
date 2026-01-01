// Base de un nodo, lo que siempre sera igual entre archivos y directorios

import type { Blob } from "@/domain/blobs/blob";

/**
 * @description Base común para nodos de archivo y directorio
 * @property id Identificador único del nodo
 * @property parentId Identificador del nodo padre, o null si es la raíz
 * @property rootId Identificador del nodo raíz del árbol al que pertenece
 * @property name Nombre del nodo (archivo o directorio)
 * @property isDir Indica si el nodo es un directorio (true) o un archivo (false)
 * @property size Tamaño del nodo en bytes
 * @property createdAt Fecha de creación del nodo
 * @property updatedAt Fecha de última actualización del nodo
 */
export interface NodeBase {
  id: string;
  parentId: string | null;
  rootId: string;
  name: string;
  isDir: boolean;
  size: bigint;
  createdAt: Date;
  updatedAt: Date;
}

// Nodo que representa un archivo
/**
 * @property blobId Identificador del blob asociado al archivo
 * @property isDir Siempre false para archivos
 * @property mime Tipo MIME del archivo
 */
export interface FileNode extends NodeBase {
  blobId: string;
  isDir: false;
  mime: string;
}

/**
 * @description Versión de FileNode que incluye el blob asociado
 */
export interface FileNodeWithBlob extends FileNode {
  blob: Blob;
}

/**
 * @description Versión ligera de FileNode para evitar importar metadatos timestamp
 */
export type FileNodeLite = Pick<
  FileNode,
  "id" | "parentId" | "rootId" | "blobId" | "name" | "size" | "mime" | "isDir"
>;

// Nodo que representa un directorio
/**
 * @property blobId Siempre null para directorios
 * @property isDir Siempre true para directorios
 * @property mime Siempre "inode/directory" para directorios
 */
export interface DirectoryNode extends NodeBase {
  blobId: null;
  isDir: true;
  mime: "inode/directory";
}

/**
 * @description Versión ligera de DirectoryNode para evitar importar metadatos timestamp
 */
export type DirectoryNodeLite = Pick<
  DirectoryNode,
  "id" | "parentId" | "rootId" | "blobId" | "name" | "size" | "mime" | "isDir"
>;

// Tipo union de nodo, puede ser archivo o directorio
export type Node = FileNode | DirectoryNode;
export type NodeLite = FileNodeLite | DirectoryNodeLite;

// Tipo para crear nodos

// Tipos para los parámetros de las funciones factory
export type CreateFileNodeParams = Pick<
  FileNode,
  | "id"
  | "parentId"
  | "rootId"
  | "blobId"
  | "name"
  | "size"
  | "mime"
  | "createdAt"
  | "updatedAt"
>;

// Tipos para los parámetros de las funciones factory
export type CreateDirectoryNodeParams = Pick<
  DirectoryNode,
  "id" | "parentId" | "rootId" | "name" | "size" | "createdAt" | "updatedAt"
>;

// Tipos para los parámetros de las funciones factory lite
export type CreateFileNodeLiteParams = Pick<
  FileNodeLite,
  "id" | "parentId" | "rootId" | "blobId" | "name" | "size" | "mime"
>;

// Tipos para los parámetros de las funciones factory lite
export type CreateDirectoryNodeLiteParams = Pick<
  DirectoryNodeLite,
  "id" | "parentId" | "rootId" | "name" | "size"
>;
