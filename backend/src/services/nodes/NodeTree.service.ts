import crypto from "node:crypto";
import path from "node:path";

import { DB } from "@/config/db";
import type {
  DirectoryNode,
  DirectoryNodeLite,
  FileNode,
  FileNodeLite,
  Node,
  NodeLite,
} from "@/domain/nodes/node";
import { fromDescendantRow } from "@/infra/mappers/node.mapper";
import type { DescendantRow } from "@/infra/prisma/types";
import { NodeRepository } from "@/repositories/NodeRepository";
import type { PrismaTxClient } from "@/types/prisma";
import type { UploadManifestEntry } from "@/types/upload";
import { AppError, NodeUtils } from "@/utils";
import parseManifestPath from "@/utils/nodes/parseManifestPath";
import { isPrismaUniqueError } from "@/utils/prisma";

import { NodeIdentityService } from "./NodeIdentity.service";
import { CloudStorageService } from "../cloud/CloudStorage.service";

// Type para el mapeo de IDs de nodos padres en funciones de copiado o movido
type ParentMapping = { oldId: Node["id"]; newId: Node["id"] };

// Type para el resultado de copiado de directorios root
type CopyDirRootResult = {
  oldId: Node["id"];
  newNode: Node;
};

export class NodeTreeService {
  private static readonly repo = NodeRepository;
  private static readonly identity = NodeIdentityService;
  private static readonly prisma = DB.getClient();
  private static readonly cloud = CloudStorageService;

  /**
   * @description Copia un directorio y su contenido (archivos y subdirectorios) dentro de la base de datos y el almacenamiento en la nube
   * @param node Nodo de directorio a copiar
   * @param parentId ID del nodo padre donde se ubicará el directorio copiado
   * @param options Opciones adicionales (nuevo nombre propuesto, concurrencia)
   * @returns Nodos copiados
   */
  static async copyNodeDir(
    node: DirectoryNode,
    parentId: Node["parentId"],
    options?: {
      newName?: string;
      mode?: "copy" | "move";
    },
    cb?: (tx: PrismaTxClient, descendants: DescendantRow[]) => Promise<void>,
  ) {
    // Transacción para "copiar" el nodo en la base de datos

    return await this.prisma.$transaction(async (tx) => {
      // Resolver el nuevo nombre y hash para el nodo de directorio
      const { nodeName, nodeHash, nodeUUID } =
        await this.identity.resolveNodeDirTx(
          tx,
          node,
          parentId,
          options?.newName
            ? {
                newName: options.newName,
              }
            : undefined,
        );

      // Almacenar el nodo copiado
      const nodesToCopy = await this.repo.getAllNodeDescendantsTx(tx, node.id);

      // Asegurarse de que no se está copiando dentro de sí mismo
      if (nodesToCopy.some((n) => n.id === parentId)) {
        throw new AppError(
          "BAD_REQUEST",
          `No se puede ${options?.mode === "move" ? "mover" : "copiar"} un directorio dentro de sí mismo`,
        );
      }

      // Crear el nodo de la carpeta copiada
      const copiedDir = await this.repo.createTx(tx, {
        id: nodeUUID,
        name: nodeName,
        parent: parentId ? { connect: { id: parentId } } : undefined,
        hash: nodeHash,
        size: node.size,
        mime: node.mime,
        isDir: node.isDir,
      });

      // Preparar las carpetas a crear
      const directories = nodesToCopy.filter((n) => n.isDir && n.depth > 0); // Excluir la raiz

      // Copiar la estructura de directorios primero
      const { dirMap, nodesCreated } = await this.copyNodeDirTree(
        tx,
        directories,
        {
          oldId: node.id,
          newId: copiedDir.id,
        },
      );

      // Filtrar solo los archivos para copiarlos
      const files = nodesToCopy.filter((n) => !n.isDir);

      // Copiar los archivos dentro de la estructura creada
      const copiedNodes = await this.copyNodeFileTree(
        tx,
        files,
        dirMap,
        options?.mode,
      );

      // Si tiene padre, propagar el tamaño de todos los ancestros que haya
      if (copiedDir.parentId)
        await this.repo.propagateSizeToAncestorsTx(
          tx,
          copiedDir.parentId,
          copiedDir.size,
          "increment",
        );

      // Callback opcional después de copiar los nodos
      if (cb) await cb(tx, nodesToCopy);

      return [...nodesCreated, ...copiedNodes, copiedDir];
    });
  }

