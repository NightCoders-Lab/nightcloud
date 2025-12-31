/**
 * @description Representa un blob de datos almacenado
 * @property id Identificador único del blob
 * @property hash Hash del contenido del blob
 * @property size Tamaño del blob en bytes
 * @property mime Tipo MIME del blob
 * @property storageKey Clave utilizada para almacenar el blob en el sistema de almacenamiento
 * @property storageType Tipo de sistema de almacenamiento utilizado (e.g., local, S3, etc.)
 * @property createdAt Fecha de creación del blob
 */
export interface Blob {
  id: string;
  hash: string;
  size: bigint;
  mime: string;
  storageKey: string;
  storageType: string;
  createdAt: Date;
}

export type CreateBlobParams = Pick<
  Blob,
  "id" | "hash" | "size" | "mime" | "storageKey" | "storageType" | "createdAt"
>;
