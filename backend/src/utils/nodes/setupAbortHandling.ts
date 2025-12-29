import type { Request } from "express";

/**
 * @description Configura el manejo de abortos en la request
 * @param req Request
 * @returns Objeto con función para verificar si la request fue abortada y función de limpieza
 */
export function setupAbortHandling(
  req: Request<
    unknown,
    unknown,
    { parentId?: string | null; manifest?: unknown }
  >,
) {
  let aborted = false;

  const onAbort = () => {
    aborted = true;
  };

  req.on("aborted", onAbort);
  req.on("close", onAbort);

  const cleanup = () => {
    req.off("aborted", onAbort);
    req.off("close", onAbort);
  };

  return {
    isAborted: () => aborted,
    cleanup,
  };
}