  /**
   * @description Copia varios directorios y su contenido (archivos y subdirectorios) dentro de la base de datos y el almacenamiento en la nube
   * @param nodes Nodos de directorio a copiar
   * @param parentId ID del nodo padre donde se ubicará los directorios copiados
   * @param options Opciones adicionales (concurrencia)
   * @param cb Callback opcional después de copiar los nodos
   * @returns Nodos copiados
   */
  static async bulkCopyNodeDirs(
    nodes: DirectoryNode[],
    parentId: Node["parentId"],
    options?: {
      mode?: "copy" | "move";
    },
    cb?: (tx: PrismaTxClient, descendants: DescendantRow[]) => Promise<void>,
  ): Promise<NodeLite[]> {
    return await this.prisma.$transaction(
      async (tx) => {
        // Obtener todos los descendientes de TODOS los nodos a copiar
        const allDescendants = await this.repo.getAllNodeDescendantsBulkTx(
          tx,
          nodes.map((n) => n.id),
        );

        // Asegurarse de que no se está copiando ningun nodo dentro de sí mismo
        if (allDescendants.some((n) => n.id === parentId)) {
          throw new AppError(
            "BAD_REQUEST",
            `No se puede ${options?.mode === "move" ? "mover" : "copiar"} un directorio dentro de sí mismo`,
          );
        }

        // Obtener los nodos padre raíz de cada árbol de descendientes
        const rootNodes = allDescendants.filter((n) => n.depth === 0);
        const copiedRoots: CopyDirRootResult[] = [];

        // Copiar cada árbol de nodos de directorio uno por uno
        for (const rootNode of rootNodes) {
          // Primero le resolvemos una identidad única al nodo root, dentro del parentId dado
          const { nodeUUID, nodeName, nodeHash } =
            await this.identity.resolveNodeDirTx(
              tx,
              fromDescendantRow(rootNode) as DirectoryNodeLite, // Es seguro castear porque esta funcion solo recibe nodos de directorio y los roots siempre son directorios
              parentId,
            );

          // Luego creamos el nodo root copiado en la base de datos
          const copiedDir = await this.repo.createTx(tx, {
            id: nodeUUID,
            name: nodeName,
            parent: parentId ? { connect: { id: parentId } } : undefined,
            hash: nodeHash,
            size: rootNode.size,
            mime: rootNode.mime,
            isDir: rootNode.isDir,
          });

          // Finalmente guardamos su información para copiar su árbol entero luego
          copiedRoots.push({
            oldId: rootNode.id,
            newNode: copiedDir,
          });
        }

        // SI hay un parentId, propagar el tamaño total de todos los nodos copiados a sus ancestros
        if (parentId) {
          // Calculamos el tamaño total a propagar a los ancestros
          const totalSizeToPropagate = copiedRoots.reduce(
            (acc, cr) => acc + cr.newNode.size,
            0n,
          );

          // Finalmente propagamos el tamaño a los ancestros
          await this.repo.propagateSizeToAncestorsTx(
            tx,
            parentId,
            totalSizeToPropagate,
            "increment",
          );
        }

        // Ahora procesaremos cada árbol de descendientes primero de las carpetas
        const directories = allDescendants.filter(
          (n) => n.isDir && n.depth > 0,
        ); // Excluimos las raices

        const newRootIds: ParentMapping[] = copiedRoots.map((cr) => ({
          oldId: cr.oldId,
          newId: cr.newNode.id,
        }));

        // Copiamos la estructura de directorios primero
        const { dirMap, nodesCreated } = await this.copyNodeDirTree(
          tx,
          directories,
          newRootIds,
        );

        // Luego procesamos todos los archivos
        const files = allDescendants.filter((n) => !n.isDir);

        // Copiar los archivos dentro de la estructura creada
        const copiedNodes = await this.copyNodeFileTree(
          tx,
          files,
          dirMap,
          options?.mode,
        );

        // Callback opcional después de copiar los nodos
        if (cb) await cb(tx, allDescendants);

        return [
          ...nodesCreated,
          ...copiedNodes,
          ...copiedRoots.map((r) => r.newNode),
        ];
      },
      { maxWait: 5000, timeout: 90000 }, // 90 segundos de timeout por si hay muchos nodos
    );
  }

