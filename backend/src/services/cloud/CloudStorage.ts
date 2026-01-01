import type { Blob } from "@/domain/blobs/blob";

/**
 * @description Interfaz para el almacenamiento en la nube.
 */
export interface CloudStorage {
  /**
   * @description Asegura que el directorio raiz de almacenamiento en la nube exista.
   */
  ensureRoot(): Promise<string>;

  /**
   * @description Asegura que el directorio temporal de almacenamiento en la nube exista.
   */
  ensureTmp(): Promise<string>;

  /**
   * @description Verifica si una ruta existe en el sistema de archivos.
   * @param filePaths Array de rutas completas de los archivos a eliminar
   */
  deleteFiles(filePaths: string[]): Promise<void>;

  /**
   * @description Verifica si una ruta existe en el sistema de archivos.
   * @param file ruta a verificar
   */
  getFilePath(file: Blob | Blob["storageKey"]): string;
}
