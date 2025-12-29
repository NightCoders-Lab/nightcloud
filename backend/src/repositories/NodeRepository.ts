import { DB } from "@/config/db";
import type { Node } from "@/domain/nodes/node";
import { fromPrismaNode } from "@/infra/mappers/node.mapper";
import type { Prisma } from "@/infra/prisma/generated/client";
import type { PrismaTxClient } from "@/types/prisma";

const prisma = DB.getClient();

export class NodeRepository {
  /**
   * @description Crea un nuevo nodo en la base de datos
   * @param data Datos del nodo a crear
   * @returns Nodo creado
   */
  static async create(data: Prisma.NodeCreateInput): Promise<Node> {
    const res = await prisma.node.create({ data });
    return fromPrismaNode(res);
  }

  /**
   * @description Crea un nuevo nodo en la base de datos dentro de una transaccion
   * @param tx Transaccion de Prisma
   * @param data Datos del nodo a crear
   * @returns Nodo creado
   */
  static async createTx(
    tx: PrismaTxClient,
    data: Prisma.NodeCreateInput,
  ): Promise<Node> {
    const res = await tx.node.create({ data });
    return fromPrismaNode(res);
  }

  /**
   * @description Crea multiples nodos en la base de datos dentro de una transaccion
   * @param tx Transaccion de Prisma
   * @param data Lista de datos de nodos a crear
   * @returns BatchPayload con el resultado de la operacion
   */
  static async createManyTx(
    tx: PrismaTxClient,
    data: Prisma.NodeCreateManyInput[],
  ): Promise<Prisma.BatchPayload> {
    return await tx.node.createMany({ data });
  }

  /**
   * @description Elimina un nodo por su ID
   * @param id ID del nodo a eliminar
   */
  static async deleteById(id: Node["id"]) {
    await prisma.node.delete({
      where: { id },
    });
  }

  /**
   * @description Elimina multiples nodos por sus IDs
   * @param ids Lista de IDs de nodos a eliminar
   */
  static async deleteManyByIds(ids: Node["id"][]) {
    await prisma.node.deleteMany({
      where: {
        id: { in: ids },
      },
    });
  }

  /**
   * @description Elimina un nodo por su ID dentro de una transaccion
   * @param tx Transaccion de Prisma
   * @param id ID del nodo a eliminar
   */
  static async deleteByIdTx(tx: PrismaTxClient, id: Node["id"]) {
    await tx.node.delete({
      where: { id },
    });
  }

  /**
   * @description Elimina multiples nodos por sus IDs dentro de una transaccion
   * @param tx Transaccion de Prisma
   * @param ids Lista de IDs de nodos a eliminar
   */
  static async deleteManyByIdsTx(tx: PrismaTxClient, ids: Node["id"][]) {
    await tx.node.deleteMany({
      where: {
        id: { in: ids },
      },
    });
  }

  /**
   * @description Obtiene los metadatos de un nodo por su ID dentro de una transaccion
   * @param tx Transaccion de Prisma
   * @param id ID del nodo
   * @returns Metadatos del nodo
   */
  static async getNodeMetaByIdTx(
    tx: PrismaTxClient,
    id: Node["id"],
  ): Promise<Pick<Node, "parentId" | "size" | "mime" | "isDir"> | null> {
    const res = await tx.node.findUnique({
      where: { id },
      select: {
        parentId: true,
        size: true,
        mime: true,
        isDir: true,
      },
    });
    if (!res) return null;

    return {
      parentId: res.parentId,
      size: BigInt(res.size),
      mime: res.mime,
      isDir: res.isDir,
    };
  }

  /**
   * @description Busca nodos por su nombre utilizando la extension de búsqueda
   * @param parentId padre desde donde buscar (null para root)
   * @param nameQuery cadena de búsqueda
   * @param limit límite máximo de resultados a retornar
   * @returns Lista de nodos que coinciden con la búsqueda
   */
  static async search(
    parentId: Node["parentId"],
    nameQuery: string,
    limit?: number,
  ) {
    const res = await prisma.search({
      parentId,
      nameQuery,
      limit,
    });

    return res;
  }

