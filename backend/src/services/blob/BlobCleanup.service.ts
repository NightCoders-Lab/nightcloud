import path from "node:path";

import type { Blob } from "@/domain/blobs/blob";
import { BlobRepository } from "@/repositories/BlobRepository";

import { CloudStorageService } from "../cloud/CloudStorage.service";

export class BlobCleanupService {
  private static get repo() {
    return BlobRepository;
  }
  private static get GRACE_PERIOD_MS() {
    return process.env.CLOUD_BLOB_ORPHANED_CLEANUP_GRACE_PERIOD_MS
      ? Number(process.env.CLOUD_BLOB_ORPHANED_CLEANUP_GRACE_PERIOD_MS)
      : 3600000; // 1 hora por defecto
  }
  private static readonly BATCH_SIZE = 100;

  /**
   * @description Ejecuta la limpieza de blobs no referenciados en la base de datos y el almacenamiento.
   * @returns Estadísticas de la limpieza realizada
   */
  static async runCleanup() {
    console.log(
      "[BlobCleanupService] Iniciando limpieza de blobs no referenciados...",
    );

    // Calcular la fecha límite considerando el período de gracia
    const cutOffDate = new Date(Date.now() - this.GRACE_PERIOD_MS);

    // Obtener blobs no referenciados y más antiguos que la fecha límite
    let deletedCount = 0;
    let errorCount = 0;

    while (true) {
      const orphanedBlobs = await this.repo.getOrphanedBlobs(
        cutOffDate,
        this.BATCH_SIZE,
      );

      if (orphanedBlobs.length === 0) {
        break; // Salir del bucle
      }

      for (const blob of orphanedBlobs) {
        try {
          await this.deleteBlobSafely(blob);
          console.log("[BlobCleanupService] Blob eliminado:", blob.id);
          deletedCount++;
        } catch (err) {
          console.log(
            "[BlobCleanupService] Error al eliminar blob:",
            blob.id,
            err,
          );
          errorCount++;
        }
      }
    }

    console.log(
      `[BlobCleanupService] Limpieza completada. Blobs eliminados: ${deletedCount}, Errores: ${errorCount}`,
    );
    return { deletedCount, errorCount };
  }

  /**
   * @description Elimina un blob de forma segura tanto del almacenamiento como de la base de datos.
   * @param blob Blob a eliminar
   */
  static async deleteBlobSafely(blob: Blob) {
    if (blob.storageType === "LOCAL") {
      try {
        // Obtener la ruta física del archivo
        const physicalPath = CloudStorageService.getFilePath(blob);

        // Eliminar el archivo del almacenamiento
        await CloudStorageService.delete(physicalPath);

        // Intentar limpiar las carpetas vacías asociadas
        await this.tryCleanEmptyDirs(physicalPath);
      } catch (err) {
        // Si el error no es de archivo no encontrado, relanzarlo por si acaso
        if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
      }
    } else if (blob.storageType === "S3") {
      // Implementar eliminación para S3 cuando sea el momento
    }

    // Eliminar el registro del blob en la base de datos
    await this.repo.deleteById(blob.id);
  }

  /**
   * @description Intenta limpiar las carpetas vacías asociadas a un archivo eliminado
   * @param filePath Ruta completa del archivo eliminado
   */
  private static async tryCleanEmptyDirs(filePath: string) {
    try {
      // Obtendria la ruta de la segunda carpeta Ejemplo: /cloud/a1/b2
      const dirB = path.dirname(filePath);
      // Obtendria la ruta de la primera carpeta Ejemplo: /cloud/a1
      const dirA = path.dirname(dirB);

      // Intentar eliminar la carpeta B
      await CloudStorageService.deleteDir(dirB);
      // Intentar eliminar la carpeta A
      await CloudStorageService.deleteDir(dirA);
    } catch (err) {
      // Ignoramos los errores en vd
      // Ya que esto es solo un intento de limpieza si estan vacios
      console.log(
        "[BlobCleanupService] No se pudo limpiar alguna carpeta vacía:",
        err,
      );
    }
  }
}
