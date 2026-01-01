import { useSearch } from "@/hooks/search/useSearch";
import { useSearchNode } from "@/hooks/search/useSearchNode";
import { useDebounce } from "@/hooks/useDebounce";
import { useEffect } from "react";
import { PiMagnifyingGlass, PiX } from "react-icons/pi";
import { useLocation } from "react-router-dom";

export default function Search() {
  const location = useLocation();
  const parentId = location.pathname.split("/").pop() || null; // Obtener el parentId de la URL
  // Obtener el estado y la acción para actualizar la consulta de búsqueda
  const { setSearchQuery, setSearchResults, searchQuery } = useSearch();

  // Agregar debounce para evitar búsquedas excesivas
  const debouncedSearch = useDebounce(searchQuery, 500);

  // Usar el hook de búsqueda de nodos
  useSearchNode({
    name: debouncedSearch,
    parentId: parentId ?? undefined,
    isEnabled: debouncedSearch.trim().length > 0,
    limit: 20,
  });

  // Limpiar resultados de búsqueda si la consulta está vacía
  useEffect(() => {
    if (searchQuery.trim().length === 0) {
      setSearchResults([]);
    }
  }, [searchQuery, setSearchResults]);

  return (
    <div className="relative w-120">
      <PiMagnifyingGlass
        size={18}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-night-muted"
      />
      <input
        type="text"
        value={searchQuery}
        className="bg-night-surface border border-night-border rounded-lg py-2 pl-10 pr-12 focus:outline-none focus:ring-2 focus:ring-night-primary focus:border-transparent w-120 text-night-text placeholder-night-muted"
        placeholder="Search..."
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      {searchQuery.trim().length > 0 && (
        <button
          className="absolute p-2 right-3 top-1/2 -translate-y-1/2 group text-night-muted cursor-pointer hover:text-night-text hover:bg-night-muted/10 rounded-full transition duration-200"
          onClick={() => setSearchQuery("")}
        >
          <PiX size={18} className="group-hover:text-night-text transition-colors duration-200" />
        </button>
      )}
    </div>
  );
}
