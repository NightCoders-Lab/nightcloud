import path from "node:path";

import { getNextNameWithIndex } from "@/domain/nodes/conflicts/getNextName";
import { computeNodeIdentity } from "@/domain/nodes/identity/computeNodeIdentity";
import type { UploadedFile } from "@/domain/uploads/uploaded-file";
import { NodeRepository } from "@/repositories/NodeRepository";
import type { PrismaTxClient } from "@/types/prisma";
import type { PendingMoves } from "@/types/upload";
import { AppError, NodeUtils } from "@/utils";
import { isPrismaUniqueError } from "@/utils/prisma";

import { NodeIdentityService } from "./NodeIdentity.service";
import { CloudStorageService } from "../cloud/CloudStorage.service";

/**
 * @description Servicio para persistir nodos en el almacenamiento y la base de datos.
 */
export class NodePersistenceService {
  private static readonly cloud = CloudStorageService;
  private static readonly repo = NodeRepository;
  private static readonly identity = NodeIdentityService;

  static async persistTx(
    tx: PrismaTxClient,
    file: UploadedFile,
    parentId: string | null,
    pendingMoves: PendingMoves[],
    initialNodeName: string,
    initialNodeHash: string,
  ) {
    let attempt = 0; // Contador de intentos para nombres/hashes únicos
    let maxAttempts = 50; // Número máximo de intentos permitidos
    let nodeName = initialNodeName;
    let nodeHash = initialNodeHash;

    while (true) {
      try {
        const node = await this.repo.createTx(tx, {
          parent: parentId ? { connect: { id: parentId } } : undefined,
          name: nodeName,
          hash: nodeHash,
          size: file.size,
          mime: file.mimetype,
          isDir: false,
        });

        // Una vez creado el nodo en la base de datos, marcamos el archivo para moverlo luego
        pendingMoves.push({
          tmpPath: file.path,
          finalPath: path.resolve(
            await this.cloud.getCloudRootPath(),
            nodeHash,
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
        nodeHash = await NodeUtils.genFileHash(
          file.path,
          computeNodeIdentity(nodeName, parentId).identityName,
        );
      }
    }
  }
}
