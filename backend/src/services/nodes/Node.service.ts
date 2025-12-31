import { DB } from "@/config/db";
import type {
  DirectoryNode,
  FileNode,
  FileNodeWithBlob,
  Node,
  NodeLite,
} from "@/domain/nodes/node";
import type { UploadedFile } from "@/domain/uploads/uploaded-file";
import { isDirectoryNode, isDirectoryNodeLite } from "@/infra/guards/node";
import type { Prisma } from "@/infra/prisma/generated/client";
import type { AncestorRow, DescendantRow } from "@/infra/prisma/types";
import { NodeRepository } from "@/repositories/NodeRepository";
import type { PrismaTxClient } from "@/types/prisma";
import type { PendingMoves, UploadManifestEntry } from "@/types/upload";
import { AppError, BlobUtils, NodeUtils } from "@/utils";
import { withDeadlockRetry } from "@/utils/prisma";

import { NodeIdentityService } from "./NodeIdentity.service";
import { NodePersistenceService } from "./NodePersistence.service";
import { NodeTreeService } from "./NodeTree.service";
import { CloudStorageService } from "../cloud/CloudStorage.service";

/**
 * @description Servicio para gestionar nodos (archivos y directorios).
 */
export class NodeService {
  private static get persistence() {
    return NodePersistenceService;
  }
  private static get cloud() {
    return CloudStorageService;
  }
  private static get identity() {
    return NodeIdentityService;
  }
  private static get repo() {
    return NodeRepository;
  }
  private static get prisma() {
    return DB.getClient();
  }

