import { z } from "zod";

// ----------------------------------
// Schemas de validación
// ----------------------------------

// Schema para respuestas estandarizadas de la API
export const apiResponseSchema = z.object({
  ok: z.boolean(),
  data: z
    .union([z.record(z.any(), z.any()), z.array(z.record(z.any(), z.any()))])
    .optional(),
  error: z
    .object({
      code: z.string(),
      message: z.string(),
    })
    .optional(),
  errors: z
    .array(
      z.object({
        type: z.string(),
        msg: z.string(),
        value: z.string(),
        path: z.string().optional(),
        location: z.string().optional(),
      })
    )
    .optional(),
});

// Schema para ancestros de un nodo
export const ancestorSchema = z.object({
  id: z.uuidv4(),
  parentId: z.uuid().nullable(),
  rootId: z.uuid(),
  name: z.string().min(1).max(250),
  size: z.string(),
  mime: z.string(),
  isDir: z.boolean(),
  depth: z.number().min(0),
});

// Schema para una lista de ancestros
export const ancestorsSchema = z.array(ancestorSchema);

// Schema para descendientes de un nodo (idéntico al de ancestros)
export const descendantSchema = ancestorSchema;

// Schema para una lista de descendientes
export const descendantsSchema = z.array(descendantSchema);

// Schema para un nodo lite (sin timestamps)
export const nodeLiteSchema = ancestorSchema.omit({
  depth: true,
});

// Schema para una lista de nodos lite
export const nodesLiteSchema = z.array(nodeLiteSchema);

// Schema que puede ser un nodo lite o una lista de nodos lite
export const nodesOrNodeLiteSchema = z.union([nodesLiteSchema, nodeLiteSchema]);

// Schema para un nodo completo
export const nodeSchema = ancestorSchema
  .extend({
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .omit({ depth: true });

// Schema para una lista de nodos
export const nodesSchema = z.array(nodeSchema);

// Schema que puede ser un nodo o una lista de nodos
export const nodesOrNodeSchema = z.union([nodesSchema, nodeSchema]);

export const cloudStatsSchema = z.object({
  disk: z.object({
    total: z.string(),
    used: z.string(),
    free: z.string(),
  }),
  cloud: z.object({
    used: z.string(),
    available: z.string(),
  }),
  other: z.object({
    used: z.string(),
  }),
});

// ----------------------------------
// Types derivados de los schemas
// ----------------------------------

export type ApiResponseType = z.infer<typeof apiResponseSchema>;
export type NodeType = z.infer<typeof nodeSchema>;
export type NodeLiteType = z.infer<typeof nodeLiteSchema>;
export type AncestorType = z.infer<typeof ancestorSchema>;
export type DescendantType = z.infer<typeof descendantSchema>;
export type CloudStatsType = z.infer<typeof cloudStatsSchema>;

// ----------------------------------
// Types para formularios basados
// en los derivados de los schemas
// ----------------------------------

// Type para el formulario de creación de carpetas
export type NodeFolderFormData = Pick<NodeType, "name">;

// Type para el formulario de renombrado de nodos
export type NodeRenameFormData = Pick<NodeType, "name">;

// Type para el formulario de copiado de nodos (idk en el backend es obligatorio cambiarlo en un futuro a opcional)
export type NodeCopyFormData = Pick<NodeType, "name">;

// Type para el formulario de movida de nodos (en realidad el nombre es opcional)
export type NodeMoveFormData = Pick<NodeType, "name">;

// ----------------------------------
// Otros types
// ----------------------------------

// Type para la dirección de ordenamiento
export type SortDirection = "asc" | "desc";
