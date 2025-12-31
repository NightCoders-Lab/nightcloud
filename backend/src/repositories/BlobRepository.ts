import { DB } from "@/config/db";
import type { Blob } from "@/domain/blobs/blob";
import { fromPrismaBlob } from "@/infra/mappers/blob.mapper";
import type { PrismaBlobCreateInput } from "@/types/prisma";

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
   * @description Crea o actualiza un blob en la base de datos basado en su hash.
   * @param data Datos para crear o actualizar el blob
   * @returns Blob creado o actualizado
   */
  static async upsert(data: PrismaBlobCreateInput): Promise<Blob> {
    const res = await this.prisma.blob.upsert({
      where: { hash: data.hash },
      create: data,
      update: {},
    });
    return fromPrismaBlob(res);
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
