-- 1. Limpieza de versiones anteriores (por seguridad)
DROP FUNCTION IF EXISTS public.get_ancestors(uuid);
DROP FUNCTION IF EXISTS public.get_descendants(uuid);
DROP FUNCTION IF EXISTS public.get_ancestors_bulk(uuid[]);
DROP FUNCTION IF EXISTS public.get_descendants_bulk(uuid[]);

-- ============================================================
-- 2. GET ANCESTORS (Single)
-- Obtiene la jerarquía hacia arriba de un solo nodo.
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_ancestors(start_node_id uuid)
RETURNS TABLE(
  id uuid,
  "parentId" uuid,
  name text,
  "blobId" uuid,
  size bigint,
  mime text,
  "isDir" boolean,
  depth integer,
  "rootId" uuid,       -- Global Root / Tenant ID real
  "startNodeId" uuid   -- El nodo relativo donde inició la búsqueda
)
LANGUAGE sql
STABLE
AS $function$
  WITH RECURSIVE ancestors AS (
    -- Nivel 0 (Nodo inicial)
    SELECT
      n."id",
      n."parentId",
      n."name",
      n."blobId",
      n."size",
      n."mime",
      n."isDir",
      0 AS depth,
      n."rootId",
      n."id" AS "startNodeId" -- Marcamos el inicio
    FROM "node" n
    WHERE n."id" = start_node_id

    UNION ALL

    -- Recursividad (Subir a los padres)
    SELECT
      n."id",
      n."parentId",
      n."name",
      n."blobId",
      n."size",
      n."mime",
      n."isDir",
      a.depth + 1,
      n."rootId",
      a."startNodeId" -- Propagamos el ID de inicio
    FROM "node" n
    JOIN ancestors a ON n."id" = a."parentId"
  )
  SELECT
    id, "parentId", name, "blobId", size, mime, "isDir", depth, "rootId", "startNodeId"
  FROM ancestors
  ORDER BY depth;
$function$;

-- ============================================================
-- 3. GET DESCENDANTS (Single)
-- Obtiene la jerarquía hacia abajo de un solo nodo.
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_descendants(start_node_id uuid)
RETURNS TABLE(
  id uuid,
  "parentId" uuid,
  name text,
  "blobId" uuid,
  size bigint,
  mime text,
  "isDir" boolean,
  depth integer,
  "rootId" uuid,
  "startNodeId" uuid
)
LANGUAGE sql
STABLE
AS $function$
  WITH RECURSIVE descendants AS (
    -- Nivel 0
    SELECT
      n."id",
      n."parentId",
      n."name",
      n."blobId",
      n."size",
      n."mime",
      n."isDir",
      0 AS depth,
      n."rootId",
      n."id" AS "startNodeId"
    FROM "node" n
    WHERE n."id" = start_node_id

    UNION ALL

    -- Recursividad (Bajar a los hijos)
    SELECT
      n."id",
      n."parentId",
      n."name",
      n."blobId",
      n."size",
      n."mime",
      n."isDir",
      d.depth + 1,
      n."rootId",
      d."startNodeId"
    FROM "node" n
    JOIN descendants d ON n."parentId" = d."id"
  )
  SELECT
    id, "parentId", name, "blobId", size, mime, "isDir", depth, "rootId", "startNodeId"
  FROM descendants
  ORDER BY depth;
$function$;

-- ============================================================
-- BULK ANCESTORS (Multiple)
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_ancestors_bulk(start_node_ids uuid[])
RETURNS TABLE(
  id uuid,
  "parentId" uuid,
  name text,
  "blobId" uuid,
  size bigint,
  mime text,
  "isDir" boolean,
  depth integer,
  "rootId" uuid,
  "startNodeId" uuid
)
LANGUAGE sql
STABLE
AS $function$
WITH RECURSIVE ancestors AS (
  -- Nivel 0 (Roots de la búsqueda)
  SELECT
    n."id",
    n."parentId",
    n."name",
    n."blobId",
    n."size",
    n."mime",
    n."isDir",
    0 AS depth,
    n."rootId",
    n."id" AS "startNodeId"
  FROM "node" n
  WHERE n."id" = ANY(start_node_ids)

  UNION ALL

  -- Recursividad (Subir a los padres)
  SELECT
    n."id",
    n."parentId",
    n."name",
    n."blobId",
    n."size",
    n."mime",
    n."isDir",
    a.depth + 1,
    n."rootId",
    a."startNodeId"
  FROM "node" n
  JOIN ancestors a ON n."id" = a."parentId"
)
SELECT DISTINCT ON (id)
  id, "parentId", name, "blobId", size, mime, "isDir", depth, "rootId", "startNodeId"
FROM ancestors
ORDER BY id, depth, "startNodeId";
$function$;

-- ============================================================
-- BULK DESCENDANTS (Multiple)
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_descendants_bulk(start_node_ids uuid[])
RETURNS TABLE(
  id uuid,
  "parentId" uuid,
  name text,
  "blobId" uuid,
  size bigint,
  mime text,
  "isDir" boolean,
  depth integer,
  "rootId" uuid,
  "startNodeId" uuid
)
LANGUAGE sql
STABLE
AS $function$
WITH RECURSIVE descendants AS (
  SELECT
    n."id",
    n."parentId",
    n."name",
    n."blobId",
    n."size",
    n."mime",
    n."isDir",
    0 AS depth,
    n."rootId",
    n."id" AS "startNodeId"
  FROM "node" n
  WHERE n."id" = ANY(start_node_ids)

  UNION ALL

  SELECT
    n."id",
    n."parentId",
    n."name",
    n."blobId",
    n."size",
    n."mime",
    n."isDir",
    d.depth + 1,
    n."rootId",
    d."startNodeId"
  FROM "node" n
  JOIN descendants d ON n."parentId" = d."id"
)
SELECT DISTINCT ON (id)
  id, "parentId", name, "blobId", size, mime, "isDir", depth, "rootId", "startNodeId"
FROM descendants
ORDER BY id, depth, "startNodeId";
$function$;