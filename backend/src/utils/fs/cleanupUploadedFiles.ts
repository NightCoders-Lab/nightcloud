import { CloudStorageService } from "@/services/cloud/CloudStorage.service";

/**
 * @description Elimina los archivos subidos del sistema de almacenamiento en la nube
 * @param files Archivos subidos
 * @returns Void
 */
export async function cleanupUploadedFiles(
  files: Express.Multer.File[] | undefined,
) {
  if (!files || files.length === 0) return;

  await CloudStorageService.deleteFiles(files.map((f) => f.path));
}