  /**
   * @description Mueve un directorio y su contenido (archivos y subdirectorios) dentro de la base de datos y el almacenamiento en la nube
   * @param node Nodo de directorio a mover
   * @param parentId ID del nodo padre donde se ubicará el directorio movido
   * @param options Opciones adicionales (nuevo nombre propuesto)
   * @returns Nodos movidos
   */
  static async moveNodeDir(
    node: DirectoryNode,
    parentId: Node["parentId"],
    options?: { newName?: string },
  ) {
    return await this.copyNodeDir(
      node,
      parentId,
      { ...options, mode: "move" },
      async (tx, descendants) => {
        // Eliminar el árbol original después de copiarlo
        const nodeDirIds = descendants
          .filter((n) => n.isDir) // Los archivos no se eliminan porque fueron actualizados en su lugar
          .map((n) => n.id); // Obtener solo los IDs

        await this.repo.deleteManyByIdsTx(tx, nodeDirIds);

        // Si el nodo original tenía padre, decrementar el tamaño de sus ancestros
        if (node.parentId) {
          // Decrementar el tamaño de los ancestros del padre antiguo
          await this.repo.propagateSizeToAncestorsTx(
            tx,
            node.parentId,
            node.size,
            "decrement",
          );
        }
      },
    );
  }

  /**
   * @description Mueve varios directorios y su contenido (archivos y subdirectorios) dentro de la base de datos y el almacenamiento en la nube
   * @param nodes Nodos de directorio a mover
   * @param parentId ID del nodo padre donde se ubicará los directorios movidos
   * @returns Nodos movidos
   */
  static async bulkMoveNodeDirs(
    nodes: DirectoryNode[],
    parentId: Node["parentId"],
  ) {
    return await this.bulkCopyNodeDirs(
      nodes,
      parentId,
      { mode: "move" },
      async (tx, descendants) => {
        // Eliminar el árbol original después de copiarlo
        const nodeDirIds = descendants
          .filter((n) => n.isDir) // Los archivos no se eliminan porque fueron actualizados en su lugar
          .map((n) => n.id); // Obtener solo los IDs

        await this.repo.deleteManyByIdsTx(tx, nodeDirIds);

        // Iterar sobre todos los nodos movidos
        for (const node of nodes) {
          // Si el nodo original tenía padre, decrementar el tamaño de sus ancestros
          if (node.parentId) {
            // Decrementar el tamaño de los ancestros del padre antiguo
            await this.repo.propagateSizeToAncestorsTx(
              tx,
              node.parentId,
              node.size,
              "decrement",
            );
          }
        }
      },
    );
  }

  /**
   * @description Copia la estructura de directorios de un árbol de nodos en la base de datos
   * @param tx Transacción de Prisma
   * @param directories Directorios a copiar
   * @param parentData Datos del nodo padre original y nuevo
   * @returns Mapa de directorios antiguos a nuevos
   */
  static async copyNodeDirTree(
    tx: PrismaTxClient,
    directories: DescendantRow[],
    parentData: ParentMapping | ParentMapping[],
  ) {
    const parentDataArray = Array.isArray(parentData)
      ? parentData
      : [parentData];

    // Mapa para rastrear los IDs nuevos de las carpetas copiadas
    const dirMap = new Map<DescendantRow["id"], Pick<DescendantRow, "id">>(
      parentDataArray.map((pd) => [pd.oldId, { id: pd.newId }]),
    );

    const nodesToCreate: NodeLite[] = [];
    await NodeUtils.forEachDepthLevel(directories, async (depthNodes) => {
      // Procesar todos los nodos en este nivel de profundidad
      for (const dirNode of depthNodes) {
        const id = crypto.randomUUID() as string;

        const parent = dirMap.get(dirNode.parentId!);
        dirMap.set(dirNode.id, {
          id,
        });

        nodesToCreate.push({
          id,
          parentId: parent ? parent.id : null,
          name: dirNode.name,
          hash: NodeUtils.genDirectoryHash(id),
          size: dirNode.size,
          mime: "inode/directory",
          isDir: true,
        });
      }

      await this.repo.createManyTx(tx, nodesToCreate);
    });

    return {
      dirMap,
      nodesCreated: nodesToCreate,
    };
  }