  /**
   * @description Procesa múltiples archivos subidos, persistiendo sus nodos y manejando movimientos en el almacenamiento.
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
    // Array para almacenar los nodos procesados
    let finalResults: Node[] = [];
    // Array para almacenar las operaciones finales de movimiento pendientes que se haran despues de procesar
    let finalPendingMoves: PendingMoves[] = [];

    await withDeadlockRetry(async () => {
      // Array para almacenar las operaciones de movimiento pendientes de este intento
      // Si este intento entra en deadlock no llegara al final y no se usaran estos movimientos
      const attemptMoves: PendingMoves[] = [];
      // Lo mismo con el mapa de parentId para este intento
      const attemptFileParentMap = manifest
        ? await NodeTreeService.buildDirectoryTreeFromManifest(
            manifest,
            rootId,
            nodeParentId,
          )
        : null;
      // Lo mismo tmb para los resultados de este intento
      const attemptResults: Node[] = [];
      // Mapa para almacenar las actualizaciones de tamaño por cada nodo padre
      const sizeUpdates = new Map<string, bigint>();

      // Procesar cada archivo subido
      for (let i = 0; i < uploadedFiles.length; i++) {
        if (isAborted()) throw new AppError("UPLOAD_ABORTED");

        // Obtener el archivo y la entrada del manifiesto correspondiente (si existe)
        const file = uploadedFiles[i];
        const manifestEntry = manifest?.[i] ?? null;

        // Si hay manifiesto, debe haber una entrada correspondiente
        // segun lo programado en el frontend seria raro que no haya,
        // asi que lanzamos error por si acaso
        if (manifest && !manifestEntry) {
          throw new AppError("MANIFEST_MISMATCH_ERROR");
        }

        // Determinar el parentId correcto para este archivo
        const fileParentId = manifestEntry
          ? attemptFileParentMap!.get(manifestEntry.path)!
          : nodeParentId;

        // Procesar el archivo dentro de una transacción
        const node = await this.prisma.$transaction(async (tx) => {
          return await this.processTx(
            tx,
            file,
            rootId,
            fileParentId,
            attemptMoves,
          );
        });

        // Acumular la actualización de tamaño para el padre
        if (node.parentId) {
          const currentSize = sizeUpdates.get(node.parentId) || BigInt(0);
          sizeUpdates.set(node.parentId, currentSize + BigInt(file.size));
        }

        // Agregar el nodo procesado a los resultados de este intento
        attemptResults.push(node);
      }

      // Realizar las actualizaciones de tamaño acumuladas
      if (sizeUpdates.size > 0) {
        // Mediante una transacción iterar el mapa y actualizar los tamaños
        await this.prisma.$transaction(async (tx) => {
          for (const [pId, totalSize] of sizeUpdates) {
            await this.incrementNodeSizeByIdTx(tx, pId, totalSize);
          }
        });
      }

      // Si salió bien (0 deadlock), asignar los movimientos pendientes de este intento a los finales
      finalPendingMoves = attemptMoves;
      // Asignar los resultados de este intento a los finales
      finalResults = attemptResults;
    });

    // Realizar los movimientos de archivos pendientes
    for (const { tmpPath, finalPath } of finalPendingMoves) {
      if (!(await this.cloud.fileExists(tmpPath))) {
        continue;
      }

      // Si el archivo ya existe en la ubicación final, eliminar el temporal
      if (await this.cloud.fileExists(finalPath)) {
        await this.cloud.delete(tmpPath);
      } else {
        // Si no existe, mover el archivo desde la ubicación temporal a la final
        await this.cloud.move(tmpPath, finalPath);
      }
    }

    // Devolver los nodos procesados
    return finalResults;
  }

  /**
   * @description Procesa un solo archivo subido, resolviendo su identidad y persistiendo el nodo.
   * @param tx Transacción Prisma
   * @param file Archivo subido
   * @param rootId ID del nodo raíz
   * @param parentId ID del nodo padre
   * @param pendingMoves Arreglo para registrar movimientos pendientes de archivos
   * @returns Nodo procesado
   */
  static async processTx(
    tx: PrismaTxClient,
    file: UploadedFile,
    rootId: Node["rootId"],
    parentId: string,
    pendingMoves: PendingMoves[],
  ) {
    try {
      // Calcular el hash del blob y el key de almacenamiento
      const { blobHash, storageKey } = await BlobUtils.computeBlobIdentifiers(
        file.path,
      );
      // Generar un nombre de nodo único
      const nodeName = await this.identity.resolveNameTx(tx, file, parentId);

      console.log(`Processing node: ${nodeName}`);

      // Persistir el nodo en la base de datos
      const node = await this.persistence.persistTx(
        tx,
        file,
        rootId,
        parentId,
        pendingMoves,
        { blobHash, storageKey },
        nodeName,
      );

      console.log(`Node processed: ${nodeName}`);
      return node;
    } catch (err) {
      console.log(err);
      throw new AppError("INTERNAL", "Error al procesar el nodo");
    }
  }

  /**
   * @description Crea un nuevo nodo en la base de datos.
   * @param nodeData Datos del nodo a crear
   * @returns Nodo creado
   */
  static async createNode(nodeData: Prisma.NodeCreateInput): Promise<Node> {
    return await this.repo.create(nodeData);
  }

  // Sobrecargas para getNodeDetails
  static async getNodeDetails(
    nodeId: Node["id"],
    options?: { includeBlob?: false },
  ): Promise<Node>;
  static async getNodeDetails(
    nodeId: Node["id"],
    options: { includeBlob: true },
  ): Promise<FileNodeWithBlob | Node>;

  // Implementación de getNodeDetails
  /**
   * @description Obtiene los detalles de un nodo por su ID, con opción de incluir datos del blob.
   * @param nodeId ID del nodo a obtener
   * @param options Opciones para incluir datos del blob
   * @returns Nodo con sus detalles
   */
  static async getNodeDetails(
    nodeId: Node["id"],
    options?: { includeBlob?: boolean },
  ): Promise<Node | FileNodeWithBlob> {
    try {
      let details;

      // Determinar si se deben incluir los datos del blob
      if (options?.includeBlob === true) {
        details = await this.repo.findById(nodeId, { includeBlob: true });
      } else {
        details = await this.repo.findById(nodeId);
      }

      // Validación común para ambos casos
      if (!details) {
        throw new AppError("NODE_NOT_FOUND");
      }

      return details;
    } catch (err) {
      console.log(err);
      if (err instanceof AppError) throw err;
      else
        throw new AppError(
          "INTERNAL",
          `Error al obtener los detalles del nodo`,
        );
    }
  }

