import type { Request } from "express";

/**
 * @description Configura el manejo de abortos por parte del cliente en la request
 * @param req Request
 * @returns Objeto con función para verificar si la request fue abortada y función de limpieza
 */
export function setupClientAbort(req: Request) {
  let aborted = false;

  const onAbort = () => {
    aborted = true;
  };

  req.on("aborted", onAbort);

  const cleanup = () => {
    req.off("aborted", onAbort);
  };

  return {
    isAborted: () => aborted,
    cleanup,
  };
}
