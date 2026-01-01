import { DB } from "@/config/db";
import type { Blob } from "@/domain/blobs/blob";
import { fromPrismaBlob } from "@/infra/mappers/blob.mapper";
import type { PrismaBlobCreateInput } from "@/types/prisma";
import { isPrismaUniqueError } from "@/utils/prisma";

export class BlobRepository {
  private static readonly prisma = DB.getClient();

  /**
   * @description Crea un nuevo blob en la base de datos.
   * @param data Datos para crear el blob
   * @returns Blob creado
   */
  static async create(data: PrismaBlobCreateInput): Promise<Blob> {
    const res = await this.prisma.blob.create({ data });
    return fromPrismaBlob(res);
  }

  /**
   * @description Elimina un blob por su ID.
   * @param id ID del blob a eliminar
   */
  static async deleteById(id: Blob["id"]): Promise<void> {
    await this.prisma.blob.delete({ where: { id } });
  }

  /**
   * @description Asegura que un blob con el hash dado exista en la base de datos.
   * @param data Datos del blob a asegurar
   * @returns Blob existente o creado
   */
  static async ensureBlob(data: {
    hash: string;
    size: bigint;
    mime: string;
    storageKey: string;
  }): Promise<Blob> {
    let attempts = 0;
    const maxRetries = 3;

    while (true) {
      try {
        return await this.tryUpsert(data);
      } catch (err) {
        attempts++;

        // Si es error de unicidad, el blob YA existe. Lo buscamos y retornamos.
        // Esto es más rápido que reintentar el upsert.
        const existing = await this.recoverFromUniqueError(err, data.hash);
        if (existing) return existing;

        // Validamos si debemos reintentar o lanzar el error
        this.validateRetry(err, attempts, maxRetries);

        // Si fue un Deadlock, esperamos un poco (Backoff)
        // Espera aleatoria entre 50ms y 200ms para desincronizar los hilos que chocaron
        const delay = Math.floor(Math.random() * 150) + 50;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  private static async tryUpsert(data: {
    hash: string;
    size: bigint;
    mime: string;
    storageKey: string;
  }): Promise<Blob> {
    return await this.prisma.blob.upsert({
      where: { hash: data.hash },
      create: {
        hash: data.hash,
        size: data.size,
        mime: data.mime,
        storageKey: data.storageKey,
      },
      update: {}, // No hacemos nada si ya existe
    });
  }

  /**
   * @description Intenta recuperar un blob existente en caso de error de unicidad.
   * @param err Error ocurrido durante la operación
   * @param hash Hash del blob a buscar
   * @returns Blob existente o null si no existe
   */
  private static async recoverFromUniqueError(
    err: unknown,
    hash: string,
  ): Promise<Blob | null> {
    if (isPrismaUniqueError(err)) {
      return await this.prisma.blob.findUnique({
        where: { hash },
      });
    }
    return null;
  }

  /**
   * @description Valida si se debe reintentar la operación en caso de error.
   * @param err Error ocurrido durante la operación
   * @param attempts Número de intentos realizados
   * @param maxRetries Número máximo de reintentos permitidos
   */
  private static validateRetry(
    err: unknown,
    attempts: number,
    maxRetries: number,
  ): void {
    // Verificamos si es un error de deadlock
    const isDeadlock =
      (err as NodeJS.ErrnoException).code === "P2034" ||
      (err as NodeJS.ErrnoException).message?.includes("deadlock");

    // Si no es un error de deadlock, lanzamos el error
    if (!isDeadlock) {
      throw err;
    }

    // Si llegamos al límite de intentos, lanzamos el error
    if (attempts >= maxRetries) {
      throw err;
    }
  }

  /**
   * @description Busca un blob por su ID.
   * @param id ID del blob a buscar
   * @returns Blob encontrado o null si no existe
   */
  static async findById(id: Blob["id"]): Promise<Blob | null> {
    const res = await this.prisma.blob.findUnique({ where: { id } });
    return res ? fromPrismaBlob(res) : null;
  }

  /**
   * @description Obtiene blobs huérfanos, es decir, aquellos que no están asociados a ningún nodo y fueron creados antes de una fecha específica.
   * @param cutOffDate Fecha límite para considerar un blob como huérfano
   * @param limit Cantidad máxima de blobs a retornar
   * @returns Array de blobs huérfanos
   */
  static async getOrphanedBlobs(
    cutOffDate: Date,
    limit: number,
  ): Promise<Blob[]> {
    return await this.prisma.blob.findMany({
      where: {
        nodes: {
          none: {}, // Buscar los blobs que no tienen nodos asociados
        },
        createdAt: {
          lt: cutOffDate, // Y que fueron creados antes de la fecha establecida
        },
      },
      take: limit, // Limitar la cantidad de resultados
    });
  }
}
