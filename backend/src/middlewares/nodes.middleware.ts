import type { Request, Response, NextFunction } from "express";
import { MulterError } from "multer";

import { GLOBAL_ROOT_ID } from "@/config/constants";
import type { FileNodeWithBlob, Node } from "@/domain/nodes/node";
import { isDirectoryNode } from "@/infra/guards/node";
import { fromMulterFile } from "@/infra/upload/multer-file";
import { multerUpload } from "@/infra/upload/multer.upload";
import { NodeService } from "@/services/nodes/Node.service";
import { AppError, FsUtils, NodeUtils, toAppError } from "@/utils";

/**
 * @description Middleware para manejar la subida de archivos
 * @param req Request
 * @param res Response
 * @param next NextFunction
 */
export const nodeUpload = (req: Request, res: Response, next: NextFunction) => {
  // Configurar multer para manejar multiples archivos
  const upload = multerUpload.array(
    process.env.FRONTEND_FORM_FIELD_NAME ?? "file", // Default form field name "file"
    Number(process.env.CLOUD_MAX_UPLOAD_FILES) || 10, // Max 10 files
  );

  const { isAborted, cleanup } = NodeUtils.setupClientAbort(req);

  // Ejecutar el middleware de multer
  upload(req, res, (err: unknown) => {
    (async () => {
      // Remover el listener de abort ya que multer habra terminado a este punto
      cleanup();

      // Si la subida fue cancelada por el cliente, eliminar los archivos subidos
      // writableEnded se usa para verificar si la respuesta ya fue enviada
      if (isAborted() && req.files && !res.writableEnded) {
        console.log("Upload aborted by client, cleaning up files...");
        const files = req.files as Express.Multer.File[];
        await FsUtils.cleanupUploadedFiles(files);
        return next(new AppError("UPLOAD_ABORTED"));
      }

      // Manejar errores de multer y otros errores
      if (err instanceof MulterError) {
        return next(toAppError(err));
      }

      if (err instanceof AppError) {
        return next(err);
      }

      if (err) {
        console.log(err);
        return next(new AppError("INTERNAL"));
      }

      next();
    })().catch(next);
  });
};

/**
 * @description Middleware para procesar los archivos subidos y crear nodos en la base de datos
 * @param req Request
 * @param _res Response
 * @param next NextFunction
 */
export const nodeProcess = async (
  req: Request<unknown, unknown, { parentId: string; manifest?: unknown }>,
  _res: Response,
  next: NextFunction,
) => {
  // Asegurarse de que haya archivos subidos
  if (!req.files || (req.files as Express.Multer.File[]).length === 0)
    throw new AppError("NO_FILES_UPLOADED");

  // Configurar el manejo de abortos
  const { isAborted, cleanup } = NodeUtils.setupAbortHandling(req);

  try {
    // Convertir los archivos de Multer a UploadedFile
    const uploadedFiles = (req.files as Express.Multer.File[]).map(
      fromMulterFile,
    );

    // Parsear el manifiesto si existe
    const manifest = NodeUtils.parseManifest(
      req.body.manifest,
      uploadedFiles.length,
    );

    const results = await NodeService.processUploadedFiles(
      uploadedFiles,
      GLOBAL_ROOT_ID, // rootId por defecto
      req.body.parentId,
      manifest,
      isAborted,
    );

    // Adjuntar los nodos creados a la request para uso posterior
    req.nodes = results;
    next();
  } catch (err) {
    console.log(err);
    next(toAppError(err));
  } finally {
    cleanup();
  }
};

/**
 * @description Middleware para verificar si el padre de un nodo existe y no es un directorio
 * @param options Opciones para la verificación
 * @returns Middleware function
 */
