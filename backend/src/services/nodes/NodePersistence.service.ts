import path from "node:path";

import type { Blob } from "@/domain/blobs/blob";
import { getNextNameWithIndex } from "@/domain/nodes/conflicts/getNextName";
import type { Node } from "@/domain/nodes/node";
import type { UploadedFile } from "@/domain/uploads/uploaded-file";
import { fromPrismaNode } from "@/infra/mappers/node.mapper";
import { NodeRepository } from "@/repositories/NodeRepository";
import type { PrismaTxClient } from "@/types/prisma";
import type { PendingMoves } from "@/types/upload";
import { AppError } from "@/utils";
import { isPrismaUniqueError } from "@/utils/prisma";

import { NodeIdentityService } from "./NodeIdentity.service";
import { CloudStorageService } from "../cloud/CloudStorage.service";

// Parámetros para persistir un nodo
type PersistNodeParams = {
  tx: PrismaTxClient;
  file: UploadedFile;
  blob: Blob;
  rootId: Node["rootId"];
  parentId: Node["parentId"];
  pendingMoves: PendingMoves[];
  initialNodeName: string;
};

type CreateNodeAndRegisterMoveParams = {
  tx: PrismaTxClient;
  file: UploadedFile;
  blob: Blob;
  rootId: Node["rootId"];
  parentId: Node["parentId"];
  nodeName: string;
  pendingMoves: PendingMoves[];
};

/**
 * @description Servicio para persistir nodos en el almacenamiento y la base de datos.
 */
export class NodePersistenceService {
  private static get cloud() {
    return CloudStorageService;
  }
  private static get identity() {
    return NodeIdentityService;
  }
  private static get nodeRepo() {
    return NodeRepository;
  }

  /**
   * @description Persiste un nodo dentro de una transacción, manejando conflictos de unicidad.
   * @param param0 Parámetros para persistir el nodo
   * @returns Nodo persistido
   */
  static async persistTx({
    tx,
    file,
    blob,
    rootId,
    parentId,
    pendingMoves,
    initialNodeName,
  }: PersistNodeParams): Promise<Node> {
    let attempt = 0; // Contador de intentos para nombres/hashes únicos
    let maxAttempts = 50; // Número máximo de intentos permitidos
    // Nombre del nodo que se intentará crear
    let nodeName = initialNodeName;

    // Intentamos crear el nodo, manejando posibles conflictos de unicidad
    while (true) {
      try {
        return await this.createNodeAndRegisterMove({
          tx,
          file,
          blob,
          rootId,
          parentId,
          nodeName,
          pendingMoves,
        });
      } catch (err) {
        if (!isPrismaUniqueError(err)) throw err;

        // Verificamos si ya existe un nodo con el mismo nombre y blob (idempotencia)
        const existingNode = await this.checkIdempotency(
          tx,
          parentId,
          nodeName,
          blob.hash,
        );

        // Si encontramos un nodo existente con el mismo blob, retornamos ese nodo (idempotencia)
        if (existingNode) {
          return existingNode;
        }

        // Si hay un error de unicidad, incrementamos el intento y cambiamos el nombre
        attempt++;
        if (attempt >= maxAttempts) {
          throw new AppError("INTERNAL", "No se pudo subir el archivo");
        }

        // Calculamos un nuevo nombre para el nodo
        nodeName = await this.calculateNextName(
          tx,
          file,
          parentId,
          nodeName,
          initialNodeName,
        );
      }
    }
  }

  /**
   * @description Crea un nodo en la base de datos y registra el movimiento pendiente del archivo.
   * @param param0 Parámetros para crear el nodo y registrar el movimiento
   * @returns Nodo creado
   */
  private static async createNodeAndRegisterMove({
    tx,
    file,
    blob,
    rootId,
    parentId,
    nodeName,
    pendingMoves,
  }: CreateNodeAndRegisterMoveParams): Promise<Node> {
    const node = await this.nodeRepo.createTx(tx, {
      parent: parentId ? { connect: { id: parentId } } : undefined,
      rootId,
      blob: { connect: { id: blob.id } },
      name: nodeName,
      size: BigInt(file.size),
      mime: file.mimetype,
      isDir: false,
    });

    // Obtener la ruta raíz del almacenamiento en la nube
    const cloudRoot = await this.cloud.getCloudRootPath();

    // Registrar el movimiento pendiente del archivo
    pendingMoves.push({
      tmpPath: file.path,
      finalPath: path.resolve(cloudRoot, blob.storageKey),
    });

    return node;
  }

  /**
   * @description Verifica si ya existe un nodo con el mismo nombre y blob para garantizar idempotencia.
   * @param tx Transacción Prisma
   * @param parentId ID del nodo padre
   * @param nodeName Nombre del nodo
   * @param blobHash Hash del blob
   * @returns Nodo existente o null si no existe
   */
  private static async checkIdempotency(
    tx: PrismaTxClient,
    parentId: Node["parentId"],
    nodeName: string,
    blobHash: string,
  ): Promise<Node | null> {
    // Verificamos si el nodo existente tiene el mismo blob (evitar duplicados a nivel de nodos)
    const existingNode = await tx.node.findUnique({
      where: {
        parentId_name: {
          parentId: parentId!, // parentId siempre existira
          name: nodeName,
        },
      },
      include: { blob: true }, // Necesitamos ver su Blob
    });

    // Si el nodo existente tiene el mismo blob, lo retornamos directamente
    if (
      existingNode &&
      !existingNode.isDir &&
      existingNode.blob?.hash === blobHash
    ) {
      return fromPrismaNode(existingNode);
    }

    return null;
  }

  /**
   * @description Calcula el siguiente nombre disponible para un nodo en caso de conflicto.
   * @param tx Transacción Prisma
   * @param file Archivo subido
   * @param parentId ID del nodo padre
   * @param currentName Nombre actual del nodo
   * @param initialName Nombre inicial propuesto para el nodo
   * @returns Nuevo nombre calculado
   */
  private static async calculateNextName(
    tx: PrismaTxClient,
    file: UploadedFile,
    parentId: Node["parentId"],
    currentName: string,
    initialName: string,
  ): Promise<string> {
    // Generar un nuevo nombre de nodo
    // Si el nombre no ha cambiado desde el inicial, resolvemos un nuevo nombre base
    if (currentName === initialName) {
      // Re-resolver el nombre base usando la estrategia de identidad (Solo en el primer conflicto)
      const resolvedName = await this.identity.resolveNameTx(
        tx,
        file,
        parentId,
      );

      // Si el nombre resuelto es igual al inicial (raro en vd), aplicamos el índice (sumarle +1)
      return resolvedName === initialName
        ? getNextNameWithIndex(currentName)
        : resolvedName;
    }

    // Si el nombre ya había cambiado, simplemente aplicamos el índice
    // ej: "archivo (1).txt" -> "archivo (2).txt"
    return getNextNameWithIndex(currentName);
  }
}
