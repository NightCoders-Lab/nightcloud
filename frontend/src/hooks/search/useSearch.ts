import { useAppStore } from "@/stores/useAppStore";

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
