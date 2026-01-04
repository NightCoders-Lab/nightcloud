import type { FileWithPath } from "react-dropzone";

/**
 * @description Normaliza la ruta de un archivo teniendo en cuenta diferentes escenarios:
 * @param file El archivo cuyo path se desea normalizar
 * @returns La ruta normalizada del archivo
 */
export function normalizeFilePath(file: FileWithPath) {
  // Prioridad a la estructura real de carpeta (Input webkitdirectory)
  let finalPath = file.webkitRelativePath;

  // 2. Si no hay webkit, usamos el path del dropzone (Drag & Drop)
  if (!finalPath && file.path) {
    finalPath = file.path;
  }

  // Fallback al nombre del archivo si no hay ninguna de las dos anteriores
  if (!finalPath) {
    finalPath = file.name;
  }

  // Normalizar el path reemplazando backslashes de Windows (\) por (/)
  finalPath = finalPath.replaceAll("\\", "/");

  // Quitar puntos o slashes iniciales
  // ^      -> Al inicio del string
  // (\.|/)+ -> Uno o más puntos o slashes
  // Esto convierte "./foto.png", "/foto.png", o "///foto.png" a "foto.png"
  finalPath = finalPath.replace(/^(\.\/)+/, "");

  return finalPath;
}
