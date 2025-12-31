import type { Request, Response } from "express";

import { GLOBAL_ROOT_ID } from "@/config/constants";
import {
  toAncestorDTO,
  toDescendantDTO,
  toNodeDTO,
  toNodeLiteDTO,
  toNodeSearchDTO,
} from "@/infra/mappers/node.dto-mapper";
import { DownloadService } from "@/services/download/Download.service";
import { NodeService } from "@/services/nodes/Node.service";
import { AppError } from "@/utils";

export class NodeController {
  // Crear un nuevo nodo (solo directorios por ahora)
  static readonly createNode = async (
    req: Request<
      unknown,
      unknown,
      {
        parentId: string | null;
        name: string | null;
        isDir: boolean;
      }
    >,
    res: Response,
  ) => {
    const { parentId, name, isDir } = req.body;

    if (!isDir) {
      throw new AppError(
        "INTERNAL",
        "La creación de archivos no está implementada",
      );
    }

    const node = await NodeService.createDirectory(
      GLOBAL_ROOT_ID,
      parentId || GLOBAL_ROOT_ID,
      name,
    );
    res.success(toNodeDTO(node), 201);
  };

  // Subir nodos (archivos/carpetas)
  static readonly uploadNodes = (req: Request, res: Response) => {
    const nodes = req.nodes;
    res.success(nodes?.map((n) => toNodeDTO(n)) ?? [], 201);
  };

  static readonly searchNode = async (req: Request, res: Response) => {
    const { q, limit, parentId } = req.query as unknown as {
      q: string;
      limit?: number;
      parentId: string | null;
    };

    try {
      const nodes = await NodeService.searchNodesByName(
        GLOBAL_ROOT_ID,
        parentId || GLOBAL_ROOT_ID,
        q,
        limit,
      );
      res.success(nodes.map((n) => toNodeSearchDTO(n)));
    } catch (err) {
      console.error(err);
      throw new AppError("INTERNAL", "Error al buscar nodos");
    }
  };

  // Obtener todos los nodos desde la raiz
  static readonly getNodesFromRoot = async (_req: Request, res: Response) => {
    try {
      // Usar un ID de root fijo para este ejemplo; en producción, obtener del usuario autenticado
      const nodes = await NodeService.getAllNodes(GLOBAL_ROOT_ID);
      res.success(nodes.map((n) => toNodeDTO(n)));
    } catch (err) {
      console.error(err);
      throw new AppError("INTERNAL", "Error al obtener los nodos");
    }
  };

  // Obtener todos los nodos de un directorio
  static readonly getNodesFromDirectory = async (
    req: Request,
    res: Response,
  ) => {
    // Asegurarse de que el nodo sea un directorio, puesto que un archivo no puede contener nodos hijos
    if (!req.node!.isDir) throw new AppError("NODE_IS_NOT_DIRECTORY");

    try {
      const nodes = await NodeService.getAllNodes(req.node!.id);
      res.success(nodes.map((n) => toNodeDTO(n)));
    } catch (err) {
      console.error(err);
      throw new AppError(
        "INTERNAL",
        `Error al obtener los nodos de ${req.node!.name}`,
      );
    }
  };

  // Obtener ancestros de un nodo
  static readonly getNodeAncestors = async (req: Request, res: Response) => {
    const node = req.node!;

    try {
      const ancestors = await NodeService.getNodeAncestors(node.id);
      res.success(ancestors.map((n) => toAncestorDTO(n)));
    } catch (err) {
      if (err instanceof AppError) throw err;
      else
        throw new AppError(
          "INTERNAL",
          `Error al obtener los ancestros de ${node.name}`,
        );
    }
  };

  // Obtener descendientes de un nodo
  static readonly getNodeDescendants = async (req: Request, res: Response) => {
    const node = req.node!;

    try {
      const descendants = await NodeService.getNodeAncestors(node.id);
      res.success(descendants.map((n) => toDescendantDTO(n)));
    } catch (err) {
      if (err instanceof AppError) throw err;
      else
        throw new AppError(
          "INTERNAL",
          `Error al obtener los ancestros de ${node.name}`,
        );
    }
  };

  // Obtener descendientes de un nodo
  static readonly getNodeDetails = async (req: Request, res: Response) => {
    const node = req.node!;

    try {
      const details = await NodeService.getNodeDetails(node.id);
      res.success(toNodeDTO(details));
    } catch (err) {
      if (err instanceof AppError) throw err;
      else
        throw new AppError(
          "INTERNAL",
          `Error al obtener los detalles de ${node.name}`,
        );
    }
  };

  // Eliminar un nodo
  static readonly deleteNode = async (req: Request, res: Response) => {
    const node = req.node!;

    try {
      await NodeService.deleteNode(node);
      res.success(undefined, 204);
    } catch (err) {
      console.log(err);
      if (err instanceof AppError) throw err;
      else throw new AppError("INTERNAL", "Error al eliminar el nodo");
    }
  };

