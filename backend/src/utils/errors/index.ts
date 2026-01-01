/**
 * Constantes de errores utilizados en la aplicación
 */
export const ERRORS = {
  BAD_REQUEST: { http: 400, msg: "Solicitud no valida" },
  NOT_FOUND: { http: 404, msg: "Ruta no encontrada" },
  INTERNAL: { http: 500, msg: "Error interno del servidor" },
  FILE_UPLOAD: { http: 400, msg: "Error al subir el archivo" },
  NO_FILES_UPLOADED: { http: 400, msg: "No se han subido archivos" },
  FILE_NOT_FOUND: { http: 404, msg: "Archivo no encontrado" },
  PARENT_NOT_FOUND: { http: 404, msg: "La carpeta especificada no existe" },
  NODE_NOT_FOUND: { http: 404, msg: "El recurso solicitado no existe" },
  FORBIDDEN: { http: 403, msg: "Acceso denegado" },
  DELETE_ROOT_NODE: {
    http: 400,
    msg: "No puedes eliminar la carpeta raíz",
  },
  NODE_IS_NOT_DIRECTORY: {
    http: 400,
    msg: "El nodo especificado no es un directorio",
  },
  NODES_NOT_FOUND: {
    http: 404,
    msg: "Uno o mas de los nodos especificados no fue encontrado",
  },
  COPY_NODE_ERROR: {
    http: 500,
    msg: "Error al copiar el nodo especificado",
  },
  INVALID_MANIFEST_FORMAT: {
    http: 400,
    msg: "El formato del manifiesto de subida es invalido",
  },
  MANIFEST_MISMATCH_ERROR: {
    http: 400,
    msg: "Ha ocurrido un error con la subida de archivos, intentalo de nuevo",
  },
  UPLOAD_ABORTED: {
    http: 499,
    msg: "La subida de archivos fue cancelada",
  },
} as const;
