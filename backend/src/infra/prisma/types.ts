// Type que representa una fila en la tabla de ancestros de nodos (funcion get_ancestors SQL)
export type AncestorRow = {
  id: string;
  parentId: string | null;
  rootId: string; // Nuevo campo para identificar el nodo raíz del usuario
  blobId: string | null;
  name: string;
  size: bigint;
  mime: string;
  isDir: boolean;
  depth: number;
  startNodeId: string; // Nuevo campo para identificar el nodo desde el que se obtuvieron los ancestros
};

// Type que representa una fila en la tabla de descendientes de nodos (funcion get_descendants SQL)
export type DescendantRow = {
  id: string;
  parentId: string | null;
  rootId: string; // Nuevo campo para identificar el nodo raíz del usuario
  blobId: string | null;
  name: string;
  size: bigint;
  mime: string;
  isDir: boolean;
  depth: number;
  startNodeId: string; // Nuevo campo para identificar el nodo desde el que se obtuvieron los descendientes
};

// Type que representa una fila en la tabla de descendientes de nodos con datos de Blob (funcion get_descendants_with_blob SQL)
export type DescendantRowWithBlob = DescendantRow & {
  blobHash: string | null;
  storageKey: string | null;
  storageType: string | null;
  blobSize: bigint | null;
  blobCreatedAt: Date | null;
};

// Type que representa el resultado de una búsqueda de nodos por nombre
export type NodeSearchResult = {
  id: string;
  parentId: string | null;
  name: string;
  blobId: string | null;
  size: bigint;
  mime: string;
  isDir: boolean;
  updatedAt: Date;
};
