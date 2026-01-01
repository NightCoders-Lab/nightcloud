import {
  NODE_QUERY_MODES,
  type NodeQueryFlag,
  type UseNodeMode,
} from "@/types/useNode.types";

export type NodeQueryConfig = Record<NodeQueryFlag, boolean>;

export const EMPTY_NODE_QUERY_CONFIG: NodeQueryConfig = {
  node: false,
  children: false,
  ancestors: false,
  descendants: false,
};

/**
 * @description Parsea el modo de uso de un nodo y devuelve una configuración de consulta
 * @param mode Modo de uso del nodo
 * @param baseConfig Configuración base para la consulta
 * @returns {NodeQueryConfig} Configuración de consulta con los flags correspondientes activados
 */
export function parseUseNodeMode(
  mode: UseNodeMode,
  baseConfig: NodeQueryConfig
): NodeQueryConfig {
  const flags: readonly NodeQueryFlag[] =
    mode === "all" ? NODE_QUERY_MODES : (mode.split("+") as NodeQueryFlag[]);

  return flags.reduce<NodeQueryConfig>(
    (acc, key) => ({ ...acc, [key]: true }),
    {
      ...baseConfig,
    }
  );
}
