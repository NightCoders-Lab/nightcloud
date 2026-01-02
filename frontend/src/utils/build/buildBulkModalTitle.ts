
/**
 * @description Construye el título del modal para acciones masivas como copiar, mover o eliminar archivos y carpetas.
 * @param action "copy" | "move" | "delete"
 * @param files Cantidad de archivos seleccionados
 * @param folders Cantidad de carpetas seleccionadas
 * @returns Título del modal como cadena de texto
 */
export function buildBulkModalTitle(
  action: "copy" | "move" | "delete",
  files: number,
  folders: number
): string {
  let modalTitle = "";
  switch (action) {
    case "copy":
      modalTitle += "Copy ";
      break;
    case "move":
      modalTitle += "Move ";
      break;
    case "delete":
      modalTitle += "Delete ";
      break;
  }
  if (files > 0) {
    modalTitle += files === 1 ? "1 File " : `${files} Files `;
  }
  if (folders > 0) {
    if (files > 0) modalTitle += "and ";
    modalTitle += folders === 1 ? "1 Folder " : `${folders} Folders `;
  }
  return modalTitle.trim();
}
