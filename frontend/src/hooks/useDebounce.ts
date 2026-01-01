import { useEffect, useState } from "react";

/**
 * @description Hook personalizado para manejar disparar cambios en un valor después de un retraso (debounce)
 * @param value Valor a "debounciar"
 * @param delay Retraso en milisegundos
 * @returns Valor con el retraso aplicado
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  // Actualizar el valor debounced después del retraso especificado
  useEffect(() => {
    // Configurar un temporizador para actualizar el valor debounced
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Limpiar el temporizador si el valor o el retraso cambian
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