  /**
   * @description Suma el tamaño de todos los nodos en la base de datos
   * @returns Suma total del tamaño de los nodos
   */
  static async sumNodesSize() {
    const res = await prisma.node.aggregate({
      _sum: {
        size: true,
      },
    });

    return BigInt(res._sum.size ?? 0);
  }

  /**
   * @description Actualiza el campo updatedAt de un nodo por su ID dentro de una transaccion
   * @param tx Transaccion de Prisma
   * @param id ID del nodo a actualizar
   */
  static async touchUpdatedAtByIdTx(tx: PrismaTxClient, id: Node["id"]) {
    await tx.node.update({
      where: { id },
      data: {
        updatedAt: new Date(),
      },
    });
  }

  /**
   * @description Actualiza el campo updatedAt de multiples nodos por sus IDs dentro de una transaccion
   * @param tx Transaccion de Prisma
   * @param ids Lista de IDs de nodos a actualizar
   */
  static async touchUpdatedAtByIdsTx(tx: PrismaTxClient, ids: Node["id"][]) {
    if (ids.length === 0) return;
    await tx.node.updateMany({
      where: { id: { in: ids } },
      data: {
        updatedAt: new Date(),
      },
    });
  }

  /**
   * @description Actualiza el nombre de un nodo por su ID dentro de una transaccion
   * @param tx Transaccion de Prisma
   * @param id ID del nodo a actualizar
   * @param newName Nuevo nombre para el nodo
   * @returns Nodo actualizado
   */
  static async updateNameByIdTx(
    tx: PrismaTxClient,
    id: Node["id"],
    newName: string,
  ) {
    const res = await tx.node.update({
      where: { id },
      data: {
        name: newName,
      },
    });

    return fromPrismaNode(res);
  }

  /**
   * @description Actualiza el nombre y hash de un nodo por su ID
   * @param tx Transaccion de Prisma
   * @param id ID del nodo a actualizar
   * @param identity Nuevo nombre y hash para el nodo
   * @returns Nodo actualizado
   */
  static async updateIdentityByIdTx(
    tx: PrismaTxClient,
    id: Node["id"],
    identity: { newName: string; newHash: string },
  ) {
    const res = await tx.node.update({
      where: { id },
      data: {
        name: identity.newName,
        hash: identity.newHash,
      },
    });

    return fromPrismaNode(res);
  }

  /**
   * @description Actualiza el nombre y hash de un nodo por su ID dentro de una transaccion
   * @param tx Transaccion de Prisma
   * @param id ID del nodo a actualizar
   * @param identity Nuevo nombre y hash para el nodo
   * @param newParentId Nuevo ID del nodo padre
   * @returns
   */
  static async updateIdentityAndParentIdByIdTx(
    tx: PrismaTxClient,
    id: Node["id"],
    identity: { newName: string; newHash: string },
    newParentId: string | null,
  ) {
    const res = await tx.node.update({
      where: { id },
      data: {
        name: identity.newName,
        hash: identity.newHash,
        parentId: newParentId,
      },
    });

    return fromPrismaNode(res);
  }

  /**
   * @description Encuentra un nodo por su ID
   * @param id ID del nodo a buscar
   * @returns Nodo encontrado o null
   */
  static async findById(id: Node["id"]) {
    const res = await prisma.node.findUnique({
      where: { id },
    });
    return res ? fromPrismaNode(res) : null;
  }

  /**
   * @description Encuentra multiples nodos por sus IDs
   * @param ids Lista de IDs de nodos a buscar
   * @returns Lista de nodos encontrados
   */
  static async findManyByIds(ids: Node["id"][]) {
    const res = await prisma.node.findMany({
      where: {
        id: { in: ids },
      },
    });
    return res.map(fromPrismaNode);
  }

