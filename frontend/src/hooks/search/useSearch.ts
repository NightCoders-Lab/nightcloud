import { useAppStore } from "@/stores/useAppStore";

/**
 * @description Hook para gestionar el estado y las acciones relacionadas con la búsqueda de nodos.
 * @returns Un objeto con el estado y las funciones de búsqueda.
 */
export function useSearch() {
  const {
    searchQuery,
    setSearchQuery,
    searchResults,
    setSearchResults,
    clearSearchResults,
  } = useAppStore();

  return {
    // Estado
    searchQuery,
    searchResults,

    // Acciones
    setSearchQuery,
    setSearchResults,
    clearSearchResults,
  };
}
