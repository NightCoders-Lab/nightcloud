import { nodeSchema, nodeSearchSchema } from "@/types";
import type { DragRegistry } from "@/types/dragActions.types";
import { z } from "zod";

// Esquemas para validar los datos arrastrables (draggables) en la aplicación
const dndNodeSchema = nodeSchema.loose();
const dndNodeSearchShema = nodeSearchSchema.loose();

const draggableNodeSchema = z.union([dndNodeSchema, dndNodeSearchShema]);
const draggableNodesSchema = z.array(draggableNodeSchema);

// Guards para verificar si los datos corresponden a nodos arrastrables

export const isNodeDrag = (data: unknown): data is DragRegistry["node"] => {
  return draggableNodeSchema.safeParse(data).success;
};

export const isNodesDrag = (data: unknown): data is DragRegistry["nodes"] => {
  return draggableNodesSchema.safeParse(data).success;
};
