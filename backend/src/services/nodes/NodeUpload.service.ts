import { DB } from "@/config/db";
import type { Node } from "@/domain/nodes/node";
import type { UploadedFile } from "@/domain/uploads/uploaded-file";
import { BlobRepository } from "@/repositories/BlobRepository";
import { NodeRepository } from "@/repositories/NodeRepository";
import type { PendingMoves, UploadManifestEntry } from "@/types/upload";
import { AppError, BlobUtils, pathExists } from "@/utils";
import { withDeadlockRetry } from "@/utils/prisma";

import { NodePersistenceService } from "./NodePersistence.service";
import { NodeTreeService } from "./NodeTree.service";
import { CloudStorageService } from "../cloud/CloudStorage.service";

export class NodeUploadService {
  private static get persistence() {
    return NodePersistenceService;
  }
  private static get cloud() {
    return CloudStorageService;
  }
  private static get prisma() {
    return DB.getClient();
  }
  private static get repo() {
    return NodeRepository;
  }
  private static get blobRepo() {
    return BlobRepository;
  }

  /**
   * @description Procesa una lista de archivos subidos, creando nodos y manejando movimientos físicos.
   * @param uploadedFiles Archivos subidos
   * @param rootId ID del nodo raíz
   * @param parentId ID del nodo padre
   * @param manifest Manifiesto de carga (opcional)
   * @param isAborted Función para verificar si la operación ha sido abortada
   * @returns Nodos procesados
   */
  static async processUploadedFiles(
    uploadedFiles: UploadedFile[],
    rootId: Node["rootId"],
    parentId: string,
    manifest: UploadManifestEntry[] | null,
    isAborted: () => boolean,
  ) {
    // Determinar el parentId final
    const nodeParentId = parentId || rootId;

    // Realizar la operación con reintentos en caso de deadlock
    const { finalResults, finalPendingMoves } = await withDeadlockRetry(
      async () => {
        return await this.executeBatchAttempt(
          uploadedFiles,
          rootId,
          nodeParentId,
          manifest,
          isAborted,
        );
      },
    );

    // Finalizar los movimientos físicos de los archivos en el almacenamiento
    await this.finalizePhysicalMoves(finalPendingMoves);

    // Retornar los resultados finales
    return finalResults;
  }

  /**
   * @description Ejecuta un intento de procesamiento de un lote de archivos subidos.
   * @param uploadedFiles Archivos subidos
   * @param rootId ID del nodo raíz
   * @param defaultParentId ID del nodo padre por defecto
   * @param manifest Manifiesto de carga (opcional)
   * @param isAborted Función para verificar si la operación ha sido abortada
   * @returns Resultados del intento y movimientos pendientes
   */
  private static async executeBatchAttempt(
    uploadedFiles: UploadedFile[],
    rootId: string,
    defaultParentId: string,
    manifest: UploadManifestEntry[] | null,
    isAborted: () => boolean,
  ) {
    // Array para almacenar las operaciones de movimiento pendientes de este intento
    const attemptMoves: PendingMoves[] = [];
    const attemptResults: Node[] = [];
    // Mapa para almacenar las actualizaciones de tamaño por cada nodo padre
    const sizeUpdates = new Map<string, bigint>();

    // Mapa con los nodos padres construidos desde el manifiesto
    const fileParentMap = manifest
      ? await NodeTreeService.buildDirectoryTreeFromManifest(
          manifest,
          rootId,
          defaultParentId,
        )
      : null;

    // Procesar cada archivo subido
    for (let i = 0; i < uploadedFiles.length; i++) {
      // Verificar si la operación ha sido abortada
      if (isAborted()) throw new AppError("UPLOAD_ABORTED");

      // Procesar el archivo individualmente
      const result = await this.processSingleFile({
        file: uploadedFiles[i],
        manifestEntry: manifest?.[i] ?? null,
        rootId,
        defaultParentId,
        fileParentMap,
        isAborted,
        attemptMoves,
        hasManifest: !!manifest,
      });

      // Si no hay resultado quiere decir q no existe, continuamos el bucle
      if (!result) continue;

      // Guardar entre uno de los posibles resultados para este intento
      attemptResults.push(result.node);

      // Acumular la actualización de tamaño por cada nodo padre si es un nodo creado
      if (result.isNew && result.node.parentId) {
        const current = sizeUpdates.get(result.node.parentId) || 0n;
        sizeUpdates.set(
          result.node.parentId,
          current + BigInt(result.fileSize),
        );
      }
    }

    // Aplicar las actualizaciones de tamaño en batch
    await this.applyBatchSizeUpdates(sizeUpdates);

    return { finalResults: attemptResults, finalPendingMoves: attemptMoves };
  }

