import { useEffect } from "react";
import { useSearch } from "./useSearch";
import { useLocation } from "react-router-dom";

/**
 * @description Hook para limpiar los resultados y la consulta de búsqueda al cambiar de ruta.
 */
export function useSearchCleanup() {
  const location = useLocation();
  const { setSearchResults, setSearchQuery } = useSearch();

  useEffect(() => {
    // Limpiar resultados de búsqueda y consulta al cambiar de ruta
    setSearchResults([]);
    setSearchQuery("");
  }, [location.pathname, setSearchResults, setSearchQuery]);
}
