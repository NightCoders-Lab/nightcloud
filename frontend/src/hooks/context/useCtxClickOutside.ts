import { useEffect } from "react";

type useCtxClickOutsideProps<T extends HTMLElement> = {
  ref: React.RefObject<T | null>;
  onClose: () => void;
  enabled: boolean;
};

/**
 * @description Hook para detectar clics fuera de un elemento referenciado y ejecutar una función de cierre.
 * @param param0 Objeto con las propiedades: ref (referencia al elemento), onClose (función a ejecutar al hacer clic fuera) y enabled (booleano para habilitar/deshabilitar el hook)
 */
export function useCtxClickOutside<T extends HTMLElement>({
  ref,
  onClose,
  enabled,
}: useCtxClickOutsideProps<T>) {
  useEffect(() => {
    // Si no está habilitado, no hacemos nada
    if (!enabled) return;

    // Manejador del evento de click
    const handler = (event: MouseEvent) => {
      // Si el ref no está asignado, no hacemos nada
      if (!ref.current) return;
      // Si el click fue fuera del elemento referenciado, llamamos a onClose
      if (!ref.current.contains(event.target as Node)) {
        onClose();
      }
    };

    // Añadimos el listener al documento
    document.addEventListener("mousedown", handler);

    // Devolvemos un callback que limpiara el listener
    // al desmontar o cambiar dependencias
    return () => {
      document.removeEventListener("mousedown", handler);
    };
  }, [ref, onClose, enabled]);
}
