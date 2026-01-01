/**
 * @description Obtiene los elementos visibles de breadcrums, mostrando el primer elemento, una elipsis si es necesario, y los últimos N elementos.
 * @param items Lista de elementos de breadcrumb
 * @param tailCount Número de elementos al final a mostrar (incluyendo el actual)
 * @returns Objeto con los elementos visibles y un indicador de si hay una elipsis
 */
export function getVisibleBreadcrumbs<T>(
  items: T[], // Lista de elementos de breadcrumb
  tailCount = 2 // Número de elementos al final a mostrar (incluyendo el actual), por defecto 2
): { items: T[]; hasEllipsis: boolean } {
  // Si la cantidad de elementos es menor o igual a los que se deben mostrar, retornar todos
  // 2 (inicio + actual) = sin elipsis + tailCount (últimos N)
  if (items.length <= tailCount + 2) {
    // Retornar todos los elementos sin elipsis
    return { items, hasEllipsis: false };
  }

  // Si hay más elementos, retornar el primero, los últimos N y marcar que hay elipsis
  return {
    items: [
      items[0], // primer elemento
      ...items.slice(-tailCount - 1), // últimos N elementos (incluyendo el actual)
    ],
    hasEllipsis: true,
  };
}
