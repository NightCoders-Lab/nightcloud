/**
 * @description Sanitiza una consulta de búsqueda para que sea compatible con tsquery de PostgreSQL.
 * @param query La consulta de búsqueda original.
 * @returns La consulta sanitizada.
 */
export function sanitizeSearchQuery(query: string): string {
  if (!query) return "";

  return (
    query
      .trim()
      // Eliminar caracteres especiales de tsquery que podrían romper la sintaxis
      // Mantenemos solo letras, números, espacios y guiones
      .replaceAll(/[&|!:()<>]/g, "")
      // Comprimir espacios múltiples
      .replaceAll(/\s+/g, " ")
      // Reemplazar espacios por el operador AND (&)
      .split(" ")
      .join(" & ")
  );
}