  // Sobrecargas para getNodeDetailsBulk
  static async getNodesDetailsBulk(
    nodeIds: Node["id"][],
    options: { includeBlob: true },
  ): Promise<(FileNodeWithBlob | Node)[]>;
  static async getNodesDetailsBulk(
    nodeIds: Node["id"][],
    options?: { includeBlob?: false },
  ): Promise<Node[]>;

  // Implementación de getNodeDetailsBulk
  /**
   * @description Obtiene los detalles de múltiples nodos por sus IDs.
   * @param nodeIds Array de IDs de los nodos a obtener
   * @returns Array de nodos con sus detalles
   */
  static async getNodesDetailsBulk(
    nodeIds: Node["id"][],
    options?: { includeBlob?: boolean },
  ): Promise<(Node | FileNodeWithBlob)[]> {
    try {
      let details;

      if (options?.includeBlob === true) {
        details = await this.repo.findManyByIds(nodeIds, { includeBlob: true });
      } else {
        details = await this.repo.findManyByIds(nodeIds);
      }

      return details;
    } catch (err) {
      if (err instanceof AppError) throw err;
      else
        throw new AppError(
          "INTERNAL",
          `Error al obtener los detalles de los nodos`,
        );
    }
  }

  /**
   * @description Obtiene el tamaño total de todos los nodos bajo una raíz específica.
   * @param rootId ID del nodo raíz
   * @returns Tamaño total de los nodos bajo la raíz
   */
  static async getRootSize(rootId: Node["rootId"]) {
    return await this.repo.sumNodesSize(rootId);
  }

  /**
   * @description Obtiene todos los ancestros de un nodo dado.
   * @param startNodeId ID del nodo desde el cual comenzar a buscar ancestros
   * @returns Array de ancestros del nodo
   */
  static async getNodeAncestors(
    startNodeId: Node["id"],
  ): Promise<AncestorRow[]> {
    return await this.repo.getAllNodeAncestors(startNodeId);
  }

  /**
   * @description Obtiene todos los descendientes de un nodo dado.
   * @param startNodeId ID del nodo desde el cual comenzar a buscar descendientes
   * @returns Array de descendientes del nodo
   */
  static async getNodeDescendants(
    startNodeId: Node["id"],
  ): Promise<DescendantRow[]> {
    return await this.repo.getAllNodeDescendants(startNodeId);
  }

  /**
   * @description Crea un directorio (nodo) nuevo.
   * @param rootId ID del nodo raíz
   * @param parentId ID del nodo padre
   * @param name Nombre del directorio (puede ser null para usar un nombre por defecto)
   * @returns Directorio creado (nodo) sin el hash
   */
  static async createDirectory(
    rootId: Node["rootId"],
    parentId: string,
    name: string | null,
  ): Promise<Omit<Node, "hash">> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        // Si no hay nombre, colocamos uno por defecto
        let finalName = name ?? "Untitled Folder";

        // Verificamos que no exista un directorio con el mismo nombre
        const existentNode = await this.repo.findDirByNameTx(
          tx,
          parentId,
          finalName,
        );

        // En caso de que exista un directorio, resolvemos el nombre
        if (existentNode) {
          finalName = await this.identity.resolveNameTx(
            tx,
            existentNode,
            parentId,
          );
        }

        // Preparamos los datos para crear el directorio
        const mime = "inode/directory";

        // Tratamos de crear el directorio (nodo al fin)

        if (parentId) {
          const node = await this.repo.createTx(tx, {
            name: finalName,
            parent: { connect: { id: parentId } },
            rootId,
            size: 0n,
            mime,
            isDir: true,
          });

          // Buscamos todos los ancestros y actualizamos su updatedAt
          const ancestors = await this.repo.getAllNodeAncestors(parentId);

          // Actualizamos el updatedAt de todos los ancestros
          await this.repo.touchUpdatedAtByIdsTx(
            tx,
            ancestors.map((a) => a.id),
          );

          // Si sale bien, devolvemos el directorio creado en el parentId correspondiente
          return node;
        }

