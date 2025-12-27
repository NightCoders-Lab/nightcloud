/**
 * @description Divide un array en chunks de tamaño especificado.
 * @param arr Array a dividir
 * @param size Tamaño de cada chunk
 * @returns Array de chunks
 */
export function chunk<T>(arr: T[], size: number): T[][] {
  // Resultado
  const res = [];

  // Iterar y crear chunks, agregándolos al resultado
  for (let i = 0; i < arr.length; i += size) {
    // Extraer el chunk y agregarlo al resultado
    res.push(arr.slice(i, i + size));
  }

  // Devolver el array de chunks
  return res;
}
