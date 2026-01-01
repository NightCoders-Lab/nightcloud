import { searchNodeByName } from "@/api/NodeAPI";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useSearch } from "./useSearch";

/**
 * @description Hook personalizado para buscar nodos por nombre
 * @param name Nombre a buscar
 * @param parentId ID del nodo padre (opcional)
 * @param limit Número máximo de resultados a retornar (por defecto 20)
 * @returns {object} Datos y estados de la búsqueda
 */
export function useSearchNode({
  name,
  parentId,
  isEnabled,
  limit,
}: {
  name: string;
  parentId?: string;
  isEnabled?: boolean;
  limit: number;
}) {
  const { setSearchResults } = useSearch();

  const { data, isLoading, error, isPlaceholderData } = useQuery({
    queryFn: () => searchNodeByName(name, parentId, limit),
    queryKey: ["nodes", "search", name.trim(), parentId ?? "global"],
    enabled: isEnabled, // Solo ejecutar si isEnabled es true
    placeholderData: (prevData) => prevData, // Usar datos previos como placeholder - evitar flashes de carga al quedarse sin datos
    retry: 2, // Reintentar 2 veces en caso de fallo
  });

  // Actualizar los resultados de búsqueda en el estado global cuando cambien los datos
  useEffect(() => {
    if (!data || data.length === 0) return;

    setSearchResults(data);
  }, [data, setSearchResults]);

  return {
    search: {
      data,
      isLoading,
      error,
      isPlaceholderData,
    },
  };
}
