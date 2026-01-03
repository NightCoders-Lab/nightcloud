import { useRef, useCallback, type MouseEvent } from "react";

// Definimos un tipo para el callback para no repetir código
type ClickCallback<T> = (event: MouseEvent<T>) => void;

interface UseClickHandlerProps<T> {
  onMouseDown?: ClickCallback<T>; // Agregamos este para encapsular la selección
  onSingleClick?: ClickCallback<T>;
  onDoubleClick?: ClickCallback<T>;
  delay?: number;
}

/**
 * @description Hook para manejar clicks simples y dobles en un elemento.
 * @param onSingleClick Ejecución del callback al hacer click simple
 * @param onDoubleClick Ejecución del callback al hacer doble click
 * @param delay Tiempo en ms para diferenciar entre click simple y doble click (por defecto 250ms)
 * @returns Objeto con los manejadores onClick y onDoubleClick
 */
export const useClickHandler = <T extends HTMLElement = HTMLDivElement>({
  onSingleClick,
  onDoubleClick,
  onMouseDown,
  delay = 250,
}: UseClickHandlerProps<T>) => {
  // Referencia para el timer
  const timer = useRef<number | null>(null);

  // Manejador del mouse down
  const handleMouseDown = useCallback(
    (event: MouseEvent<T>) => {
      if (onMouseDown) onMouseDown(event);
    },
    [onMouseDown]
  );

  // Manejador del click simple
  const handleClick = useCallback(
    (event: MouseEvent<T>) => {
      // Limpiamos timer previo si existe
      if (timer.current) clearTimeout(timer.current);

      // Iniciamos un nuevo timer para el click simple
      timer.current = setTimeout(() => {
        if (onSingleClick) onSingleClick(event);
        timer.current = null;
      }, delay);
    },
    [onSingleClick, delay]
  );

  // Manejador del doble click
  const handleDoubleClick = useCallback(
    (event: MouseEvent<T>) => {
      // Cancelamos el timer del click simple
      if (timer.current) {
        clearTimeout(timer.current);
        timer.current = null;
      }
      // Ejecutamos la acción inmediata
      if (onDoubleClick) onDoubleClick(event);
    },
    [onDoubleClick]
  );

  // Retornamos los manejadores
  return {
    onMouseDown: handleMouseDown,
    onClick: handleClick,
    onDoubleClick: handleDoubleClick,
  };
};
