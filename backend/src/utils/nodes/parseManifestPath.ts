/**
 * @description Parsea una ruta de manifiesto, normalizándola y dividiéndola en partes
 * @param path Ruta del manifiesto
 * @returns Objeto con indicador de directorio y partes de la ruta
 */
export default function parseManifestPath(path: string) {
  const normalized = path.replaceAll("\\", "/");

  const isDirectory = normalized.endsWith("/");

  const parts = normalized.split("/").filter(Boolean);

  return {
    isDirectory,
    parts,
  };
}
