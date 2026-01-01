import { Router } from "express";

import { NodeController } from "@/controllers/Node.controller";
import {
  nodeProcess,
  nodeUpload,
  nodeExists,
  validateRequest,
} from "@/middlewares";
import {
  nodeParentExists,
  nodeParseBulkIds,
  nodesExistBulk,
} from "@/middlewares/nodes.middleware";
import { NodeValidators } from "@/validators";

/**
 * Rutas para la gestión de nodos (archivos/carpetas)
 */
const router = Router();

// Endpoint para subir nodos (archivos/carpetas)
router.post(
  "/upload",
  NodeValidators.nodeParentIdValidator,
  validateRequest,
  nodeUpload,
  nodeParentExists(),
  nodeProcess,
  NodeController.uploadNodes,
);

// Buscar nodos por nombre
router.get(
  "/search",
  NodeValidators.nodeSearchValidator,
  validateRequest,
  NodeController.searchNode,
);

// Crear un nodo (archivo/carpeta)
router.post(
  "/",
  NodeValidators.nodeCreateValidator,
  validateRequest,
  NodeController.createNode,
);

// Obtener nodos desde la raíz de la nube (/cloud)
router.get("/", NodeController.getNodesFromRoot);

// -----------------
// Operaciones bulk
// -----------------

// Descargar varios nodos
router.post(
  "/bulk/download",
  nodeParseBulkIds,
  NodeValidators.nodeIdsValidator,
  validateRequest,
  nodesExistBulk({ includeBlob: true }),
  NodeController.bulkDownloadNodes,
);

// Copiar varios nodos
router.post(
  "/bulk/copy",
  NodeValidators.nodeBulkCopyValidator,
  validateRequest,
  nodesExistBulk(),
  NodeController.bulkCopyNodes,
);

// Mover varios nodos
router.post(
  "/bulk/move",
  NodeValidators.nodeBulkMoveValidator,
  validateRequest,
  nodesExistBulk(),
  NodeController.bulkMoveNodes,
);

// Borrar varios nodos
router.post(
  "/bulk/delete",
  NodeValidators.nodeBulkDeleteValidator,
  validateRequest,
  nodesExistBulk(),
  NodeController.bulkDeleteNodes,
);

// -----------------
// Operaciones single
// -----------------

// Descargar nodo por ID
router.get(
  "/download/:nodeId",
  NodeValidators.nodeIdValidator, // Validation chain
  validateRequest, // Validate any errors from express-validator
  nodeExists({ includeBlob: true }),
  NodeController.downloadNode,
);

// Obtener ancestros de un nodo por ID
router.get(
  "/:nodeId/ancestors",
  NodeValidators.nodeIdValidator,
  validateRequest,
  nodeExists(),
  NodeController.getNodeAncestors,
);

// Obtener descendientes de un nodo por ID
router.get(
  "/:nodeId/descendants",
  NodeValidators.nodeIdValidator,
  validateRequest,
  nodeExists(),
  NodeController.getNodeDescendants,
);

// Renombrar nodo por ID
router.patch(
  "/:nodeId/rename",
  NodeValidators.nodeNewNameValidator,
  validateRequest,
  nodeExists(),
  NodeController.renameNode,
);

// Copiar nodo por ID
router.post(
  "/:nodeId/copy",
  NodeValidators.nodeCopyValidator,
  validateRequest,
  nodeExists(),
  NodeController.copyNode,
);

// Mover nodo por ID
router.post(
  "/:nodeId/move",
  NodeValidators.nodeMoveValidator,
  validateRequest,
  nodeExists(),
  NodeController.moveNode,
);

// Obtener detalles de un nodo por ID
router.get(
  "/:nodeId/details",
  NodeValidators.nodeCopyValidator,
  validateRequest,
  nodeExists(),
  NodeController.getNodeDetails,
);

// Obtener nodos de un directorio en especifico
router.get(
  "/:nodeId",
  NodeValidators.nodeIdValidator, // Validation chain
  validateRequest, // Validate any errors from express-validator
  nodeExists(),
  NodeController.getNodesFromDirectory,
);

// Borrar nodo por ID
router.delete(
  "/:nodeId",
  NodeValidators.nodeIdValidator, // Validation chain
  validateRequest, // Validate any errors from express-validator
  nodeExists(),
  NodeController.deleteNode,
);

export default router;
