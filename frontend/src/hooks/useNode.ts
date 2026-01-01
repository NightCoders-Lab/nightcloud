import {
  getAncestorsOfNodeById,
  getDescendantsOfNodeById,
  getNodeDetails,
  getNodesFromDir,
  getNodesFromRoot,
} from "@/api/NodeAPI";
import type { NodeType } from "@/types";
import type { UseNodeMode } from "@/types/useNode.types";
import {
  EMPTY_NODE_QUERY_CONFIG,
  parseUseNodeMode,
} from "@/utils/node/parseUseNodeMode";
import { sortNodesByDir } from "@/utils/node/sortNodes";
import { useQuery } from "@tanstack/react-query";

// Función para obtener los hijos de un nodo o desde la raíz
const getChildrenQueryFn = (nodeId?: NodeType["id"]) =>
  nodeId ? () => getNodesFromDir(nodeId) : () => getNodesFromRoot();

/**
 * @description Hook personalizado para obtener datos de un nodo, sus hijos y ancestros
 * @param nodeId ID del nodo
 * @param mode Modo de consulta (qué datos cargar)
 * @returns {object} Datos y estados de carga/error
 */
export function useNode(nodeId: NodeType["id"] | undefined, mode: UseNodeMode) {
  // Configuración para determinar qué datos cargar
  const {
    node: includeNode,
    children: includeChildrens,
    ancestors: includeAncestors,
    descendants: includeDescendants,
  } = parseUseNodeMode(mode, EMPTY_NODE_QUERY_CONFIG);

  // Verificar si hay un nodeId válido
  const hasNodeId = Boolean(nodeId);

  // Datos y estados de la consulta del nodo actual
  const nodeQuery = useQuery({
    queryFn: () => getNodeDetails(nodeId!),
    queryKey: ["node", "details", nodeId],
    enabled: hasNodeId && includeNode, // Solo cargar si hay nodeId y se quiere el nodo
    placeholderData: (prevData) => prevData, // Usar datos previos como placeholder - evitar flashes de carga al quedarse sin datos
    retry: 1, // Reintentar una vez en caso de error
  });

  // Consulta para obtener los hijos si es necesario
  const childrenQuery = useQuery({
    queryFn: getChildrenQueryFn(nodeId),
    queryKey: ["nodes", nodeId ?? "root"],
    enabled: includeChildrens, // Solo cargar si se quieren hijos, independientemente de nodeId ya que puede ser root
    placeholderData: (prevData) => prevData, // Usar datos previos como placeholder - evitar flashes de carga al quedarse sin datos
    retry: 1, // Reintentar una vez en caso de error
  });

  // Consulta para obtener los ancestros si es necesario
  const ancestorsQuery = useQuery({
    queryFn: () => getAncestorsOfNodeById(nodeId!),
    queryKey: ["ancestors", nodeId],
    enabled: hasNodeId && includeAncestors, // Solo cargar si hay nodeId y se quieren ancestros
    placeholderData: (prevData) => prevData, // Usar datos previos como placeholders - evitar flashes de carga al quedarse sin datos
    retry: 1, // Reintentar una vez en caso de error
  });

  const descendantsQuery = useQuery({
    queryFn: () => getDescendantsOfNodeById(nodeId!),
    queryKey: ["descendants", nodeId],
    enabled: hasNodeId && includeDescendants, // Solo cargar si hay nodeId y se quieren descendientes
    placeholderData: (prevData) => prevData, // Usar datos previos como placeholders - evitar flashes de carga al quedarse sin datos
    retry: 1, // Reintentar una vez en caso de error
  });

  // Retornar los datos y estados de carga/error
  return {
    // Datos y estados del nodo actual
    node: {
      data: nodeQuery.data,
      loading: nodeQuery.isLoading,
      error: nodeQuery.error,
      isPlaceholderData: nodeQuery.isPlaceholderData,
    },

    // Solo incluir datos de hijos si se solicitó
    children: {
      data: childrenQuery.data ? sortNodesByDir(childrenQuery.data) : undefined,
      loading: includeChildrens ? childrenQuery.isLoading : false,
      error: includeChildrens ? childrenQuery.error : undefined,
      isPlaceholderData: includeChildrens
        ? childrenQuery.isPlaceholderData
        : false,
    },

    // Solo incluir datos de ancestros si se solicitó
    ancestors: {
      data: ancestorsQuery.data ?? undefined,
      loading: includeAncestors ? ancestorsQuery.isLoading : false,
      error: includeAncestors ? ancestorsQuery.error : undefined,
      isPlaceholderData: includeAncestors
        ? ancestorsQuery.isPlaceholderData
        : false,
    },

    // Solo incluir datos de descendientes si se solicitó
    descendants: {
      data: descendantsQuery.data ?? undefined,
      loading: includeDescendants ? descendantsQuery.isLoading : false,
      error: includeDescendants ? descendantsQuery.error : undefined,
      isPlaceholderData: includeDescendants
        ? descendantsQuery.isPlaceholderData
        : false,
    },
  };
}