  // Eliminar varios nodos
  static readonly bulkDeleteNodes = async (
    req: Request<unknown, unknown, { nodeIds: string[] }>,
    res: Response,
  ) => {
    const nodes = req.nodes!;

    try {
      await NodeService.bulkDeleteNodes(nodes);
      res.success(undefined, 204);
    } catch (err) {
      console.error(err);
      if (err instanceof AppError) throw err;
      else throw new AppError("INTERNAL", "Error al eliminar los nodos");
    }
  };

  // Descargar un nodo
  static readonly downloadNode = async (req: Request, res: Response) => {
    const node = req.node!;
    await DownloadService.downloadNode(node, res);
  };

  // Descargar varios nodos
  static readonly bulkDownloadNodes = async (
    req: Request<unknown, unknown, { nodeIds: string[] }>,
    res: Response,
  ) => {
    const nodes = req.nodes!;
    await DownloadService.downloadNodesBulk(nodes, res);
  };

  // Renombrar un nodo
  static readonly renameNode = async (
    req: Request<unknown, unknown, { newName: string }>,
    res: Response,
  ) => {
    const { newName } = req.body;
    const node = req.node!;

    try {
      const renamedNode = await NodeService.renameNode(node, newName);
      res.success(toNodeDTO(renamedNode));
    } catch (err) {
      if (err instanceof AppError) throw err;
      else
        throw new AppError(
          "INTERNAL",
          `No se pudo renombrar el ${node.isDir ? "directorio" : "archivo"}`,
        );
    }
  };

  // Copiar un nodo
  static readonly copyNode = async (
    req: Request<unknown, unknown, { parentId?: string; newName?: string }>,
    res: Response,
  ) => {
    const { parentId, newName: proposedName } = req.body;
    const node = req.node!;

    try {
      // Realizar la copia del nodo
      const result = await NodeService.copyNode(
        node,
        parentId || GLOBAL_ROOT_ID,
        proposedName,
      );

      // Mapear a DTO y enviar la respuesta
      res.success(
        Array.isArray(result)
          ? result.map((n) => toNodeLiteDTO(n))
          : toNodeLiteDTO(result),
      );
    } catch (err) {
      console.log(err);
      if (err instanceof AppError) throw err;
      else
        throw new AppError(
          "INTERNAL",
          `No se pudo copiar el ${node.isDir ? "directorio" : "archivo"}`,
        );
    }
  };

  // Copiar varios nodos
  static readonly bulkCopyNodes = async (
    req: Request<
      unknown,
      unknown,
      { parentId?: string | null; nodeIds: string[] }
    >,
    res: Response,
  ) => {
    const { parentId } = req.body;
    const nodes = req.nodes!;

    try {
      const copiedNodes = await NodeService.bulkCopyNodes(
        nodes,
        parentId || GLOBAL_ROOT_ID,
      );

      res.success(copiedNodes.map((n) => toNodeLiteDTO(n)));
    } catch (err) {
      console.error(err);
      if (err instanceof AppError) throw err;
      else
        throw new AppError("INTERNAL", "No se pudieron copiar uno o más nodos");
    }
  };

  // Mover un nodo
  static readonly moveNode = async (
    req: Request<
      unknown,
      unknown,
      { parentId: string | null; newName?: string }
    >,
    res: Response,
  ) => {
    const { parentId, newName: proposedName } = req.body;
    const node = req.node!;

    try {
      // Realizar el movimiento del nodo
      const result = await NodeService.moveNode(
        node,
        parentId || GLOBAL_ROOT_ID,
        proposedName,
      );

      // Mapear a DTO y enviar la respuesta
      res.success(
        Array.isArray(result)
          ? result.map((n) => toNodeLiteDTO(n))
          : toNodeLiteDTO(result),
      );
    } catch (err) {
      console.error(err);
      if (err instanceof AppError) throw err;
      else
        throw new AppError(
          "INTERNAL",
          `No se pudo mover el ${node.isDir ? "directorio" : "archivo"}`,
        );
    }
  };

  // Mover varios nodos
  static readonly bulkMoveNodes = async (
    req: Request<
      unknown,
      unknown,
      { parentId?: string | null; nodeIds: string[] }
    >,
    res: Response,
  ) => {
    const { parentId } = req.body;
    const nodes = req.nodes!;

    try {
      const movedNodes = await NodeService.bulkMoveNodes(
        nodes,
        parentId || GLOBAL_ROOT_ID,
      );

      res.success(movedNodes.map((n) => toNodeLiteDTO(n)));
    } catch (err) {
      console.error(err);
      if (err instanceof AppError) throw err;
      else
        throw new AppError("INTERNAL", "No se pudieron mover uno o más nodos");
    }
  };
}
