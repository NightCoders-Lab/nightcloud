/**
 * @description Combina las clases de CSS proporcionadas en una sola cadena, ignorando las clases falsas o indefinidas.
 * @param classes - Una lista de cadenas que representan las clases de CSS.
 * @returns Una sola cadena con las clases combinadas.
 */
export default function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}
