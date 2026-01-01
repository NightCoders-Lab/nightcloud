import { Prisma } from "@/infra/prisma/generated/client";

type PgErrorLike = {
  code?: unknown;
  originalCode?: unknown;
  cause?: PgErrorLike;
  meta?: {
    code?: unknown;
    cause?: PgErrorLike;
    driverAdapterError?: {
      cause?: PgErrorLike;
    };
  };
};

/**
 * @description Extrae el código de error PostgreSQL de un error Prisma si está disponible
 * @param err Error del cual extraer el código
 * @returns Código de error PostgreSQL o undefined si no está disponible
 */
export function extractPgCode(err: unknown): string | undefined {
  // Verificar que el error sea un objeto
  if (typeof err !== "object" || err === null) {
    return undefined;
  }

  // Castear el error a PgErrorLike para acceder a sus propiedades
  const e = err as PgErrorLike;

  // Intentar extraer el código de error PostgreSQL desde varias ubicaciones
  const code = // PostgreSQL real (driver)
    e?.meta?.driverAdapterError?.cause?.originalCode ??
    e?.meta?.cause?.originalCode ??
    e?.cause?.originalCode ??
    // A veces Prisma lo sube un nivel
    e?.meta?.code ??
    e?.cause?.code ??
    // Prisma (solo como fallback)
    e?.code;

  // Retornar el código si es una cadena o undefined
  return typeof code === "string" ? code : undefined;
}

/**
 * @description Verifica si un error es un error unique constraint de Prisma (código P2002)
 * @param err Error a verificar
 * @returns Verdadero si el error es un error unique constraint de Prisma, falso en caso contrario
 */
export function isPrismaUniqueError(
  err: unknown,
): err is Prisma.PrismaClientKnownRequestError {
  return (
    err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002"
  );
}

/**
 * @description Ejecuta una función con reintentos en caso de deadlock en una transaccion (código de error PostgreSQL 40P01)
 * @param fn Función a ejecutar
 * @param max Número máximo de reintentos (por defecto 5)
 * @returns Resultado de la función
 */
export async function withDeadlockRetry<T>(
  fn: () => Promise<T>,
  max = 5,
): Promise<T> {
  // Contador de intentos
  let attempt = 0;

  // Bucle de reintentos
  while (true) {
    // Incrementar el contador de intentos
    attempt++;

    // Intentar ejecutar la función
    try {
      console.log(`[deadlock-retry] attempt ${attempt}`);
      const res = await fn();
      console.log(`[deadlock-retry] success at attempt ${attempt}`);
      return res; // Retornar el resultado si tuvo éxito
    } catch (err) {
      // Obtener el código de error PostgreSQL si existe
      const pgCode = extractPgCode(err);

      console.error(
        `[deadlock-retry] error at attempt ${attempt}`,
        `pgCode=${pgCode}`,
      );

      // Si el error no es un deadlock o se alcanzó el máximo de reintentos, lanzar el error
      if (pgCode !== "40P01" || attempt >= max) {
        console.error(`[deadlock-retry] giving up`);
        throw err;
      }

      // Esperar un tiempo antes de reintentar (backoff exponencial con jitter)
      await new Promise((r) =>
        setTimeout(r, 20 * attempt + Math.random() * 30),
      );
    }
  }
}