  /**
   * @description Encuentra un nodo por su ID dentro de una transaccion
   * @param tx Transaccion de Prisma
   * @param id ID del nodo a buscar
   * @returns Nodo encontrado o null
   */
  static async findByIdTx(tx: PrismaTxClient, id: Node["id"]) {
    const res = await tx.node.findUnique({
      where: { id },
    });
    return res ? fromPrismaNode(res) : null;
  }

  /**
   * @description Encuentra nodos por su parentId
   * @param parentId ID del nodo padre
   * @returns Lista de nodos hijos
   */
  static async findByParentId(parentId: string | null) {
    const res = await prisma.node.findMany({
      where: {
        parentId,
      },
    });
    return res.map(fromPrismaNode);
  }

  /**
   * @description Encuentra nodos de tipo dir por su nombre dentro de una transaccion
   * @param tx Transaccion de Prisma
   * @param parentId ID del nodo padre
   * @param name Nombre del nodo a buscar
   * @returns Nodo encontrado o null
   */
  static async findDirByNameTx(
    tx: PrismaTxClient,
    parentId: Node["parentId"],
    name: string,
  ) {
    const res = await tx.node.findFirst({
      where: {
        parentId,
        name: {
          equals: name,
          mode: "insensitive",
        },
        isDir: true,
      },
    });
    return res ? fromPrismaNode(res) : null;
  }

  /**
   * @description Busca un nodo por su hash
   * @param hash Hash del nodo
   * @returns Nodo encontrado o null
   */
  static async findByHash(hash: string) {
    const res = await prisma.node.findFirst({
      where: { hash },
    });
    return res ? fromPrismaNode(res) : null;
  }

  /**
   * @description Busca un nodo por su hash
   * @param tx Transaccion de Prisma
   * @param hash Hash del nodo
   * @returns Nodo encontrado o null
   */
  static async findByHashTx(tx: PrismaTxClient, hash: string) {
    const res = await tx.node.findFirst({
      where: { hash },
    });
    return res ? fromPrismaNode(res) : null;
  }

  /**
   * @description Busca un nodo por su hash y parentId
   * @param hash Hash del nodo
   * @param parentId ID del nodo padre
   * @returns Nodo encontrado o null
   */
  static async findByHashAndParentId(
    hash: string,
    parentId: string | null,
  ): Promise<Node | null> {
    const res = await prisma.node.findFirst({
      where: {
        hash,
        parentId,
      },
    });
    return res ? fromPrismaNode(res) : null;
  }

  /**
   * @description Busca un nodo por su hash y parentId dentro de una transaccion
   * @param tx Transaccion de Prisma
   * @param hash Hash del nodo
   * @param parentId ID del nodo padre
   * @returns Nodo encontrado o null
   */
  static async findByHashAndParentIdTx(
    tx: PrismaTxClient,
    hash: string,
    parentId: string | null,
  ): Promise<Node | null> {
    const res = await tx.node.findFirst({
      where: {
        hash,
        parentId,
      },
    });
    return res ? fromPrismaNode(res) : null;
  }

  /**
   * @description Busca un nodo por su nombre y parentId
   * @param tx Transaccion de Prisma
   * @param name Nombre del nodo
   * @param parentId ID del nodo padre
   * @returns Nodo encontrado o null
   */
  static async findByNameAndParentIdTx(
    tx: PrismaTxClient,
    name: string, // Nombre del nodo a buscar
    parentId: string | null,
  ): Promise<Node | null> {
    const res = await tx.node.findFirst({
      where: {
        name: {
          equals: name,
          mode: "insensitive",
        },
        parentId,
      },
    });
    return res ? fromPrismaNode(res) : null;
  }

