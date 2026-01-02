import type { UploadedFile } from "@/domain/uploads/uploaded-file";

/**
 * @description Convierte un archivo de Multer a un UploadedFile
 * @param file Archivo de Multer
 * @returns UploadedFile
 */
export function fromMulterFile(file: Express.Multer.File): UploadedFile {
  return {
    path: file.path,
    filename: file.filename,
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: BigInt(file.size),
  };
}
