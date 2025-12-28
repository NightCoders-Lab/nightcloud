import { Prisma } from "@/infra/prisma/generated/client";

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
