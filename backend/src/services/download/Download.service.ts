import type { Response } from "express";

import type {
  DirectoryNode,
  FileNodeWithBlob,
  Node,
} from "@/domain/nodes/node";
import { zipStreamDirectory } from "@/infra/download/zip-stream";
import { toZipEntry } from "@/infra/mappers/zip.mapper";
import type { DescendantRowWithBlob } from "@/infra/prisma/types";
import { NodeRepository } from "@/repositories/NodeRepository";
import { CloudStorageService } from "@/services/cloud/CloudStorage.service";
import { AppError, NodeUtils } from "@/utils";

export class DownloadService {
  private static get repo() {
    return NodeRepository;
  }

  /**
   * @description Descarga un nodo (archivo o directorio).
   * @param node Nodo a descargar
   * @param res Respuesta HTTP
   */
  static readonly downloadNode = async (
    node: FileNodeWithBlob | Node,
    res: Response,
  ) => {
    // Si el nodo es un directorio, manejamos la descarga como un ZIP
    if (node.isDir) {
      await this.downloadDirectoryNode(node, res);
      return;
    }

    // Chequeo de seguridad: un nodo archivo siempre debe tener un blob asociado
    if (!("blob" in node) || !node.blob) throw new AppError("FILE_NOT_FOUND");

    // Si es un archivo, lo descargamos directamente
    await this.downloadFileNode(node, res);
  };

  /**
   * @description Descarga un nodo archivo.
   * @param node Nodo archivo a descargar
   * @param res Respuesta HTTP
   */
  static readonly downloadFileNode = async (
    node: FileNodeWithBlob,
    res: Response,
  ) => {
    // Obtener la ruta del archivo en el almacenamiento
    const nodePath = CloudStorageService.getFilePath(node.blob);
    // Establecer el tipo de contenido en la respuesta
    res.set("Content-Type", node.blob.mime);

    // Send the node as a download
    console.log(`Downloading node: ${node.name} from path: ${nodePath}`);

    // Use a promise to handle the download completion
    await new Promise<void>((resolve, reject) => {
      res.download(nodePath, node.name, (err: Error & { code?: string }) => {
        if (err) {
          // If headers are already sent, sadly we cannot send an error response
          if (res.headersSent) resolve();

          // Handle node not found error
          if (err.code === "ENOENT") {
            return reject(new AppError("FILE_NOT_FOUND"));
          }

          // Other errors
          return reject(
            new AppError("INTERNAL", "Error interno al descargar el nodo"),
          );
        }

        // Download completed successfully
        resolve();
      });
    });
  };

  /**
   * @description Descarga un nodo directorio como un archivo ZIP.
   * @param rootNode Nodo directorio raíz a descargar
   * @param res Respuesta HTTP
   */
  static readonly downloadDirectoryNode = async (
    rootNode: DirectoryNode,
    res: Response,
  ) => {
    try {
      console.log("Iniciando descarga de directorio:", rootNode.name);
      const zipName = `${rootNode.name}.zip`;
      // Obtener todos los archivos y subcarpetas.
      const descendants = await this.repo.getAllNodeDescendantsWithBlob(
        rootNode.id,
      );

      // Hacemos un map que nos ayudará en la construcción de rutas
      const descendantMap = new Map<string, DescendantRowWithBlob>(
        descendants.map((n) => [n.id, n]),
      );

      // Construir todas las entradas que se agregarán al ZIP
      // Función generadora para las entradas del ZIP
      const entries = (function* () {
        // Se itera sobre todos los nodos descendientes
        for (const n of descendants) {
          // Se genera una entrada de ZIP cada vez que se solicita
          yield toZipEntry(
            n,
            NodeUtils.buildRelativeNodePath(descendantMap, rootNode.id, n.id),
          );
        }
      })();

      // Crear el stream del ZIP
      await zipStreamDirectory({
        res,
        zipName,
        entries,
        options: { level: 3 },
      });
    } catch (err) {
      console.error("Error en downloadDirectory:", err);
      throw err;
    }
  };

  /**
   * @description Descarga múltiples nodos (archivos o directorios) como un archivo ZIP.
   * @param nodes Nodos a descargar
   * @param res Respuesta HTTP
   */
  static readonly downloadNodesBulk = async (
    nodes: FileNodeWithBlob[] | Node[],
    res: Response,
  ) => {
    if (nodes.length === 1) {
      // Si solo hay un nodo, descargarlo directamente
      await this.downloadNode(nodes[0], res);
    } else {
      // Si hay múltiples nodos, crear un ZIP con todos ellos
      const zipName = "download.zip"; // Nombre genérico para el ZIP

      // Obtener los archivos
      const files = nodes.filter((n) => !n.isDir) as FileNodeWithBlob[]; // Casteo seguro ya que en el middleware se asegura de traer los blobs
      // Obtener los directorios
      const directories = nodes.filter((n) => n.isDir);

      // Obtener todos los descendientes de los directorios seleccionados
      const descendants = await this.repo.getAllNodeDescendantsBulkWithBlob(
        directories.map((d) => d.id),
      );

      // Hacemos un map que nos ayudará en la construcción de rutas
      const descendantMap = new Map<string, DescendantRowWithBlob>(
        descendants.map((n) => [n.id, n]),
      );

      // Función generadora para las entradas del ZIP
      // Mientras el zipStream lo vaya pidiendo, le vamos entregando las entradas
      const entries = (function* () {
        // Primero agregamos los archivos sueltos sin carpeta
        for (const file of files) {
          yield toZipEntry(file, file.name);
        }

        // Luego agregamos los contenidos de los directorios
        // descendants tambien incluye los directorios raiz seleccionados
        for (const descendant of descendants) {
          yield toZipEntry(
            descendant,
            NodeUtils.buildRelativeNodePath(
              descendantMap,
              descendant.rootId,
              descendant.id,
            ),
          );
        }
      })();

      // Crear el stream del ZIP
      await zipStreamDirectory({
        res,
        zipName,
        entries,
        options: { level: 3 },
      });
    }
  };
}