  /**
   * @remarks Si, se que utiliza una consulta raw y podria hacerse una extension de prisma, pero mientras no escale,
   * lo dejo asi para no complicar mas el codigo.
   * @description Busca nombres de nodos que entren en conflicto con una expresion regular dada.
   * @param parentId ID del nodo padre
   * @param regexPattern Expresion regular para buscar nombres en conflicto
   * @returns Lista de nombres en conflicto
   */
  static async findConflictingNames(
    parentId: string | null,
    regexPattern: string,
  ): Promise<Node["name"][]> {
    const rows = await prisma.$queryRaw<{ name: string }[]>`
      SELECT name
      FROM node
      WHERE "parentId" IS NOT DISTINCT FROM ${parentId}
        AND name ~* ${regexPattern} 
    `; // ~* : Case insensitive y patron de expresion regular en PostgreSQL

    return rows.map((r) => r.name);
  }

  /**
   * @remarks Si, se que utiliza una consulta raw y podria hacerse una extension de prisma, pero mientras no escale,
   * lo dejo asi para no complicar mas el codigo.
   * @description Busca nombres de nodos que entren en conflicto con una expresion regular dada dentro de una transaccion.
   * @param tx Transaccion de Prisma
   * @param parentId ID del nodo padre
   * @param regexPattern Expresion regular para buscar nombres en conflicto
   * @returns Lista de nombres en conflicto
   */
  static async findConflictingNamesTx(
    tx: PrismaTxClient,
    parentId: string | null,
    regexPattern: string,
  ): Promise<Node["name"][]> {
    const rows = await tx.$queryRaw<{ name: string }[]>`
      SELECT name
      FROM node
      WHERE "parentId" IS NOT DISTINCT FROM ${parentId}
        AND name ~* ${regexPattern} 
    `; // ~* : Case insensitive y patron de expresion regular en PostgreSQL

    return rows.map((r) => r.name);
  }

  /**
   * @description Detectar si hay conflicto de nombre en el mismo nivel de padre.
   * @param node Nodo de la BD que se le pasara
   * @param newName Nuevo nombre que se detectara si hay conflictos
   * @param ignoreNode Si se desea ignorar el nodo actual en la busqueda de conflictos
   * @returns boolean indicando si hay conflicto de nombres
   */
  static async findNameConflict(
    node: Node,
    newName?: string,
    ignoreNode: boolean = false,
  ) {
    const conflict = await prisma.node.findFirst({
      where: {
        parentId: node.parentId,
        name: {
          equals: newName ?? node.name,
          mode: "insensitive",
        },
        ...(ignoreNode
          ? {
              NOT: {
                id: node.id,
              },
            }
          : {}),
      },
    });

    return conflict !== null;
  }

  /**
   * @description Incrementa el tamaño de un nodo por su ID
   * @param id ID del nodo a incrementar
   * @param size Tamaño a incrementar del nodo
   * @returns Nodo con el tamaño actualizado
   */
  static async incrementSizeById(id: Node["id"], delta: bigint) {
    const res = await prisma.node.update({
      data: {
        size: {
          increment: delta,
        },
      },
      where: { id },
    });
    return fromPrismaNode(res);
  }

  /**
   * @description Incrementa el tamaño de un nodo por su ID dentro de una transaccion
   * @param tx Transaccion de Prisma
   * @param id ID del nodo a incrementar
   * @param delta Cantidad a incrementar
   * @returns Nodo actualizado
   */
  static async incrementSizeByIdTx(
    tx: PrismaTxClient,
    id: Node["id"],
    delta: bigint,
  ) {
    const res = await tx.node.update({
      data: {
        size: {
          increment: delta,
        },
      },
      where: { id },
    });
    return fromPrismaNode(res);
  }

  /**
   * @description Decrementa el tamaño de un nodo por su ID
   * @param id ID del nodo a decrementar
   * @param delta Cantidad a decrementar
   * @param isDir Indica si el nodo es un directorio
   * @returns Nodo con el tamaño actualizado
   */
  static async decrementSizeById(id: Node["id"], delta: bigint) {
    const res = await prisma.node.update({
      data: {
        size: {
          decrement: delta,
        },
      },
      where: { id },
    });
    return fromPrismaNode(res);
  }