  /**
   * @description Copia los archivos de un árbol de nodos en la base de datos y en el almacenamiento en la nube
   * @param tx Transacción de Prisma
   * @param files Archivos a copiar
   * @param dirMap Mapa de directorios antiguos a nuevos
   * @param mode Modo de operación: "copy" o "move"
   * @returns Nodos copiados
   */
  static async copyNodeFileTree(
    tx: PrismaTxClient,
    files: DescendantRow[],
    dirMap: Map<Node["id"], { id: Node["id"] }>,
    mode?: "copy" | "move", // default será "copy"
  ) {
    const cloudRoot = await this.cloud.getCloudRootPath();
    const copiedNodes: Node[] = []; // Almacenar los nodos copiados

    // Ahora copiar todos los nodos (archivos) concurrentemente
    for (const file of files) {
      // Mapear el nodo hijo
      const childNode = fromDescendantRow(file) as FileNodeLite;
      const parent = dirMap.get(childNode.parentId!)!;

      // Resolver el nuevo nombre y hash para el nodo hijo
      const { nodeName, nodeHash } = await this.identity.resolveNodeFileTx(
        tx,
        childNode,
        parent.id,
      );

      const src = path.resolve(cloudRoot, childNode.hash); // Ruta actual del nodo
      const dest = path.resolve(cloudRoot, nodeHash); // Nueva ruta del nodo copiado

      // Transacción para crear o actualizar (mover) el nodo en la base de datos según el modo
      if (mode === "move") {
        // Mover el nodo en lugar de copiarlo
        const movedFileNode = await this.repo.updateIdentityAndParentIdByIdTx(
          tx,
          childNode.id,
          { newName: nodeName, newHash: nodeHash },
          parent.id,
        );

        // Mover el archivo en el almacenamiento en la nube
        try {
          await this.cloud.move(src, dest); // Mover el archivo en la nube
        } catch (err) {
          console.error(`Error moving file in cloud storage:`, err);
          // Revertir la actualización en la base de datos si falla el movimiento en la nube
          await this.repo.updateIdentityAndParentIdByIdTx(
            tx,
            childNode.id,
            { newName: childNode.name, newHash: childNode.hash },
            childNode.parentId,
          );
          throw err;
        }

        // Almacenar el nodo movido (en realidad copiado)
        copiedNodes.push(movedFileNode);
      } else {
        try {
          await this.cloud.copy(src, dest); // Copiar el archivo en la nube
          // Crear el nuevo nodo en la base de datos
          const newFileNode = await this.repo.createTx(tx, {
            name: nodeName,
            parent: { connect: { id: parent.id } },
            hash: nodeHash,
            size: childNode.size,
            mime: childNode.mime,
            isDir: childNode.isDir,
          });
          // Almacenar el nodo copiado
          copiedNodes.push(newFileNode);
        } catch (err) {
          console.error(`Error copying file in cloud storage:`, err);
          await this.cloud.delete(dest).catch(() => {});
          throw err;
        }
      }
    }

    return copiedNodes;
  }

