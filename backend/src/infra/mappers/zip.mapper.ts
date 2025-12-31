import type { FileNodeWithBlob } from "@/domain/nodes/node";
import { CloudStorageService } from "@/services/cloud/CloudStorage.service";
import { buildLocalStorageKeyFromHash } from "@/utils/blob/buildLocalStorageKeyFromHash";

import type { ZipEntryType } from "../download/zip-stream.types";
import { isFileNodeWithBlob } from "../guards/node";
import type { DescendantRowWithBlob } from "../prisma/types";

/**
 * @description Mapea un nodo a una entrada de zip.
 * @param node Nodo a mapear
 * @param relativePath Ruta relativa dentro del zip
 * @returns Entrada de zip correspondiente
 */
export function toZipEntry(
  node: FileNodeWithBlob | DescendantRowWithBlob,
  relativePath: string,
): ZipEntryType {
  return node.isDir
    ? {
        isDir: true,
        relativePath,
      }
    : {
        isDir: false,
        relativePath,
        physicalPath: isFileNodeWithBlob(node)
          ? CloudStorageService.getFilePath(node.blob)
          : CloudStorageService.getFilePath(
              buildLocalStorageKeyFromHash(node.blobHash!), // storageKey construido desde el hash
            ),
      };
}