  /**
   * @description Decrementa el tamaño de un nodo por su ID dentro de una transaccion
   * @param tx Transaccion de Prisma
   * @param id ID del nodo a decrementar
   * @param delta Cantidad a decrementar
   * @returns Nodo actualizado
   */
  static async decrementSizeByIdTx(
    tx: PrismaTxClient,
    id: Node["id"],
    delta: bigint,
  ) {
    const res = await tx.node.update({
      data: {
        size: {
          decrement: delta,
        },
      },
      where: { id },
    });
    return fromPrismaNode(res);
  }

  /**
   * @description Propaga el incremento o decremento de tamaño a los ancestros de un nodo
   * @param id ID del nodo desde el cual propagar el incremento/decremento
   * @param delta Incremento/Decremento de tamaño a propagar
   * @param mode "increment" | "decrement"
   */
  static async propagateSizeToAncestors(
    id: Node["id"],
    delta: bigint,
    mode: "increment" | "decrement",
  ): Promise<void> {
    // Obtener los ancestros del nodo
    const ancestors = await prisma.getAncestors(id);
    // console.log("Propagating size to ancestors:", ancestors);

    // Actualizar el tamaño de cada ancestro
    await prisma.node.updateMany({
      where: {
        id: { in: ancestors.map((a) => a.id) },
      },
      data: {
        size: {
          [mode]: delta, // Usar incremento o decremento segun el modo
        },
      },
    });
  }

  /**
   * @description Propaga el incremento o decremento de tamaño a los ancestros de un nodo
   * @param id ID del nodo desde el cual propagar el incremento/decremento
   * @param delta Incremento/Decremento de tamaño a propagar
   */
  static async propagateSizeToAncestorsTx(
    tx: PrismaTxClient,
    id: Node["id"],
    delta: bigint,
    mode: "increment" | "decrement",
  ): Promise<void> {
    // Obtener los ancestros del nodo
    const ancestors = await tx.getAncestors(id);
    // console.log("Propagating size to ancestors:", ancestors);

    // Actualizar el tamaño de cada ancestro
    await tx.node.updateMany({
      where: {
        id: { in: ancestors.map((a) => a.id) },
      },
      data: {
        size: {
          [mode]: delta, // Usar incremento o decremento segun el modo
        },
      },
    });
  }

  /**
   * @remarks La funcion getAncestors es una queryRaw de una funcion almacenada optimizada
   * Es la forma mas eficiente de obtener todos los ancestros en una sola consulta.
   * @description Obtiene todos los ancestros de un nodo dado.
   * @param tx Transaccion de Prisma
   * @param startNodeId ID del nodo desde el cual comenzar a buscar ancestros
   * @returns Lista de ancestros con sus IDs y parentIds
   */
  static async getAllNodeAncestors(startNodeId: Node["id"]) {
    return await prisma.getAncestors(startNodeId);
  }

  /**
   * @remarks La funcion getAncestors es una queryRaw de una funcion almacenada optimizada
   * Es la forma mas eficiente de obtener todos los ancestros en una sola consulta.
   * @description Obtiene todos los ancestros de un nodo
   * @param tx  Transaccion de Prisma
   * @param startNodeId ID del nodo desde el cual comenzar a buscar ancestros
   * @returns Lista de ancestros con sus IDs y parentIds
   */
  static async getAllNodeAncestorsTx(
    tx: PrismaTxClient,
    startNodeId: Node["id"],
  ) {
    return await tx.getAncestors(startNodeId);
  }

  /**
   * @description Obtiene todos los ancestros de multiples nodos
   * @param rootNodeIds IDs de los nodos raíz desde los cuales comenzar a buscar ancestros
   * @returns Lista de ancestros con sus IDs y parentIds
   */
  static async getAllNodeAncestorsBulk(rootNodeIds: Node["id"][]) {
    return await prisma.getAncestorsBulk(rootNodeIds);
  }

