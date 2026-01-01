import fs from "node:fs/promises";
import path from "node:path";
import { fsSize } from "systeminformation";

import type { Blob } from "@/domain/blobs/blob";
import type { CloudStorage } from "@/services/cloud/CloudStorage";
import { AppError, pathExists } from "@/utils";

/**
 * @description Implementación de almacenamiento en la nube local.
 */
export class LocalCloudStorage implements CloudStorage {
  /**
   * @description Ruta absoluta del directorio raiz y temporal de almacenamiento en la nube local.
   */
  private static cloudPath: string | null = null;
  private static tmpPath: string | null = null;

  /**
   * @description Asegura que el directorio raiz de almacenamiento en la nube local exista.
   * @returns Ruta absoluta del directorio raiz de almacenamiento en la nube local
   */
  async ensureRoot(): Promise<string> {
    // Si la ruta es null
    if (!LocalCloudStorage.cloudPath) {
      // Definir la ruta absoluta del directorio raiz
      LocalCloudStorage.cloudPath = path.resolve(
        process.cwd(),
        process.env.CLOUD_ROOT || "cloud",
      );
    }

    // Siempre crear el directorio si no existe
    await fs.mkdir(LocalCloudStorage.cloudPath, { recursive: true });

    // Si ya fue inicializada, retornar la ruta
    return LocalCloudStorage.cloudPath;
  }

  /**
   * @description Asegura que el directorio temporal de almacenamiento en la nube local exista.
   * @returns Ruta absoluta del directorio temporal de almacenamiento en la nube local
   */
  async ensureTmp(): Promise<string> {
    // Si la ruta es null
    if (!LocalCloudStorage.tmpPath) {
      // Definir la ruta absoluta del directorio temporal
      LocalCloudStorage.tmpPath = path.resolve(
        process.cwd(),
        process.env.CLOUD_TMP || ".tmp",
      );
    }

    // Siempre crear el directorio si no existe
    await fs.mkdir(LocalCloudStorage.tmpPath, { recursive: true });

    // Si ya fue inicializada, retornar la ruta
    return LocalCloudStorage.tmpPath;
  }

  /**
   * @description Obtiene estadísticas del disco donde se encuentra la nube local.
   * @returns Objeto con estadísticas del disco (total, usado, libre)
   */
  async getDiskStats() {
    const disks = await fsSize();
    const cloudRoot = await this.ensureRoot();

    const cloudDisk = disks
      .toSorted((a, b) => b.mount.length - a.mount.length)
      .find((disk) => cloudRoot.startsWith(disk.mount));

    if (!cloudDisk) {
      throw new AppError(
        "INTERNAL",
        "No se pudo determinar el disco de la nube local",
      );
    }

    return {
      totalDisk: cloudDisk.size,
      usedDisk: cloudDisk.used,
      freeDisk: cloudDisk.available,
    };
  }

  /**
   * @description Verifica si una ruta existe en el sistema de archivos.
   * @param path ruta a verificar
   * @returns boolean indica si la ruta existe o no
   */
  async exists(path: string): Promise<boolean> {
    return pathExists(path);
  }

  /**
   * @description Mueve un archivo de una ruta temporal a una ruta final.
   * @param tmpPath Ruta temporal del archivo
   * @param finalPath Ruta final del archivo
   */
  async move(tmpPath: string, finalPath: string): Promise<void> {
    // Asegurarse de que el directorio destino exista
    const destDir = path.dirname(finalPath);

    // Asegurar la existencia del directorio destino
    await fs.mkdir(destDir, { recursive: true });

    // Finalmente mover el archivo
    await fs.rename(tmpPath, finalPath);
  }

  /**
   * @description Copia un archivo de una ruta a otra.
   * @param srcPath Ruta fuente del archivo
   * @param destPath Ruta destino del archivo
   */
  async copy(srcPath: string, destPath: string): Promise<void> {
    // Asegurarse de que el directorio destino exista
    const destDir = path.dirname(destPath);

    // Asegurar la existencia del directorio destino
    await fs.mkdir(destDir, { recursive: true });

    // Finalmente copiar el archivo
    await fs.copyFile(srcPath, destPath);
  }

  async deleteDir(dirPath: string): Promise<void> {
    try {
      await fs.rmdir(dirPath);
    } catch (err) {
      console.log("Error al eliminar directorio local:", err);
    }
  }

  /**
   * @description Elimina un archivo local.
   * @param path Ruta completa del archivo a eliminar
   */
  async delete(path: string): Promise<void> {
    try {
      await fs.unlink(path);
    } catch (err) {
      // Si el archivo no existe, no hacer nada
      if ((err as NodeJS.ErrnoException).code === "ENOENT") {
        return;
      }
      console.log("Error al eliminar archivo local:", err);
    }
  }

  /**
   * @description Elimina archivos locales dados sus paths.
   * @param filePaths Array de rutas completas de los archivos a eliminar
   * @throws AppError si ocurre un error al eliminar alguno de los nodos
   */
  async deleteFiles(filePaths: string[]) {
    // Declare an array of promises for deleting nodes
    const deletePromises = filePaths.map(async (nodePath) => {
      return fs.unlink(nodePath);
    });

    // Execute all delete operations in parallel and collect results
    const results = await Promise.allSettled(deletePromises);

    const failedDeletions = results.flatMap((res, idx) =>
      res.status === "rejected"
        ? [
            {
              nodePath: filePaths[idx],
              reason: res.reason as NodeJS.ErrnoException,
            },
          ]
        : [],
    );

    if (failedDeletions.length > 0) {
      const errorMessages = failedDeletions
        .map((n) => `Node: ${n?.nodePath}, Error: ${n?.reason}`)
        .join(";\n");
      throw new AppError(
        "INTERNAL",
        `Error al eliminar los siguientes nodos:\n${errorMessages}`,
      );
    }
  }

  /**
   * @description Obtiene la ruta completa de un archivo en el almacenamiento en la nube local a partir de un blob o su storageKey.
   * @param input Blob o storageKey del cual obtener la ruta
   * @returns Ruta completa del archivo en el almacenamiento en la nube local
   */
  getFilePath(input: Blob | Blob["storageKey"]) {
    // Determinar el storageKey
    let storageKey: string;

    if (typeof input === "string") {
      // Si es un string, es el storageKey directamente
      storageKey = input;
    } else {
      // Si es un Blob, obtener el storageKey del blob
      storageKey = input.storageKey;
    }

    // Construir la ruta completa del archivo
    const cloudRoot = path.resolve(process.cwd(), `${process.env.CLOUD_ROOT}`);
    // Construimos la ruta con el root de la nube y el storageKey del blob
    // El storageKey ya seria algo como "a1/b1/hashdelcontenido"
    const filePath = path.resolve(cloudRoot, storageKey);

    // Asegurarse de que el archivo este dentro del directorio CLOUD_ROOT (vulnerabilidad de path traversal)
    if (!filePath.startsWith(cloudRoot + path.sep)) {
      throw new AppError("FILE_NOT_FOUND");
    }

    return filePath;
  }
}
