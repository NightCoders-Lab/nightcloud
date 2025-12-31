-- Limpieza preventiva
DROP FUNCTION IF EXISTS public.get_descendants_with_blob (uuid);

DROP FUNCTION IF EXISTS public.get_descendants_bulk_with_blob(uuid[]);

-- ============================================================
-- GET DESCENDANTS WITH BLOB (Single Node)
-- Optimizado para descarga de un solo directorio (ZIP)
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_descendants_with_blob(start_node_id uuid)
RETURNS TABLE(
  -- Campos del Nodo
  id uuid,
  "parentId" uuid,
  "rootId" uuid,
  name text,
  "isDir" boolean,
  "blobId" uuid,
  size bigint,
  mime text,
  depth integer,
  "startNodeId" uuid,       -- ID de la carpeta raíz seleccionada por el usuario
  -- Campos del Blob (Future-proof)
  "blobHash" text,
  "storageKey" text,
  "storageType" text,
  "blobSize" bigint,        -- Tamaño físico real
  "blobCreatedAt" timestamp(3) -- Para auditoría o cache
)
LANGUAGE sql
STABLE
AS $function$
  WITH RECURSIVE descendants AS (
    -- Nivel 0 (Raíz)
    SELECT
      n."id",
      n."parentId",
      n."rootId",
      n."name",
      n."isDir",
      n."blobId",
      n."size",
      n."mime",
      0 AS depth,
      n."id" AS "startNodeId" -- Marcamos el inicio
    FROM "node" n
    WHERE n."id" = start_node_id

    UNION ALL

    -- Recursividad (Hijos)
    SELECT
      n."id",
      n."parentId",
      n."rootId",
      n."name",
      n."isDir",
      n."blobId",
      n."size",
      n."mime",
      d.depth + 1,
      d."startNodeId" -- Propagamos el ID de inicio
    FROM "node" n
    JOIN descendants d ON n."parentId" = d."id"
  )
  SELECT
    d.id,
    d."parentId",
    d."rootId",
    d.name,
    d."isDir",
    d."blobId",
    d.size,
    d.mime,
    d.depth,
    d."startNodeId",
    -- Datos del Blob (LEFT JOIN para incluir carpetas vacías)
    b.hash AS "blobHash",
    b."storageKey",
    b."storageType",
    b.size AS "blobSize",
    b."createdAt" AS "blobCreatedAt"
  FROM descendants d
  LEFT JOIN "blob" b ON d."blobId" = b.id
  ORDER BY d.depth;
$function$;

-- ============================================================
-- GET DESCENDANTS BULK WITH BLOB (Multiple Nodes)
-- Optimizado para descarga masiva de selección (Multi-Select Download)
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_descendants_bulk_with_blob(start_node_ids uuid[])
RETURNS TABLE(
  -- Campos del Nodo
  id uuid,
  "parentId" uuid,
  "rootId" uuid,
  name text,
  "isDir" boolean,
  "blobId" uuid,
  size bigint,
  mime text,
  depth integer,
  "startNodeId" uuid,       -- ID de la carpeta raíz seleccionada por el usuario
  -- Campos del Blob
  "blobHash" text,
  "storageKey" text,
  "storageType" text,
  "blobSize" bigint,
  "blobCreatedAt" timestamp(3)
)
LANGUAGE sql
STABLE
AS $function$
  WITH RECURSIVE descendants AS (
    -- Nivel 0 (Selección múltiple)
    SELECT
      n."id",
      n."parentId",
      n."rootId",
      n."name",
      n."isDir",
      n."blobId",
      n."size",
      n."mime",
      0 AS depth,
      n."id" AS "startNodeId" -- Rastreamos de cuál selección vino
    FROM "node" n
    WHERE n."id" = ANY(start_node_ids)

    UNION ALL

    -- Recursividad
    SELECT
      n."id",
      n."parentId",
      n."rootId",
      n."name",
      n."isDir",
      n."blobId",
      n."size",
      n."mime",
      d.depth + 1,
      d."startNodeId" -- Propagamos el ID original
    FROM "node" n
    JOIN descendants d ON n."parentId" = d."id"
  )
  SELECT
    d.id,
    d."parentId",
    d."rootId",
    d.name,
    d."isDir",
    d."blobId",
    d.size,
    d.mime,
    d.depth,
    d."startNodeId",
    b.hash AS "blobHash",
    b."storageKey",
    b."storageType",
    b.size AS "blobSize",
    b."createdAt" AS "blobCreatedAt"
  FROM descendants d
  LEFT JOIN "blob" b ON d."blobId" = b.id
  ORDER BY d."startNodeId", d.depth;
$function$;