  /**
   * @description Mueve un archivo a una nueva ubicación en el almacenamiento en la nube
   * @param node Nodo a mover
   * @param parentId ID del nodo padre donde se ubicará el archivo movido
   * @param newName Nuevo nombre propuesto para el archivo movido (opcional)
   * @returns Nodo movido
   */
  static async moveNodeFile(
    node: FileNode,
    parentId: string | null,
    newName?: string,
  ) {
    // Si es un archivo y hay un nuevo nombre, asegurarse de que la extension del archivo se mantiene
    if (newName) newName = NodeUtils.ensureNodeExt(newName, node);

    // Transacción para "mover" el nodo en la base de datos
    return await this.prisma.$transaction(async (tx) => {
      // Asegurarse de que la extension se mantenga igual si es
      const { nodeName, nodeHash } = await this.identity.resolveNodeFileTx(
        tx,
        node,
        parentId,
        {
          newName,
        },
      );

      // Obtener la ruta raiz de la nube
      const cloudRoot = await this.cloud.getCloudRootPath();

      // Obtenemos la carpeta root
      const src = path.resolve(cloudRoot, node.hash); // Ruta actual del nodo
      const dest = path.resolve(cloudRoot, nodeHash); // Nueva ruta del nodo a mover

      // Preparamos un resultado para devolver al frontend, ignorando el hash
      const res = await this.repo.updateIdentityAndParentIdByIdTx(
        tx,
        node.id,
        { newName: nodeName, newHash: nodeHash },
        parentId,
      );

      try {
        // Despues de actualizar la base de datos, para mantener la consistencia,
        // Mover el archivo en el almacenamiento en la nube
        await this.cloud.move(src, dest);
      } catch (err) {
        console.error(`Error moving file in cloud storage:`, err);
        // Si hay un error al mover el archivo en la nube, revertir en la bd y en la nube
        await this.cloud.move(dest, src).catch(() => {});
        await this.repo.updateIdentityAndParentIdByIdTx(
          tx,
          node.id,
          { newName: node.name, newHash: node.hash },
          node.parentId,
        );
        throw err;
      }

      // Si el nuevo padre no es null (root) y es diferente al actual, actualizar los tamaños de los ancestros
      if (parentId !== node.parentId) {
        // Decrementar el tamaño de los ancestros del padre antiguo si no es null (root)
        if (node.parentId) {
          await this.repo.propagateSizeToAncestorsTx(
            tx,
            node.parentId,
            node.size,
            "decrement",
          );
        }

        // Incrementar el tamaño de los ancestros del nuevo padre si no es null (root)
        if (parentId) {
          await this.repo.propagateSizeToAncestorsTx(
            tx,
            parentId,
            node.size,
            "increment",
          );
        }
      }

      // Retornamos el nodo movido
      return res;
    });
  }

  /**
   * @description Mueve varios archivos a una nueva ubicación en el almacenamiento en la nube
   * @param nodes Nodos a mover
   * @param parentId ID del nodo padre donde se ubicará los archivos movidos
   * @returns Nodos movidos
   */
  static async bulkMoveNodeFiles(
    nodes: FileNode[],
    parentId: FileNode["parentId"],
  ) {
    // Transacción para "mover" los nodos en la base de datos
    return await this.prisma.$transaction(
      async (tx) => {
        const movedNodes: Node[] = [];

        // Iterar sobre todos los nodos a mover
        for (const node of nodes) {
          // Asegurarse de que la extension se mantenga igual si es
          const { nodeName, nodeHash } = await this.identity.resolveNodeFileTx(
            tx,
            node,
            parentId,
          );

          // Obtener la ruta raiz de la nube
          const cloudRoot = await this.cloud.getCloudRootPath();

          // Obtenemos la carpeta root
          const src = path.resolve(cloudRoot, node.hash); // Ruta actual del nodo
          const dest = path.resolve(cloudRoot, nodeHash); // Nueva ruta del nodo a mover

          // Preparamos un resultado para devolver al frontend, ignorando el hash
          const res = await this.repo.updateIdentityAndParentIdByIdTx(
            tx,
            node.id,
            { newName: nodeName, newHash: nodeHash },
            parentId,
          );

          // Si el nuevo padre no es null (root) y es diferente al actual, actualizar los tamaños de los ancestros
          if (parentId !== node.parentId) {
            // Decrementar el tamaño de los ancestros del padre antiguo si no es null (root)
            if (node.parentId) {
              await this.repo.propagateSizeToAncestorsTx(
                tx,
                node.parentId,
                node.size,
                "decrement",
              );
            }

            // Incrementar el tamaño de los ancestros del nuevo padre si no es null (root)
            if (parentId) {
              await this.repo.propagateSizeToAncestorsTx(
                tx,
                parentId,
                node.size,
                "increment",
              );
            }
          }

          try {
            // Despues de actualizar la base de datos, para mantener la consistencia,
            // Mover el archivo en el almacenamiento en la nube
            await this.cloud.move(src, dest);
          } catch (err) {
            console.error(`Error moving file in cloud storage:`, err);
            // Si hay un error al mover el archivo en la nube, revertir en la bd y en la nube
            await this.cloud.move(dest, src).catch(() => {});
            await this.repo.updateIdentityAndParentIdByIdTx(
              tx,
              node.id,
              { newName: node.name, newHash: node.hash },
              node.parentId,
            );
            throw err;
          }

          movedNodes.push(res);
        }

        return movedNodes;
      },
      { maxWait: 5000, timeout: 90000 }, // 90 segundos de timeout por si hay muchos nodos
    );
  }

