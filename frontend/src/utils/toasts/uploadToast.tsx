import { toast, type Id } from "react-toastify";

/**
 * @description Crea un toast de subida de archivos
 * @returns {Id} ID del toast creado
 */
export function createUploadToast() {
  return toast.info("Preparing file upload…", {
    autoClose: false,
    closeOnClick: false,
    draggable: false,
    progress: 0,
  });
}

/**
 * @description Actualiza el toast de subida con el progreso y la función de cancelación
 * @param toastId ID del toast a actualizar
 * @param onCancel Función a ejecutar al cancelar la subida
 * @param percent Porcentaje de progreso de la subida
 */
export function updateUploadToast(
  toastId: Id,
  onCancel: () => void,
  percent: number
) {
  toast.update(toastId, {
    render: (
      <div className="flex items-center gap-6">
        <span>Uploading… {percent}%</span>
        <button
          onClick={onCancel}
          className="text-sm uppercase text-red-300 bg-red-900/30 hover:bg-red-900/50 hover:text-red-200 transition-colors duration-150 cursor-pointer p-2 rounded-md"
        >
          Cancel
        </button>
      </div>
    ),
    progress: percent / 100,
  });
}

/**
 * @description Muestra un toast de éxito al completar la subida
 * @param toastId ID del toast a actualizar
 */
export function successUploadToast(toastId: Id) {
  toast.update(toastId, {
    render: "Files uploaded successfully",
    type: "success",
    autoClose: 3000,
    progress: undefined,
  });
}

/**
 * @description Muestra un toast de cancelación de la subida
 * @param toastId ID del toast a actualizar
 */
export function cancelUploadToast(toastId: Id) {
  toast.update(toastId, {
    render: "File upload cancelled",
    type: "warning",
    isLoading: false,
    autoClose: 3000,
    progress: undefined,
  });
}

/**
 * @description Muestra un toast de error al fallar la subida
 * @param toastId ID del toast a actualizar
 */
export function errorUploadToast(toastId: Id) {
  toast.update(toastId, {
    render: "Error uploading files",
    type: "error",
    autoClose: 5000,
  });
}

/**
 * @description Muestra un toast de advertencia durante la subida
 * @param toastId ID del toast a actualizar
 * @param message Mensaje de advertencia a mostrar
 */
export function warningUploadToast(toastId: Id, message: string) {
  toast.update(toastId, {
    render: message,
    type: "warning",
    isLoading: false,
    autoClose: 5000,
    progress: undefined,
  });
}
