/**
 * @description Convierte una cantidad de bytes en una cadena legible por humanos.
 * @param bytes - La cantidad de bytes a convertir. Puede ser un número, una cadena o un BigInt.
 * @param decimals - El número de decimales a mostrar
 * @returns Una cadena que representa el tamaño del archivo en una unidad legible por humanos.
 */
export default function getHumanFileSize(
  bytes: number | string | bigint,
  decimals: number = 2
): string {
  // Convertimos a número flotante para manejar la división y logaritmos
  const value = Number(bytes);

  // Validaciones básicas
  if (value <= 0 || Number.isNaN(value)) {
    return "—";
  }

  const k = 1024;
  const dm = Math.max(decimals, 0);
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

  // Calculamos el índice de la unidad (0 = Bytes, 1 = KB, etc.)
  const i = Math.floor(Math.log(value) / Math.log(k));

  // Prevenimos desbordamiento del array si el número es absurdamente grande
  if (i >= sizes.length) return "> YB";

  return `${Number.parseFloat((value / Math.pow(k, i)).toFixed(dm))} ${
    sizes[i]
  }`;
}