  /**
   * @description Adjunta un nodo de archivo existente a una nueva ubicación en la base de datos y en el almacenamiento en la nube
   * @param node Nodo de archivo a adjuntar
   * @param parentId ID del nodo padre donde se ubicará el archivo adjuntado
   * @param newName Nuevo nombre propuesto para el archivo adjuntado (opcional)
   * @returns Nodo adjuntado
   */
  static async attachNodeFile(
    node: FileNode,
    parentId: FileNode["parentId"],
    newName?: string,
  ) {
    // Si es un archivo y hay un nuevo nombre, asegurarse de que la extension del archivo se mantiene
    if (newName) newName = NodeUtils.ensureNodeExt(newName, node);

    // Obtener la ruta raiz de la nube
    const cloudRoot = await CloudStorageService.getCloudRootPath();

    // Transaccion para "copiar" el nodo en la base de datos
    return await this.prisma.$transaction(async (tx) => {
      // Asegurarse de que la extension se mantenga igual si es
      const { nodeName, nodeHash } = await this.identity.resolveNodeFileTx(
        tx,
        node,
        parentId,
        {
          newName,
        },
      );

      // Construimos las rutas absoluta de origen y destino del archivo en la nube
      const src = path.resolve(cloudRoot, node.hash); // Ruta actual del nodo
      const dest = path.resolve(cloudRoot, nodeHash); // Nueva ruta del nodo copiado

      // Copiar el archivo en el almacenamiento en la nube
      await CloudStorageService.copy(src, dest);

      try {
        // Preparamos un resultado para devolver al frontend, ignorando el hash
        const res = await this.repo.createTx(tx, {
          name: nodeName,
          parent: parentId ? { connect: { id: parentId } } : undefined,
          hash: nodeHash,
          size: node.size,
          mime: node.mime,
          isDir: node.isDir,
        });

        // Si tiene padre, actualizar el tamaño de todos los ancestros que haya
        if (parentId) {
          await this.repo.propagateSizeToAncestorsTx(
            tx,
            parentId,
            node.size,
            "increment",
          );
        }

        // Retornamos el nodo copiado
        return res;
      } catch (err) {
        // Si hay un error al crear el nodo en la base de datos, eliminar el archivo copiado
        // para evitar archivos "inexistentes" en el almacenamiento
        await CloudStorageService.delete(dest).catch(() => {});
        throw err;
      }
    });
  }

  /**
   * @description Adjunta varios nodos de archivo existentes a una nueva ubicación en la base de datos y en el almacenamiento en la nube
   * @param nodes Nodos de archivo a adjuntar
   * @param parentId ID del nodo padre donde se ubicará los archivos adjuntados
   * @returns Nodos adjuntados
   */
  static async bulkAttachNodeFiles(
    nodes: FileNode[],
    parentId: FileNode["parentId"],
  ) {
    // Obtener la ruta raiz de la nube
    const cloudRoot = await CloudStorageService.getCloudRootPath();

    // Transaccion para "copiar" el nodo en la base de datos
    return await this.prisma.$transaction(
      async (tx) => {
        const copiedNodes: Node[] = [];
        for (const node of nodes) {
          const { nodeName, nodeHash } = await this.identity.resolveNodeFileTx(
            tx,
            node,
            parentId,
          );

          // Construimos las rutas absoluta de origen y destino del archivo en la nube
          const src = path.resolve(cloudRoot, node.hash); // Ruta actual del nodo
          const dest = path.resolve(cloudRoot, nodeHash); // Nueva ruta del nodo copiado

          // Copiar el archivo en el almacenamiento en la nube
          await CloudStorageService.copy(src, dest);

          try {
            // Preparamos un resultado para devolver al frontend, ignorando el hash
            const res = await this.repo.createTx(tx, {
              name: nodeName,
              parent: parentId ? { connect: { id: parentId } } : undefined,
              hash: nodeHash,
              size: node.size,
              mime: node.mime,
              isDir: node.isDir,
            });

            // Si tiene padre, actualizar el tamaño de todos los ancestros que haya
            if (parentId) {
              await this.repo.propagateSizeToAncestorsTx(
                tx,
                parentId,
                node.size,
                "increment",
              );
            }

            copiedNodes.push(res);
          } catch (err) {
            console.log(err);

            // Si hay un error al crear el nodo en la base de datos, eliminar el archivo copiado
            // para evitar archivos "inexistentes" en el almacenamiento
            await CloudStorageService.delete(dest).catch(() => {});
            throw new AppError("COPY_NODE_ERROR");
          }
        }

        // Retornamos los nodos copiados
        return copiedNodes;
      },
      { maxWait: 5000, timeout: 90000 }, // 90 segundos de timeout por si hay muchos nodos
    );
  }

