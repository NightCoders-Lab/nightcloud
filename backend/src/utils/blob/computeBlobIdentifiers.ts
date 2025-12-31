import crypto from "node:crypto";
import fs from "node:fs";
import { pipeline } from "node:stream/promises";

/**
 * @description Genera los identificadores de un blob (hash y storage key) a partir de su ruta en disco
 * @param filePath Ruta del archivo en disco
 * @returns Objeto con el hash y la storage key del blob
 */
export default async function computeBlobIdentifiers(filePath: string) {
  // Crear hash SHA256 del nodo
  const hash = crypto.createHash("sha256");

  // Leer el nodo en chunks para no saturar la memoria
  const input = fs.createReadStream(filePath);

  // Pipe del stream para evitar cargar la memoria
  await pipeline(input, hash);

  // Obtener el hash en formato hexadecimal
  const blobHash = hash.digest("hex");

  // Generar la key de almacenamiento en base al hash
  const p1 = blobHash.substring(0, 2); // Primeros dos caracteres
  const p2 = blobHash.substring(2, 4); // Siguientes dos caracteres
  const storageKey = `${p1}/${p2}/${blobHash}`; // Formato de key en carpetas

  // Retornar el hash en formato hexadecimal y agregarle la extension original
  return { blobHash, storageKey };
}