  /**
   * @description Obtiene todos los ancestros de multiples nodos dentro de una transaccion
   * @param tx Transaccion de Prisma
   * @param rootNodeIds IDs de los nodos raíz desde los cuales comenzar a buscar ancestros
   * @returns Lista de ancestros con sus IDs y parentIds
   */
  static async getAllNodeAncestorsBulkTx(
    tx: PrismaTxClient,
    rootNodeIds: Node["id"][],
  ) {
    return await tx.getAncestorsBulk(rootNodeIds);
  }

  /**
   * @remarks La funcion getDescendants es una queryRaw de una funcion almacenada optimizada
   * Es la forma mas eficiente de obtener todos los descendientes en una sola consulta.
   * @description Obtiene todos los descendientes de un nodo dado.
   * @param startNodeId ID del nodo desde el cual comenzar a buscar descendientes
   * @returns Lista de descendientes
   */
  static async getAllNodeDescendants(startNodeId: Node["id"]) {
    return await prisma.getDescendants(startNodeId);
  }

  /**
   * @remarks La funcion getDescendants es una queryRaw de una funcion almacenada optimizada
   * Es la forma mas eficiente de obtener todos los descendientes en una sola consulta.
   * @description Obtiene todos los descendientes de un nodo dado dentro de una transaccion.
   * @param tx Transaccion de Prisma
   * @param startNodeId ID del nodo desde el cual comenzar a buscar descendientes
   * @returns Lista de descendientes
   */
  static async getAllNodeDescendantsTx(
    tx: PrismaTxClient,
    startNodeId: Node["id"],
  ) {
    return await tx.getDescendants(startNodeId);
  }

  /**
   * @description Obtiene todos los descendientes de multiples nodos
   * @param rootNodeIds IDs de los nodos raíz desde los cuales comenzar a buscar descendientes
   * @returns Lista de descendientes
   */
  static async getAllNodeDescendantsBulk(rootNodeIds: Node["id"][]) {
    return await prisma.getDescendantsBulk(rootNodeIds);
  }

  /**
   * @description Obtiene todos los descendientes de multiples nodos dentro de una transaccion
   * @param tx Transaccion de Prisma
   * @param rootNodeIds IDs de los nodos raíz desde los cuales comenzar a buscar descendientes
   * @returns Lista de descendientes
   */
  static async getAllNodeDescendantsBulkTx(
    tx: PrismaTxClient,
    rootNodeIds: Node["id"][],
  ) {
    return await tx.getDescendantsBulk(rootNodeIds);
  }

  /**
   * !
   * @warning ESTA FUNCION TIENE UN COSTE DE 2N CONSULTAS A LA BD, USAR CON MUCHO MAS CUIDADO.
   * @description Ejecuta un callback para cada ancestro de un nodo dado.
   * @param tx Transaccion de Prisma
   * @param startNodeId ID del nodo desde el cual comenzar a buscar ancestros
   * @param callback Funcion a ejecutar para cada ancestro encontrado
   */
  static async forEachAncestor(
    tx: PrismaTxClient,
    startNodeId: Node["id"],
    callback: (ancestor: Pick<Node, "id" | "parentId">) => Promise<void>,
  ) {
    // Recorrer hacia arriba en la jerarquia hasta la raiz
    let currentNodeId: string | null = startNodeId;

    // Mientras haya un nodo actual
    while (currentNodeId) {
      // Obtener el nodo padre actual
      const parent: Pick<Node, "id" | "parentId"> | null =
        await tx.node.findUnique({
          where: { id: currentNodeId },
          select: {
            id: true,
            parentId: true,
          },
        });

      // Si no hay padre, quiere decir que llegamos a la raiz
      if (!parent) break;

      // Ejecutar el callback con el padre actual
      await callback(parent);

      // Actualizar el ID del nodo actual al ID del padre para la siguiente iteracion
      currentNodeId = parent.parentId;
    }
  }
}