  /**
   * @description Asegura que la ruta de directorios para un manifiesto de subida exista, creando los directorios necesarios en la base de datos
   * @param tx Transacción de Prisma
   * @param parentId ID del nodo padre donde se ubicará la ruta del manifiesto
   * @param manifest Entrada del manifiesto de subida
   * @returns ID del último directorio creado o encontrado
   */
  static async ensureManifestPathTree(
    tx: PrismaTxClient,
    parentId: Node["id"] | null,
    manifest: UploadManifestEntry,
    dirCache: Map<string, Node>,
  ) {
    // Parsear la ruta del manifiesto
    const { parts, isDirectory } = parseManifestPath(manifest.path);

    // Determinar las partes de la ruta a procesar
    // Si es un directorio, procesamos todas las partes
    // Si es un archivo, procesamos todas menos la última (el nombre del archivo)
    const dirNames = isDirectory ? parts : parts.slice(0, -1);

    // Empezamos desde el parentId dado
    let currentParentId = parentId;

    // Iteramos sobre cada parte de la ruta para asegurarnos de que los directorios existen
    for (const dirName of dirNames) {
      // Asegurarnos de que el directorio existe o crearlo si no existe
      const dir = await this.ensureDirectoryTx(
        tx,
        currentParentId,
        dirName,
        dirCache,
      );
      // Actualizar el currentParentId para la siguiente iteración
      currentParentId = dir.id;
    }

    // Retornar el ID del último directorio creado o encontrado
    return currentParentId;
  }

  /**
   * @description Asegura que un directorio exista en la base de datos, creándolo si no existe
   * @param tx Transacción de Prisma
   * @param parentId ID del nodo padre donde se ubicará el directorio
   * @param dirName Nombre del directorio a asegurar
   * @param dirCache Cache de directorios ya creados o encontrados
   * @returns Nodo del directorio asegurado
   */
  private static async ensureDirectoryTx(
    tx: PrismaTxClient,
    parentId: Node["id"] | null,
    dirName: string,
    dirCache: Map<string, Node>,
  ): Promise<Node> {
    // Verificar si ya tenemos este directorio en cache
    const cacheKey = `${parentId ?? "root"}:${dirName}`; // Clave unica por parentId + dirName
    // Buscar en cache
    let dir: Node | null | undefined = dirCache.get(cacheKey);
    if (dir) return dir;

    dir ??= await this.createDirectorySafelyTx(tx, parentId, dirName);

    // SI no se encontró ni creó el directorio, lanzar error
    if (!dir) {
      throw new AppError(
        "INTERNAL",
        "Error al subir el directorio, no se encontró ni creó el directorio esperado.",
      );
    }

    dirCache.set(cacheKey, dir);
    return dir;
  }

  /**
   * @description Crea un directorio de forma segura en la base de datos, manejando condiciones de carrera
   * @param tx Transacción de Prisma
   * @param parentId ID del nodo padre donde se ubicará el directorio
   * @param dirName Nombre del directorio a crear
   * @returns Nodo del directorio creado o existente
   */
  private static async createDirectorySafelyTx(
    tx: PrismaTxClient,
    parentId: Node["id"] | null,
    dirName: string,
  ): Promise<Node | null> {
    const id = crypto.randomUUID() as string;
    const nodeHash = NodeUtils.genDirectoryHash(id);
    const mime = "inode/directory";

    try {
      return await this.repo.createTx(tx, {
        id,
        name: dirName,
        parent: parentId ? { connect: { id: parentId } } : undefined,
        hash: nodeHash,
        size: 0n,
        isDir: true,
        mime,
      });
    } catch (err) {
      if (!isPrismaUniqueError(err)) throw err;

      // Si hay un error de unicidad, significa que otro proceso creó el directorio al mismo tiempo
      // Por lo que simplemente lo buscamos de nuevo
      const existingDir = await this.repo.findByNameAndParentIdTx(
        tx,
        dirName,
        parentId,
      );
      return existingDir;
    }
  }
}
