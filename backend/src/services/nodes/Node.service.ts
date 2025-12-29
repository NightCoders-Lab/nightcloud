import crypto from "node:crypto";

import { DB } from "@/config/db";
import type {
  DirectoryNode,
  FileNode,
  Node,
  NodeLite,
} from "@/domain/nodes/node";
import type { UploadedFile } from "@/domain/uploads/uploaded-file";
import { isDirectoryNode, isDirectoryNodeLite } from "@/infra/guards/node";
import type { Prisma } from "@/infra/prisma/generated/client";
import type { AncestorRow, DescendantRow } from "@/infra/prisma/types";
import { NodeRepository } from "@/repositories/NodeRepository";
import type { PrismaTxClient } from "@/types/prisma";
import type { UploadManifestEntry } from "@/types/upload";
import { AppError, NodeUtils } from "@/utils";

import { NodeIdentityService } from "./NodeIdentity.service";
import { NodePersistenceService } from "./NodePersistence.service";
import { NodeTreeService } from "./NodeTree.service";
import { CloudStorageService } from "../cloud/CloudStorage.service";

/**
 * @description Servicio para gestionar nodos (archivos y directorios).
 */
export class NodeService {
  private static readonly persistence = NodePersistenceService;
  private static readonly cloud = CloudStorageService;
  private static readonly identity = NodeIdentityService;
  private static readonly repo = NodeRepository;
  private static readonly prisma = DB.getClient();

  /**
   * @description Procesa un archivo subido, resolviendo su identidad y persistiendo el nodo.
   * @param tx PrismaTxClient
   * @param file UploadedFile
   * @param parentId ID del nodo padre donde se ubicará el nodo
   * @returns Nodo procesado
   */
  static async processTx(
    tx: PrismaTxClient,
    file: UploadedFile,
    parentId: Node["id"] | null,
  ) {
    try {
      // Resolver nombre y hash unicos - SI se dan condiciones de carrera,
      // persistTx no confiara en este resultado y iterara para conseguir uno unico
      const { nodeName, nodeHash } = await this.identity.resolveNodeFileTx(
        tx,
        file,
        parentId,
      );

      console.log(`Processing node: ${nodeName}`);

      // Persistir el nodo en la base de datos
      const node = await this.persistence.persistTx(
        tx,
        file,
        parentId,
        nodeName,
        nodeHash,
      );

      console.log(`Node processed: ${nodeName} as ${nodeHash}`);
      return node;
    } catch (err) {
      console.log(err);
      throw new AppError("INTERNAL", "Error al procesar el nodo");
    }
  }

