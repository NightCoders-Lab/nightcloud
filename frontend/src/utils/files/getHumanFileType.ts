import capitalizeFirstLetter from "../capitalizeFirstLetter";
import { getCategoryFromMime } from "./getCategoryFromExtAndMime";

/**
 * @description Obtiene una representación legible por humanos del tipo de archivo basado en el MIME.
 * @param mime - El tipo MIME del archivo.
 * @returns Una cadena que representa el tipo de archivo en formato legible por humanos.
 */
export default function getHumanFileType(mime: string) {
  return mime === "inode/directory"
    ? "Folder"
    : capitalizeFirstLetter(getCategoryFromMime(mime));
}
