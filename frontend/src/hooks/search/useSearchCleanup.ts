import { useEffect } from "react";
import { useSearch } from "./useSearch";
import { useLocation } from "react-router-dom";

export function useSearchCleanup() {
  const location = useLocation();
  const { setSearchResults, setSearchQuery } = useSearch();

  useEffect(() => {
    // Limpiar resultados de búsqueda y consulta al cambiar de ruta
    setSearchResults([]);
    setSearchQuery("");
  }, [location.pathname, setSearchResults, setSearchQuery]);
}