  /**
   * @description Procesa un solo archivo subido, creando su nodo y manejando movimientos físicos.
   * @param ctx Contexto con parámetros necesarios para el procesamiento
   * @returns Nodo procesado y si es nuevo
   */
  private static async processSingleFile(ctx: {
    file: UploadedFile;
    manifestEntry: UploadManifestEntry | null;
    rootId: string;
    defaultParentId: string;
    fileParentMap: Map<string, string | null> | null;
    isAborted: () => boolean;
    attemptMoves: PendingMoves[];
    hasManifest: boolean;
  }) {
    const {
      file,
      manifestEntry,
      hasManifest,
      fileParentMap,
      defaultParentId,
      isAborted,
    } = ctx;

    // Validaciones iniciales

    // Verificar que el archivo exista en la ruta temporal
    if (!(await pathExists(file.path))) {
      if (isAborted()) throw new AppError("UPLOAD_ABORTED");
      console.warn(`File missing at ${file.path}, skipping...`);
      return null;
    }

    // Verificar que si hay manifiesto, exista una entrada correspondiente
    if (hasManifest && !manifestEntry) {
      throw new AppError("MANIFEST_MISMATCH_ERROR");
    }

    // Determinar el parentId correcto para este archivo
    const fileParentId = hasManifest
      ? fileParentMap!.get(manifestEntry!.path)!
      : defaultParentId;

    // Calcular el hash del blob y la key de almacenamiento
    const { blobHash, storageKey } = await BlobUtils.computeBlobIdentifiers(
      file.path,
    );

    // Asegurar el blob en la base de datos
    const blob = await this.blobRepo.ensureBlob({
      hash: blobHash,
      size: BigInt(file.size),
      mime: file.mimetype,
      storageKey,
    });

    // Procesar el archivo dentro de una transacción
    const { node, isNew } = await this.prisma.$transaction(async (tx) => {
      return await this.persistence.persistTx({
        tx,
        file,
        blob,
        rootId: ctx.rootId,
        parentId: fileParentId,
        pendingMoves: ctx.attemptMoves,
        initialNodeName: file.originalname,
      });
    });

    // Si el nodo no es nuevo, lo agregamos a los movimientos para eliminar el archivo temporal despues
    if (!isNew) {
      ctx.attemptMoves.push({
        tmpPath: file.path,
        finalPath: storageKey,
      });
    }

    return { node, isNew, fileSize: file.size };
  }

  /**
   * @description Aplica actualizaciones de tamaño en batch a los nodos padres.
   * @param sizeUpdates Mapa de IDs de nodos padres a incrementos de tamaño
   * @returns void
   */
  private static async applyBatchSizeUpdates(sizeUpdates: Map<string, bigint>) {
    // Si no hay actualizaciones de tamaño, salir temprano
    if (sizeUpdates.size === 0) return;

    // Esto asegura un orden consistente para evitar deadlocks
    const sortedParentIds = Array.from(sizeUpdates.keys()).sort((a, b) =>
      a.localeCompare(b),
    );

    await this.prisma.$transaction(async (tx) => {
      for (const pId of sortedParentIds) {
        const totalSize = sizeUpdates.get(pId)!;

        // Propagar el cambio de tamaño a los ancestros
        await this.repo.propagateSizeToAncestorsTx(
          tx,
          pId,
          totalSize,
          "increment",
        );
      }
    });
  }

  /**
   * @description Procesa los movimientos físicos de los archivos en el almacenamiento en la nube.
   * @param moves Array de movimientos pendientes
   * @returns void
   */
  private static async finalizePhysicalMoves(moves: PendingMoves[]) {
    for (const { tmpPath, finalPath } of moves) {
      // Verificar si el archivo temporal aún existe
      if (!(await this.cloud.fileExists(tmpPath))) continue;

      // Si el archivo ya existe en la ubicación final, eliminar el temporal
      if (await this.cloud.fileExists(finalPath)) {
        await this.cloud.delete(tmpPath);
      } else {
        // Si no existe, mover el archivo desde la ubicación temporal a la final
        await this.cloud.move(tmpPath, finalPath);
      }
    }
  }
}