  /**
   * @description Procesa un archivo subido usando una entrada de manifiesto para la ruta.
   * @param tx PrismaTxClient
   * @param file UploadedFile
   * @param parentId ID del nodo padre donde se ubicará el nodo
   * @param manifestEntry Entrada del manifiesto para el archivo
   * @param dirCache Cache de directorios ya procesados
   * @returns Nodo procesado
   */
  static async processWithManifestTx(
    tx: PrismaTxClient,
    file: UploadedFile,
    parentId: string | null,
    manifestEntry: UploadManifestEntry,
    dirCache: Map<string, Node>,
  ) {
    try {
      // Asegurar que la ruta de directorios del manifiesto exista - AHORA SAFE CONCURRENCY
      const newParentId = await NodeTreeService.ensureManifestPathTree(
        tx,
        parentId,
        manifestEntry,
        dirCache,
      );

      // Resolver nombre y hash unicos para el archivo
      const { nodeName, nodeHash } = await this.identity.resolveNodeFileTx(
        tx,
        file,
        newParentId,
      );

      console.log(`Processing node: ${nodeName}`);

      // Persistir el nodo en la base de datos
      const node = await this.persistence.persistTx(
        tx,
        file,
        newParentId,
        nodeName,
        nodeHash,
      );

      console.log(`Node processed: ${nodeName} as ${nodeHash}`);
      return node;
    } catch (err) {
      console.error(err);
      await this.cloud.delete(file.path); // Limpiar archivo temporal en caso de error
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

  /**
   * @description Obtiene los detalles de un nodo por su ID.
   * @param nodeId ID del nodo a obtener
   * @returns Nodo con sus detalles
   */
  static async getNodeDetails(nodeId: Node["id"]): Promise<Node> {
    try {
      const details = await this.repo.findById(nodeId);
      if (!details) throw new AppError("NODE_NOT_FOUND");
      return details;
    } catch (err) {
      if (err instanceof AppError) throw err;
      else
        throw new AppError(
          "INTERNAL",
          `Error al obtener los detalles del nodo`,
        );
    }
  }

  /**
   * @description Obtiene los detalles de múltiples nodos por sus IDs.
   * @param nodeIds Array de IDs de los nodos a obtener
   * @returns Array de nodos con sus detalles
   */
  static async getNodesDetailsBulk(nodeIds: Node["id"][]): Promise<Node[]> {
    try {
      const nodes = await this.repo.findManyByIds(nodeIds);
      return nodes;
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
   * @description Crea un nuevo directorio (nodo) en la base de datos
   * @param parentId ID del nodo padre donde se creara la carpeta
   * @param name Nombre de la carpeta (opcional)
   */
  static async createDirectory(
    parentId: string | null,
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
          finalName = await this.resolveName(parentId, finalName);
        }

        // Preparamos los datos para crear el directorio
        const id = crypto.randomUUID() as string;
        const hash = NodeUtils.genDirectoryHash(id);
        const mime = "inode/directory";

        // Tratamos de crear el directorio (nodo al fin)

        if (parentId) {
          const { hash: _h, ...node } = await this.repo.createTx(tx, {
            id,
            name: finalName,
            hash,
            parent: { connect: { id: parentId } },
            size: 0,
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
        const { hash: _h, ...node } = await this.repo.createTx(tx, {
          id,
          name: finalName,
          hash,
          parent: undefined,
          size: 0,
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
        const { nodeName, nodeHash } = await this.identity.resolveNodeFileTx(
          tx,
          node,
          node.parentId,
          { newName },
        );

        // Actualizar el nodo en la base de datos
        return await this.repo.updateIdentityByIdTx(tx, node.id, {
          newName: nodeName,
          newHash: nodeHash,
        });
      }
    });
  }

  /**
   * @description Obtiene todos los nodos bajo un nodo padre especifico.
   * @param id ID del nodo padre (null para la raiz)
   * @returns Array de nodos hijos
   */
  static async getAllNodes(id: string | null = null) {
    return await this.repo.findByParentId(id);
  }

  /**
   * @description Busca nodos por nombre bajo un nodo padre especifico.
   * @param nameQuery Nombre o parte del nombre a buscar
   * @param parentId ID del nodo padre donde buscar
   * @param limit Máximo número de resultados a retornar (default 20)
   * @returns Array de nodos que coinciden con la búsqueda
   */
  static async searchNodesByName(
    parentId: Node["parentId"],
    nameQuery: string,
    limit: number = 20,
  ) {
    return await this.repo.search(parentId, nameQuery, limit);
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
    return await this.identity.resolveName(parentId, name, newName);
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
    parentId: string | null,
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
    parentId: Node["parentId"],
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
  static async moveNode(node: Node, parentId: string | null, newName?: string) {
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
    parentId: Node["parentId"],
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
    // Obtener la ruta del nodo
    const nodePath = this.cloud.getFilePath(node);

    try {
      // Eliminar el nodo del sistema de nodos
      await this.cloud.delete(nodePath);

      // Usar transacción para eliminar el nodo y actualizar tamaños
      await this.prisma.$transaction(async (tx) => {
        // Si tiene padre, actualizar el tamaño de todos los ancestros que haya
        if (node.parentId) {
          const parent = await this.repo.findByIdTx(tx, node.parentId);

          if (parent) {
            // Actualizar el tamaño de todos los ancestros
            await this.decrementNodeSizeByIdTx(tx, node.parentId, node.size);
          }
        }

        // Eliminar el registro del nodo en la base de datos
        await this.repo.deleteByIdTx(tx, node.id);
      });
    } catch (err) {
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
    // Obtener las rutas de los nodos
    const nodePaths = nodes.map((n) => this.cloud.getFilePath(n));

    try {
      // Primer borrar fisico por si lanza error atraparlo antes de tocar la base de datos
      // Eliminar los archivos del sistema de nodos
      for (const path of nodePaths) {
        await this.cloud.delete(path);
      }

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
   * @param createdNodes Array de nodos creados en la base de datos
   * @param uploadedFiles Array de archivos subidos en el sistema de nodos
   */
  static async rollback(createdNodes: Node[], uploadedFiles: UploadedFile[]) {
    try {
      // Eliminar los archivos creados en el sistema de nodos
      const tmpPaths = uploadedFiles.map((f) => f.path);
      const nodePaths = createdNodes
        .filter((n) => !n.isDir)
        .map((n) => CloudStorageService.getFilePath(n));
      await CloudStorageService.deleteFiles([...tmpPaths, ...nodePaths]);

      // Eliminar los nodos ya creados en la base de datos
      const createdNodeIds = createdNodes.map((n) => n.id);
      await this.repo.deleteManyByIds(createdNodeIds);
    } catch (err) {
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

      // Eliminar los archivos de la nube
      // Ahora iterando para evitar borrar todos en caso de error en uno solo
      for (const d of descendants) {
        if (!d.isDir) {
          await this.cloud.delete(this.cloud.getFilePath(d));
        }
      }

      // Usar transacción para actualizar los tamaños
      await this.prisma.$transaction(async (tx) => {
        // Si tiene padre, actualizar el tamaño del padre (propaga a ancestros)
        if (node.parentId) {
          const parent = await this.repo.findByIdTx(tx, node.parentId);

          if (parent) {
            // Actualizar el tamaño del padre (propaga a ancestros)
            await this.decrementNodeSizeByIdTx(tx, node.parentId, node.size);
          }
        }

        // Eliminamos los archivos y carpetas de la base de datos
        await this.repo.deleteManyByIdsTx(
          tx,
          descendants.map((descendant) => descendant.id),
        );
      });
    } catch (err) {
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

    // Eliminar archivos primero
    if (fileNodes.length > 0) {
      await this.bulkDeleteFileNodes(fileNodes);
    }

    // Luego eliminar directorios
    if (dirNodes.length > 0) {
      await this.bulkDeleteDirectories(dirNodes);
    }
  }

  /**
   * @description Actualiza el tamaño de un nodo.
   * @param nodeId ID del nodo a actualizar
   * @param newSize Nuevo tamaño del nodo
   * @returns Nodo actualizado
   */
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
