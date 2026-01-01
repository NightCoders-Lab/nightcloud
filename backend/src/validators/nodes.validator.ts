import { body, param, query } from "express-validator";

/**
 * Validadores para las rutas relacionadas con nodos (archivos y carpetas)
 */
export class NodeValidators {
  static readonly nodeIdValidator = [
    param("nodeId").isUUID(4).withMessage("Identificador de nodo inválido"),
  ];
  static readonly nodeIdsValidator = [
    body("nodeIds")
      .isArray({ min: 1, max: 100 })
      .withMessage("Se debe proporcionar un array de id de nodos válidos"),
    body("nodeIds.*")
      .isUUID(4)
      .withMessage("Cada nodeId debe ser un UUID válido"),
  ];
  static readonly nodeParentIdValidator = [
    body("parentId")
      .optional({ nullable: true })
      .isUUID(4)
      .withMessage("Identificador de nodo padre inválido"),
  ];
  static readonly nodeNewNameValidator = [
    ...this.nodeIdValidator,
    body("newName")
      .optional()
      .isString()
      .trim()
      .notEmpty()
      .withMessage("El nuevo nombre no puede ir vacío"),
  ];
  static readonly nodeCopyValidator = [
    ...this.nodeNewNameValidator,
    ...this.nodeParentIdValidator,
  ];
  static readonly nodeMoveValidator = [...this.nodeCopyValidator];
  static readonly nodeCreateValidator = [
    ...this.nodeParentIdValidator,
    body("name")
      .optional({ nullable: true })
      .isString()
      .trim()
      .isLength({ min: 1 })
      .withMessage("El nombre no puede ir vacio")
      .isLength({ max: 250 })
      .withMessage("El nombre no puede exceder los 250 carácteres"),
    body("isDir")
      .notEmpty()
      .withMessage("Se debe especificar si es un archivo o una carpeta")
      .isBoolean()
      .withMessage("El valor tiene que ser true o false"),
  ];
  static readonly nodeSearchValidator = [
    query("parentId")
      .optional({ nullable: true })
      .isUUID(4)
      .withMessage("Identificador de nodo padre inválido"),
    query("q")
      .isString()
      .trim()
      .notEmpty()
      .withMessage("El parámetro de búsqueda es inválido"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("El límite debe ser un número entre 1 y 100"),
  ];
  static readonly nodeBulkCopyValidator = [
    ...this.nodeParentIdValidator,
    ...this.nodeIdsValidator,
  ];
  static readonly nodeBulkMoveValidator = this.nodeBulkCopyValidator; // Mismo esquema de validación
  static readonly nodeBulkDeleteValidator = [...this.nodeIdsValidator];
}
