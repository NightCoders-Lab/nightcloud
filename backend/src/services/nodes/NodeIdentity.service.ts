import { buildConflictRegex } from "@/domain/nodes/conflicts/buildConflictRegex";
import { getNextName } from "@/domain/nodes/conflicts/getNextName";
import type {
  DirectoryNode,
  DirectoryNodeLite,
  FileNode,
  FileNodeLite,
  Node,
} from "@/domain/nodes/node";
import type { UploadedFile } from "@/domain/uploads/uploaded-file";
import { isUploadedFile } from "@/infra/guards/uploaded-file";
import { NodeRepository } from "@/repositories/NodeRepository";
import type { PrismaTxClient } from "@/types/prisma";
import { AppError } from "@/utils";

/**
 * @description Servicio para resolver identidades únicas de nodos.
 */
export class NodeIdentityService {
  private static get repo() {
    return NodeRepository;
  }

  /**
   * @description Resuelve el nombre de un nodo (archivo o directorio) dentro de su carpeta
   * @param tx Transacción Prisma
   * @param node Nodo a resolver (puede ser un archivo subido o un nodo existente)
   * @param parentId ID del nodo padre donde se ubicará el nodo
   * @param params Parámetros adicionales (como un nuevo nombre propuesto)
   * @returns string Nombre único resuelto
   */
  static async resolveNameTx(
    tx: PrismaTxClient,
    node:
      | UploadedFile
      | FileNode
      | FileNodeLite
      | DirectoryNode
      | DirectoryNodeLite,
    parentId: Node["parentId"],
    params: { newName?: string } = {},
  ) {
    try {
      // Nombre del nodo resuelto (inicialmente el original)
      const nodeName = isUploadedFile(node)
        ? node.originalname
        : params.newName || node.name;

      // Buscamos si ya existe un nodo con el mismo nombre en la carpeta destino
      const conflict = await this.repo.findByNameAndParentIdTx(
        tx,
        nodeName,
        parentId,
      );

      if (!conflict) {
        // No hay conflicto, retornamos el nombre original
        return nodeName;
      }

      // Primero construimos el patrón regex para detectar conflictos
      const regexpPattern = buildConflictRegex(nodeName);

      // Si hay conflicto, generamos un nuevo nombre único y actualizamos el nodo
      const conflictingNames = await this.repo.findConflictingNamesTx(
        tx,
        parentId,
        regexpPattern,
      );

      return getNextName(nodeName, conflictingNames);
    } catch (err) {
      console.log(err);
      throw new AppError("INTERNAL", "Error al resolver la identidad del nodo");
    }
  }
}