export const nodeParentExists = (options: { includeBlob?: boolean } = {}) => {
  return async (
    req: Request<unknown, unknown, { parentId?: string | null }>,
    _res: Response,
    next: NextFunction,
  ) => {
    try {
      // Obtener el parentId de los query params
      const { parentId } = req.body;
      if (!parentId) return next(); // Si no hay parentId, no hay nada que verificar ya que seria redirigido al root

      // Buscar el nodo padre en la base de datos
      let parentNode: Node | FileNodeWithBlob;

      // Incluir blob si se especifica en las opciones
      if (options.includeBlob) {
        parentNode = await NodeService.getNodeDetails(parentId, {
          includeBlob: true,
        });
      } else {
        parentNode = await NodeService.getNodeDetails(parentId);
      }

      // Verificar que el nodo padre exista y sea un directorio
      if (!parentNode || !isDirectoryNode(parentNode)) {
        throw new AppError("PARENT_NOT_FOUND");
      }

      // Adjuntar el nodo padre a la request para uso posterior
      req.parent = parentNode;

      next();
    } catch (err) {
      // Manejar especificamente el caso de que el padre no exista
      if (err instanceof AppError && err.code !== "PARENT_NOT_FOUND") {
        throw new AppError("PARENT_NOT_FOUND");
      }
      next(toAppError(err));
    }
  };
};

/**
 * @description Middleware para verificar si un nodo existe en la base de datos
 * @param req Request
 * @param _res Response
 * @param next NextFunction
 */
export const nodeExists = (options: { includeBlob?: boolean } = {}) => {
  return async (
    req: Request<{ nodeId: string }>, // Se espera un parametro nodeId (validar despues con express-validator)
    _res: Response,
    next: NextFunction,
  ) => {
    try {
      // Obtener el nodeId de los parametros
      const { nodeId } = req.params;

      let node: Node | FileNodeWithBlob;

      // Buscar el nodo en la base de datos
      if (options.includeBlob) {
        // Incluir datos del blob si se especifica en las opciones
        node = await NodeService.getNodeDetails(nodeId, { includeBlob: true });
      } else {
        // Buscar sin incluir datos del blob
        node = await NodeService.getNodeDetails(nodeId);
      }

      // Adjuntar el nodo a la request para uso posterior
      req.node = node!;

      next();
    } catch (err) {
      next(toAppError(err));
    }
  };
};

/**
 * @remarks Utilizado mas que nada en operaciones bulk (mover, copiar, borrar multiples nodos)
 * @description Middleware para verificar si varios nodos existen en la base de datos
 * @param req Request
 * @param _res Response
 * @param next NextFunction
 */
export const nodesExistBulk = (options: { includeBlob?: boolean } = {}) => {
  return async (
    req: Request<unknown, unknown, { nodeIds: string[] }>, // Se espera un body con nodeIds
    _res: Response,
    next: NextFunction,
  ) => {
    try {
      // Obtener los nodeIds del body
      const { nodeIds } = req.body;

      let nodes: Node[] | FileNodeWithBlob[];

      // Buscar los nodos en la base de datos
      if (options.includeBlob) {
        // Incluir datos del blob si se especifica en las opciones
        nodes = await NodeService.getNodesDetailsBulk(nodeIds, {
          includeBlob: true,
        });
      } else {
        // Buscar sin incluir datos del blob
        nodes = await NodeService.getNodesDetailsBulk(nodeIds);
      }

      // Verificar que todos los nodos hayan sido encontrados
      const foundNodeIds = new Set(nodes.map((n) => n.id));
      const notFoundNodeIds = nodeIds.filter((id) => !foundNodeIds.has(id));

      if (notFoundNodeIds.length > 0) {
        throw new AppError("NODES_NOT_FOUND");
      }

      // Adjuntar los nodos a la request para uso posterior
      req.nodes = nodes;

      next();
    } catch (err) {
      next(toAppError(err));
    }
  };
};

/**
 * @remarks Sirve para parsear mas que nada los nodeIds del endpoint de download bulk
 * @description Middleware para parsear un array de nodeIds desde un string JSON en el body
 * @param req Request
 * @param _res Response
 * @param next NextFunction
 */
export const nodeParseBulkIds = (
  req: Request<unknown, unknown, { nodeIds: string[] }>,
  _res: Response,
  next: NextFunction,
) => {
  try {
    // Asegurarse de que nodeIds sea un string primero q nada
    if (typeof req.body?.nodeIds === "string") {
      // Intentar parsear el string como JSON
      try {
        req.body.nodeIds = JSON.parse(req.body.nodeIds) as string[];
      } catch {
        // dejar que el validator falle si no se puede parsear
      }
    }
    next();
  } catch (err) {
    console.log(err);
    next(toAppError(err));
  }
};
