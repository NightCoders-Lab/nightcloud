import path from "node:path";

import { getNextNameWithIndex } from "@/domain/nodes/conflicts/getNextName";
import type { Node } from "@/domain/nodes/node";
import type { UploadedFile } from "@/domain/uploads/uploaded-file";
import { BlobRepository } from "@/repositories/BlobRepository";
import { NodeRepository } from "@/repositories/NodeRepository";
import type { PrismaTxClient } from "@/types/prisma";
import type { PendingMoves } from "@/types/upload";
import { AppError } from "@/utils";
import { isPrismaUniqueError } from "@/utils/prisma";

import { CloudStorageService } from "../cloud/CloudStorage.service";

/**
 * @description Servicio para persistir nodos en el almacenamiento y la base de datos.
 */
export class NodePersistenceService {
  private static get cloud() {
    return CloudStorageService;
  }
  private static get nodeRepo() {
    return NodeRepository;
  }
  private static get blobRepo() {
    return BlobRepository;
  }

  /**
   * @description Persiste un nodo de archivo en la base de datos y programa su movimiento en el almacenamiento.
   * @param tx Transacción Prisma
   * @param file Archivo subido
   * @param rootId ID del nodo raíz
   * @param parentId ID del nodo padre
   * @param pendingMoves Arreglo para registrar movimientos pendientes de archivos
   * @param blobIdentifiers Identificadores del blob (hash y storageKey)
   * @param initialNodeName Nombre inicial propuesto para el nodo
   * @returns Nodo creado
   */
  static async persistTx(
    tx: PrismaTxClient,
    file: UploadedFile,
    rootId: Node["rootId"],
    parentId: Node["parentId"],
    pendingMoves: PendingMoves[],
    blobIdentifiers: { blobHash: string; storageKey: string },
    initialNodeName: string,
  ) {
    let attempt = 0; // Contador de intentos para nombres/hashes únicos
    let maxAttempts = 50; // Número máximo de intentos permitidos
    let nodeName = initialNodeName;

    // Primero aseguramos el blob en la base de datos
    const blob = await this.blobRepo.upsertTx(tx, {
      hash: blobIdentifiers.blobHash,
      size: BigInt(file.size),
      mime: file.mimetype,
      storageKey: blobIdentifiers.storageKey,
    });

    // Intentamos crear el nodo, manejando posibles conflictos de unicidad
    while (true) {
      try {
        const node = await this.nodeRepo.createTx(tx, {
          parent: parentId ? { connect: { id: parentId } } : undefined,
          rootId,
          blob: { connect: { id: blob.id } },
          name: nodeName,
          size: BigInt(file.size),
          mime: file.mimetype,
          isDir: false,
        });

        // Una vez creado el nodo en la base de datos, marcamos el archivo para moverlo luego
        pendingMoves.push({
          tmpPath: file.path,
          finalPath: path.resolve(
            await this.cloud.getCloudRootPath(),
            blob.storageKey,
          ),
        });

        return node;
      } catch (err) {
        if (!isPrismaUniqueError(err)) throw err;

        attempt++;
        if (attempt >= maxAttempts) {
          throw new AppError("INTERNAL", "No se pudo subir el archivo");
        }

        // Generar un nuevo nombre y hash únicos

        nodeName = getNextNameWithIndex(nodeName);
      }
    }
  }
}
