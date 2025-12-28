import path from "node:path";

import { buildConflictRegex } from "@/domain/nodes/conflicts/buildConflictRegex";
import { getNextName } from "@/domain/nodes/conflicts/getNextName";
import { computeNodeIdentity } from "@/domain/nodes/identity/computeNodeIdentity";
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
import { AppError, NodeUtils } from "@/utils";

import { CloudStorageService } from "../cloud/CloudStorage.service";

/**
 * @description Servicio para resolver identidades únicas de nodos.
 */
export class NodeIdentityService {
  private static readonly repo = NodeRepository;

  /**
   * @description Resuelve la identidad única de un directorio dentro de su carpeta padre, usando una transacción Prisma.
   * @param tx Transacción Prisma
   * @param node Nodo de directorio a resolver
   * @param parentId ID del nodo padre donde se ubicará el directorio
   * @param params Parámetros adicionales (como un nuevo nombre propuesto)
   * @returns Objeto con el nombre, hash y UUID resueltos
   */
  static async resolveNodeDirTx(
    tx: PrismaTxClient,
    node: DirectoryNode | DirectoryNodeLite,
    parentId: string | null,
    params: { newName?: string } = {},
  ) {
    try {
      // Nombre del nodo resuelto (inicialmente el original)
      let nodeName = params.newName ?? node.name;

      // Buscamos si ya existe un nodo con el mismo nombre en la carpeta destino
      const conflict = await this.repo.findByNameAndParentIdTx(
        tx,
        nodeName,
        parentId,
      );

      // Si no hay conflicto, retornamos el nombre, hash y UUID resueltos
      if (conflict) {
        // Obtenemos los nombres que ya existen y que generan conflicto
        const conflictingNames = await this.repo.findConflictingNamesTx(
          tx,
          parentId,
          buildConflictRegex(nodeName),
        );

        // Generamos un nuevo nombre unico en base a los nombres conflictivos
        nodeName = getNextName(nodeName, conflictingNames);
      }

      // Generamos el UUID y hash del nodo basado en su identidad unica
      const nodeUUID = crypto.randomUUID();
      const nodeHash = NodeUtils.genDirectoryHash(nodeUUID);

      return { nodeName, nodeHash, nodeUUID };
    } catch (err) {
      console.log("Error in resolveNodeDirTx:");
      console.log(err);
      throw new AppError("INTERNAL");
    }
  }

  /**
   * @description Resuelve la identidad única de un archivo dentro de su carpeta padre, usando una transacción Prisma.
   * @param tx Transacción Prisma
   * @param node Archivo subido o nodo de archivo a resolver
   * @param parentId ID del nodo padre donde se ubicará el archivo
   * @param params Parámetros adicionales (como un nuevo nombre propuesto)
   * @returns Objeto con el nombre y hash resueltos
   */
  static async resolveNodeFileTx(
    tx: PrismaTxClient,
    node: UploadedFile | FileNode | FileNodeLite,
    parentId: string | null,
    params: { newName?: string } = {},
  ) {
    try {
      // Ruta completa del nodo en el almacenamiento en la nube
      const nodePath = isUploadedFile(node)
        ? node.path
        : path.resolve(await CloudStorageService.getCloudRootPath(), node.hash);

      // Nombre del nodo resuelto (inicialmente el original)
      let nodeName = isUploadedFile(node)
        ? node.originalname
        : params.newName || node.name;

      // Buscamos si ya existe un nodo con el mismo hash en la carpeta destino
      const conflict = await this.repo.findByNameAndParentIdTx(
        tx,
        nodeName,
        parentId,
      );

      // Si no hay conflicto, retornamos el nombre y hash resueltos
      if (conflict) {
        // Obtenemos los nombres que ya existen y que generan conflicto
        const conflictingNames = await this.repo.findConflictingNamesTx(
          tx,
          parentId,
          buildConflictRegex(nodeName),
        );

        // Generamos un nuevo nombre unico en base a los nombres conflictivos
        nodeName = getNextName(nodeName, conflictingNames);

        // Actualizar el nombre en el nodo original
        if (isUploadedFile(node)) node.originalname = nodeName;
      }

      // Generamos el hash del nodo basado en su identidad unica
      const nodeHash = await NodeUtils.genFileHash(
        nodePath,
        computeNodeIdentity(nodeName, parentId).identityName,
      );

      return { nodeName, nodeHash };
    } catch (err) {
      console.log(err);
      throw new AppError("INTERNAL");
    }
  }

  /**
   * @description Resuelve un nombre único para un nodo dentro de su carpeta padre.
   * @param parentId ParentId del nodo a resolver
   * @param name Nombre original del nodo a resolver
   * @param newName Nuevo nombre propuesto (opcional)
   * @returns string Nombre único resuelto
   */
  static async resolveName(
    parentId: Node["parentId"],
    name: Node["name"],
    newName?: string,
  ): Promise<string> {
    const targetName = newName ?? name;
    const regexPattern = buildConflictRegex(targetName);

    const existingNames = await this.repo.findConflictingNames(
      parentId,
      regexPattern,
    );

    return getNextName(targetName, existingNames);
  }

  /**
   * @description Resuelve un nombre único para un nodo dentro de su carpeta
   * @param tx Transacción Prisma
   * @param parentId ParentId del nodo a resolver
   * @param name Nombre original del nodo a resolver
   * @param newName Nuevo nombre propuesto (opcional)
   * @returns string Nombre único resuelto
   */
  static async resolveNameTx(
    tx: PrismaTxClient,
    parentId: Node["parentId"],
    name: Node["name"],
    newName?: string,
  ): Promise<string> {
    const targetName = newName ?? name;
    const regexPattern = buildConflictRegex(targetName);

    const existingNames = await this.repo.findConflictingNamesTx(
      tx,
      parentId,
      regexPattern,
    );

    return getNextName(targetName, existingNames);
  }
}
