/**
 * @description Capitaliza la primera letra de una cadena dada.
 * @param str - La cadena de entrada que se desea capitalizar.
 * @returns La cadena con la primera letra en mayúscula.
 */
export default function capitalizeFirstLetter(str: string) {
  // Handle empty or non-string inputs
  if (!str || typeof str !== "string") {
    return str;
  }

  return str.charAt(0).toUpperCase() + str.slice(1);
}
