import fs from "node:fs/promises";
import path from "node:path";

// Directorio temporal de subidas
const TMP_DIR = path.resolve(process.cwd(), process.env.CLOUD_TMP || ".tmp");
// Edad máxima de los archivos temporales (15 minutos)
const MAX_FILE_AGE_MS =
  Number(process.env.CLOUD_TMP_FILE_AGE_LIMIT_MS) || 15 * 60 * 1000; // Tiempo por defecto: 15 minutos

export async function cleanupTmpUploads() {
  console.log("[cleanup]: Starting temporary uploads cleanup...");

  // Obtener el tiempo actual
  const now = Date.now();

  // Leer los archivos en el directorio temporal
  let files: string[];

  try {
    files = await fs.readdir(TMP_DIR);
  } catch {
    // Si no se puede leer el directorio, salir
    return;
  }

  // Iterar sobre los archivos y eliminar los que sean demasiado viejos
  for (const file of files) {
    // Ruta completa del archivo
    const filePath = path.join(TMP_DIR, file);

    // Obtener información del archivo
    try {
      // Verificar si es un archivo y su edad
      const stat = await fs.stat(filePath);
      if (!stat.isFile()) continue;

      // Calcular la edad del archivo
      const age = now - stat.mtimeMs;

      // Si el archivo es más viejo que el máximo permitido, eliminarlo
      // Ya que multer va escribiendo en stream, se puede calcular la ultima escritura/modificacion
      // Y en base a eso si ha pasado el tiempo limite desde que se escribio por ultima vez, se elimina
      // Esto evita eliminar archivos que aun se estan subiendo
      if (age > MAX_FILE_AGE_MS) {
        await fs.unlink(filePath);
        console.log(`[cleanup]: Deleted temp file: ${filePath}`);
      }
    } catch {
      // ignoramos los errores individuales
    }
  }

  console.log("[cleanup]: Temporary uploads cleanup completed.");
}
