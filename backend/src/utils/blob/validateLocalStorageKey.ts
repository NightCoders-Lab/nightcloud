/**
 * @description Valida una clave de almacenamiento local.
 * @param key Clave de almacenamiento a validar
 * @returns boolean indica si la clave es válida o no
 */
export function validateLocalStorageKey(key: string): boolean {
  // Verificar que la clave no sea nula y sea una cadena
  if (!key || typeof key !== "string") return false;

  // Validar el storageKey contra el formato esperado
  const STORAGE_KEY_REGEX = /^([0-9a-f]{2})\/([0-9a-f]{2})\/([0-9a-f]{64})$/i;
  const match = new RegExp(STORAGE_KEY_REGEX).exec(key);
  if (!match) return false;

  // Extraer los componentes del storageKey
  const [, dir1, dir2, hash] = match;

  // Verificar que los directorios coincidan con el hash
  if (
    !hash.toLowerCase().startsWith(`${dir1.toLowerCase()}${dir2.toLowerCase()}`)
  ) {
    return false;
  }

  // Si todas las validaciones pasaron, la clave es válida
  return true;
}
