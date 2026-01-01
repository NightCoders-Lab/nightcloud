import { api } from "@/lib/axios";
import { nodesLiteSchema, type NodeLiteType, type NodeType } from "@/types";
import validateApiRes from "@/utils/validateApiRes";
import { isAxiosError } from "axios";

/**
 * @description Realiza la copia masiva de nodos a un directorio objetivo.
 * @param nodeIds Array de IDs de nodos a copiar
 * @param targetParentId ID del directorio objetivo donde se copiarán los nodos. Null para la raíz.
 * @returns El nodo copiado o una lista de nodos copiados.
 */
export async function bulkCopyNodes(
  nodeIds: NodeType["id"][],
  targetParentId: NodeType["id"] | null
): Promise<NodeLiteType | NodeLiteType[]> {
  try {
    const { data } = await api.post(`/nodes/bulk/copy`, {
      nodeIds,
      parentId: targetParentId,
    });
    const apiRes = nodesLiteSchema.safeParse(validateApiRes(data).data);

    if (apiRes.success) {
      return apiRes.data;
    } else {
      throw new Error("Error al copiar los nodos");
    }
  } catch (err) {
    if (isAxiosError(err) && err.response?.data.error) {
      throw new Error(err.response.data.error.message);
    } else throw err;
  }
}

/**
 * @description Realiza el movimiento masivo de nodos a un directorio objetivo.
 * @param nodeIds Array de IDs de nodos a mover
 * @param targetParentId ID del directorio objetivo donde se moverán los nodos. Null para la raíz.
 * @returns El nodo movido o una lista de nodos movidos.
 */
export async function bulkMoveNodes(
  nodeIds: NodeType["id"][],
  targetParentId: NodeType["id"] | null
): Promise<NodeLiteType | NodeLiteType[]> {
  try {
    const { data } = await api.post(`/nodes/bulk/move`, {
      nodeIds,
      parentId: targetParentId,
    });
    const apiRes = nodesLiteSchema.safeParse(validateApiRes(data).data);

    if (apiRes.success) {
      return apiRes.data;
    } else {
      throw new Error("Error al copiar el nodo");
    }
  } catch (err) {
    if (isAxiosError(err) && err.response?.data.error) {
      throw new Error(err.response.data.error.message);
    } else throw err;
  }
}

/**
 * @description Realiza la eliminación masiva de nodos.
 * @param nodeIds Array de IDs de nodos a eliminar
 */
export async function bulkDeleteNodes(nodeIds: NodeType["id"][]) {
  try {
    await api.post(`/nodes/bulk/delete`, {
      nodeIds,
    });
  } catch (err) {
    if (isAxiosError(err) && err.response?.data.error) {
      throw new Error(err.response.data.error.message);
    } else throw err;
  }
}
