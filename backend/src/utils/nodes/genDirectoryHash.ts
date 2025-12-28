import crypto from "node:crypto";

/**
 * @description Genera un hash único para un directorio basado en su UUID.
 * @param nodeUUID UUID del nodo
 * @returns string Hash generado
 */
export default function genDirectoryHash(nodeUUID: string) {
  // Crear hash SHA256 del nodo
  const hash = crypto.createHash("sha256");

  // Actualizar el hash con el UUID del nodo
  hash.update(nodeUUID);

  // Retornar el hash en formato hexadecimal y agregar o no la extension original
  return hash.digest("hex");
}
