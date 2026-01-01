import path from "node:path";

/**
 * @description Genera un nombre unico para un nodo basado en los nombres existentes.
 * @param targetName Nombre objetivo del nodo
 * @param existingNames Nombres existentes en el mismo directorio
 * @returns Nombre unico generado
 */
export function getNextName(targetName: string, existingNames: string[]) {
  // Obtener la extension y el nombre base del nodo
  const fileExt = path.extname(targetName);
  const fileBase = path.basename(targetName, fileExt);

  // Funcion para eliminar caracteres especiales en expresiones regulares
  const escapeRegex = (str: string) =>
    str.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);

  // Remover caracteres especiales del nombre base y extension
  const safeBase = escapeRegex(fileBase);
  const safeExt = escapeRegex(fileExt);

  // Crear patron para buscar nombres con sufijos numericos con el formato "nombre (n)"
  const pattern = new RegExp(
    String.raw`^${safeBase}(?: \((\d+)\))?${safeExt}$`,
    "i",
  );

  // Variables para rastrear el sufijo maximo y si la base existe
  let maxSuffix = 0;
  let exactMatchExists = false;

  for (const name of existingNames) {
    // Verificar si el nombre coincide con el patron
    const match = pattern.exec(name);
    console.log("Matching conflict name:", name, "->", match);

    // Si el nombre no coincide, continuar al siguiente
    if (!match) continue;

    if (name.toLowerCase() === targetName.toLowerCase()) {
      console.log("Exact match found for name:", name);
      exactMatchExists = true;
    } else if (match[1]) {
      console.log("Suffix found:", match[1]);
      maxSuffix = Math.max(maxSuffix, Number(match[1]));
    }
  }

  // Si no existe el nombre exacto,
  // retornar el nombre original
  if (!exactMatchExists) {
    return targetName;
  }

  // Si llegamos aqui, significa que hay conflictos
  // Retornamos el nuevo nombre con el sufijo incrementado en 1
  return `${fileBase} (${maxSuffix + 1})${fileExt}`;
}

/**
 * @description Genera un nuevo nombre incrementando el indice en 1
 * @param name Nombre original
 * @returns Nombre con indice incrementado
 */
export function getNextNameWithIndex(name: string): string {
  const match = new RegExp(/^(.*?)(?: \((\d+)\))?((?:\.[^.]+)*)$/).exec(name);

  if (!match) {
    // fallback ultra defensivo
    return `${name} (1)`;
  }

  const base = match[1];
  const currentIndex = match[2] ? Number(match[2]) : 0;
  const ext = match[3] ?? "";

  const nextIndex = currentIndex + 1;

  return `${base} (${nextIndex})${ext}`;
}