        // Crear el directorio sin padre (raiz)
        const node = await this.repo.createTx(tx, {
          name: finalName,
          parent: { connect: { id: rootId } },
          rootId,
          size: 0n,
          mime,
          isDir: true,
        });

        // Si sale bien, devolvemos el directorio creado en el parentId correspondiente
        return node;
      });
    } catch (err) {
      console.error(err);
      throw new AppError("INTERNAL", "Error al crear el directorio (nodo)");
    }
  }

  /**
   * @description Renombra un nodo existente.
   * @param node Nodo a renombrar
   * @param newName Nuevo nombre para el nodo
   * @returns Nodo renombrado
   */
  static async renameNode(node: Node, newName: string) {
    // Asegurarse de que la extension del nodo se mantenga igual
    newName = NodeUtils.ensureNodeExt(newName, node);

    return await this.prisma.$transaction(async (tx) => {
      if (node.isDir) {
        return await this.repo.updateNameByIdTx(tx, node.id, newName);
      } else {
        // Resolver nombre y hash unicos
        const nodeName = await this.identity.resolveNameTx(
          tx,
          node,
          node.parentId,
          { newName },
        );

        // Actualizar el nodo en la base de datos
        return await this.repo.updateNameByIdTx(tx, node.id, nodeName);
      }
    });
  }

  /**
   * @description Obtiene todos los nodos bajo un nodo padre especifico.
   * @param id ID del nodo padre (null para la raiz)
   * @returns Array de nodos hijos
   */
  static async getAllNodes(id: string) {
    return await this.repo.findByParentId(id);
  }

  /**
   * @description Obtiene todos los nodos desde la raiz de un usuario.
   * @param rootId ID del nodo raíz del usuario
   * @returns Array de nodos desde la raíz
   */
  static async getAllNodesFromRoot(rootId: string) {
    return await this.repo.findAllFromRoot(rootId);
  }

  /**
   * @description Busca nodos por nombre bajo un nodo padre especifico.
   * @param nameQuery Nombre o parte del nombre a buscar
   * @param parentId ID del nodo padre donde buscar
   * @param limit Máximo número de resultados a retornar (default 20)
   * @returns Array de nodos que coinciden con la búsqueda
   */
  static async searchNodesByName(
    rootId: Node["rootId"],
    parentId: string,
    nameQuery: string,
    limit: number = 20,
  ) {
    return await this.repo.search(rootId, parentId, nameQuery, limit);
  }

  /**
   * @description Detecta conflictos de nombres para un nodo dado.
   * @param node Nodo a verificar
   * @param newName Nuevo nombre propuesto (opcional)
   * @param excludeSelf Indica si se debe excluir el nodo mismo en la verificación
   * @returns boolean Indicador de conflicto
   */
  static async detectConflict(
    node: Node,
    newName?: string,
    excludeSelf: boolean = false,
  ) {
    return await this.repo.findNameConflict(node, newName, excludeSelf);
  }

  /**
   * @description Copia un nodo (archivo o directorio) a una nueva ubicación.
   * @param node Nodo a copiar
   * @param parentId ID del nodo padre donde se ubicará la copia
   * @param newName Nuevo nombre propuesto para la copia (opcional)
   * @returns Nodo copiado o array de nodos copiados
   */
  static async copyNode(
    node: Node,
    parentId: string,
    newName?: string,
  ): Promise<NodeLite | NodeLite[]> {
    try {
      // Copiar el nuevo nodo de forma física y añadir un nueva fila a la base de datos
      if (isDirectoryNodeLite(node)) {
        return await NodeTreeService.copyNodeDir(node, parentId, {
          newName,
        });
      } else {
        return await NodeTreeService.attachNodeFile(node, parentId, newName);
      }
    } catch (err) {
      console.log(err);
      if (err instanceof AppError) {
        throw err;
      } else {
        throw new AppError("INTERNAL", "Error al copiar el nodo");
      }
    }
  }

  /**
   * @description Copia varios nodos (archivos y directorios) a una nueva ubicación.
   * @param nodes Nodos a copiar
   * @param parentId ID del nodo padre donde se ubicará las copias
   * @returns Nodos copiados
   */
  static async bulkCopyNodes(
    nodes: Node[],
    parentId: string,
  ): Promise<NodeLite[]> {
    try {
      const copiedNodes: NodeLite[] = [];
      const directories = nodes.filter((n) => n.isDir);
      const files = nodes.filter((n) => !n.isDir);

      if (directories.length > 0) {
        copiedNodes.push(
          ...(await NodeTreeService.bulkCopyNodeDirs(directories, parentId)),
        );
      }

      if (files.length > 0) {
        copiedNodes.push(
          ...(await NodeTreeService.bulkAttachNodeFiles(files, parentId)),
        );
      }

      return copiedNodes;
    } catch (err) {
      console.error(err);
      if (err instanceof AppError) throw err;
      else
        throw new AppError("INTERNAL", "No se pudieron copiar uno o más nodos");
    }
  }

  /**
   * @description Mueve un nodo (archivo o directorio) a una nueva ubicación.
   * @param node Nodo a mover
   * @param parentId ID del nodo padre donde se ubicará el nodo movido
   * @param newName Nuevo nombre propuesto para el nodo movido (opcional)
   * @returns Nodo movido
   */
  static async moveNode(node: Node, parentId: string, newName?: string) {
    if (
      (parentId === node.parentId && (!newName || newName === node.name)) ||
      parentId === node.id
    ) {
      throw new AppError(
        "BAD_REQUEST",
        `El ${node.isDir ? "directorio" : "archivo"} ya se encuentra en la ubicación destino`,
      );
    }

    try {
      if (isDirectoryNode(node)) {
        return await NodeTreeService.moveNodeDir(node, parentId, {
          newName,
        });
      } else {
        return await NodeTreeService.moveNodeFile(node, parentId, newName);
      }
    } catch (err) {
      console.log(err);
      if (err instanceof AppError) {
        throw err;
      } else {
        throw new AppError("INTERNAL", "Error al mover el nodo");
      }
    }
  }

  /**
   * @description Mueve varios nodos (archivos y directorios) a una nueva ubicación.
   * @param nodes Nodos a mover
   * @param parentId ID del nodo padre donde se ubicará los nodos movidos
   * @returns Nodos movidos
   */
  static async bulkMoveNodes(
    nodes: Node[],
    parentId: string,
  ): Promise<NodeLite[]> {
    try {
      const movedNodes: NodeLite[] = [];
      const directories = nodes.filter((n) => n.isDir);
      const files = nodes.filter((n) => !n.isDir);

      if (directories.length > 0) {
        movedNodes.push(
          ...(await NodeTreeService.bulkMoveNodeDirs(directories, parentId)),
        );
      }

      if (files.length > 0) {
        movedNodes.push(
          ...(await NodeTreeService.bulkMoveNodeFiles(files, parentId)),
        );
      }

      return movedNodes;
    } catch (err) {
      console.error(err);
      if (err instanceof AppError) throw err;
      else
        throw new AppError("INTERNAL", "No se pudieron mover uno o más nodos");
    }
  }

  /**
   * @description Elimina un nodo (archivo o directorio).
   * @param node Nodo a eliminar
   */
  static async deleteNode(node: Node) {
    // Prevenir la eliminación del nodo raíz
    if (node.id === node.rootId) {
      throw new AppError("DELETE_ROOT_NODE");
    }

    if (node.isDir) {
      await NodeService.deleteDirectory(node);
    } else {
      await NodeService.deleteFileNode(node);
    }
  }

  /**
   * @description Elimina un nodo.
   * @param node Nodo a eliminar
   */
  static async deleteFileNode(node: FileNode) {
    try {
      // Usar transacción para eliminar el nodo y actualizar tamaños
      await this.prisma.$transaction(async (tx) => {
        // Si tiene padre, actualizar el tamaño de todos los ancestros que haya
        if (node.parentId) {
          // Actualizar el tamaño de todos los ancestros
          await this.decrementNodeSizeByIdTx(tx, node.parentId, node.size);
        }

        // Eliminar el registro del nodo en la base de datos
        await this.repo.deleteByIdTx(tx, node.id);
      });
    } catch (err) {
      console.log(err);
      if (err instanceof AppError) throw err;
      else throw new AppError("INTERNAL", "Error al eliminar el nodo");
    }
  }

  /**
   * @description Elimina varios nodos.
   * @param nodes Nodos a eliminar
   * @returns Promise<void>
   */
  static async bulkDeleteFileNodes(nodes: FileNode[]) {
    try {
      return await this.prisma.$transaction(
        async (tx) => {
          for (const node of nodes) {
            // Si tiene padre, actualizar el tamaño de todos los ancestros que haya
            if (node.parentId) {
              const parent = await this.repo.findByIdTx(tx, node.parentId);

              if (parent) {
                // Actualizar el tamaño de todos los ancestros
                await this.decrementNodeSizeByIdTx(
                  tx,
                  node.parentId,
                  node.size,
                );
              }
            }

            // Eliminar el registro del nodo en la base de datos
            await this.repo.deleteByIdTx(tx, node.id);
          }
        },
        { maxWait: 5000, timeout: 60000 }, // 60 segundos de timeout por si hay muchos nodos
      );
    } catch (err) {
      if (err instanceof AppError) throw err;
      else throw new AppError("INTERNAL", "Error al eliminar los nodos");
    }
  }

  /**
   * @description Realiza un rollback de nodos creados y archivos subidos en caso de error.
   * @param createdNodes Nodos creados en la base de datos
   * @param uploadedFiles Archivos subidos al sistema de almacenamiento
   */
  static async rollback(createdNodes: Node[], uploadedFiles: UploadedFile[]) {
    try {
      // Eliminar los archivos creados en el sistema de nodos
      const deleteTmpPromises = uploadedFiles.map(async (f) => {
        await CloudStorageService.delete(f.path);
      });
      await Promise.all(deleteTmpPromises);

      if (createdNodes.length > 0) {
        const createdNodeIds = createdNodes.map((n) => n.id);
        await this.repo.deleteManyByIds(createdNodeIds);
      }
    } catch (err) {
      console.log(err);
      if (err instanceof AppError) throw err;
      else
        throw new AppError("INTERNAL", "Error al realizar rollback de nodos");
    }
  }

  /**
   * @description Elimina un nodo de tipo directorio y todos sus nodos descendientes.
   * @param node Nodo de tipo directorio a eliminar junto con todos sus descendientes.
   */
  static async deleteDirectory(node: DirectoryNode) {
    try {
      // Prevenir la eliminación del nodo raíz
      if (node.id === node.rootId) {
        throw new AppError("DELETE_ROOT_NODE");
      }

      // Obtenemos los descendientes de la carpeta (incluyéndola)
      const descendants = await this.repo.getAllNodeDescendants(node.id);

      // Si la carpeta está vacía (no contiene archivos ni subdirectorios).
      if (descendants.length == 1 && descendants[0].id === node.id) {
        await this.prisma.$transaction(async (tx) => {
          // Eliminar el registro del nodo en la base de datos
          await this.repo.deleteByIdTx(tx, node.id);
        });
        return;
      }

      // Usar transacción para actualizar los tamaños
      await this.prisma.$transaction(async (tx) => {
        // Si tiene padre, actualizar el tamaño del padre (propaga a ancestros)
        if (node.parentId) {
          // Actualizar el tamaño del padre (propaga a ancestros)
          await this.decrementNodeSizeByIdTx(tx, node.parentId, node.size);
        }

        // Eliminamos los archivos y carpetas de la base de datos
        await this.repo.deleteManyByIdsTx(
          tx,
          descendants.map((descendant) => descendant.id),
        );
      });
    } catch (err) {
      console.log(err);
      if (err instanceof AppError) throw err;
      else throw new AppError("INTERNAL", "Error al eliminar el nodo");
    }
  }

  /**
   * @description Elimina varios nodos de tipo directorio y todos sus nodos descendientes.
   * @param nodes Nodos de tipo directorio a eliminar junto con todos sus descendientes.
   */
  static async bulkDeleteDirectories(nodes: DirectoryNode[]) {
    try {
      // Fuera mas optimizado de otra forma pero esto iterando asi mantenemos la consistencia
      // Y evitamos problemas a futuro ya que el borrado es una accion muy destructiva
      // Es mejor tener control total sobre cada eliminacion

      // Iterar sobre todos los nodos a eliminar
      for (const node of nodes) {
        await this.deleteDirectory(node);
      }
    } catch (err) {
      if (err instanceof AppError) throw err;
      else throw new AppError("INTERNAL", "Error al eliminar los nodos");
    }
  }

  /**
   * @description Elimina varios nodos (archivos y directorios).
   * @param nodes Nodos a eliminar
   */
  static async bulkDeleteNodes(nodes: Node[]) {
    const fileNodes = nodes.filter((n) => !n.isDir);
    const dirNodes = nodes.filter((n) => n.isDir);

    // Verificar que no se esté intentando eliminar nodos raíz
    if (dirNodes.some((dir) => dir.id === dir.rootId)) {
      throw new AppError("DELETE_ROOT_NODE");
    }

    // Eliminar archivos primero
    if (fileNodes.length > 0) {
      await this.bulkDeleteFileNodes(fileNodes);
    }

    // Luego eliminar directorios
    if (dirNodes.length > 0) {
      await this.bulkDeleteDirectories(dirNodes);
    }
  }

  static async incrementNodeSizeById(
    nodeId: Node["id"],
    newSize: bigint,
  ): Promise<Node> {
    // Propagar el cambio de tamaño a los ancestros
    await this.repo.propagateSizeToAncestors(nodeId, newSize, "increment");

    // Retornamos el nodo actualizado, ya que sabemos que existe previamente le decimos a ts que no sera null
    return (await this.repo.findById(nodeId))!;
  }

  /**
   * @description Actualiza el tamaño de un nodo.
   * @param nodeId ID del nodo a actualizar
   * @param newSize Nuevo tamaño del nodo
   * @returns Nodo actualizado
   */
  static async incrementNodeSizeByIdTx(
    tx: PrismaTxClient,
    nodeId: Node["id"],
    newSize: bigint,
  ): Promise<Node> {
    // Propagar el cambio de tamaño a los ancestros
    await this.repo.propagateSizeToAncestorsTx(
      tx,
      nodeId,
      newSize,
      "increment",
    );

    // Retornamos el nodo actualizado, ya que sabemos que existe previamente le decimos a ts que no sera null
    return (await this.repo.findById(nodeId))!;
  }

  /**
   * @description Decrementa el tamaño de un nodo.
   * @param tx Transacción de Prisma
   * @param nodeId ID del nodo a actualizar
   * @param sizeToDecrement Tamaño a decrementar
   * @returns Nodo actualizado
   */
  static async decrementNodeSizeByIdTx(
    tx: PrismaTxClient,
    nodeId: Node["id"],
    sizeToDecrement: bigint,
  ): Promise<Node> {
    // Propagar el cambio de tamaño a los ancestros
    await this.repo.propagateSizeToAncestorsTx(
      tx,
      nodeId,
      sizeToDecrement,
      "decrement",
    );

    // Retornamos el nodo actualizado, ya que sabemos que existe previamente le decimos a ts que no sera null
    return (await this.repo.findByIdTx(tx, nodeId))!;
  }
}
