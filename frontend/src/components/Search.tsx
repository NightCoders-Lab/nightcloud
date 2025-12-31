import { useSearch } from "@/hooks/search/useSearch";
import { useSearchNode } from "@/hooks/search/useSearchNode";
import { useDebounce } from "@/hooks/useDebounce";
import { FiSearch } from "react-icons/fi";
import { useLocation } from "react-router-dom";

export default function Search() {
  const location = useLocation();
  const parentId = location.pathname.split("/").pop() || null; // Obtener el parentId de la URL
  // Obtener el estado y la acción para actualizar la consulta de búsqueda
  const { setSearchQuery, searchQuery } = useSearch();

  // Agregar debounce para evitar búsquedas excesivas
  const debouncedSearch = useDebounce(searchQuery, 500);

  // Usar el hook de búsqueda de nodos
  useSearchNode({
    name: debouncedSearch,
    parentId: parentId ?? undefined,
    isEnabled: debouncedSearch.trim().length > 0,
    limit: 20,
  });

  return (
    <div className="relative w-full">
      <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-night-muted" />
      <input
        type="text"
        value={searchQuery}
        className="bg-night-surface border border-night-border rounded-lg py-2 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-night-primary focus:border-transparent w-120 text-night-text placeholder-night-muted"
        placeholder="Search..."
        onChange={(e) => setSearchQuery(e.target.value)}
      />
    </div>
  );
}
