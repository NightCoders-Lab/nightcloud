DROP FUNCTION IF EXISTS public.get_ancestors_bulk(uuid[]);
DROP FUNCTION IF EXISTS public.get_descendants_bulk(uuid[]);

/* ============================================================
   BULK — ANCESTORS - Con esto se obtiene todos los ancestros de varios nodos a la vez en una sola query
   ============================================================ */

CREATE OR REPLACE FUNCTION public.get_ancestors_bulk(start_node_ids uuid[])
RETURNS TABLE(
  id uuid,
  "parentId" uuid,
  name text,
  hash text,
  size bigint,
  mime text,
  "isDir" boolean,
  depth integer,
  "rootId" uuid
)
LANGUAGE sql
STABLE
AS $function$
WITH RECURSIVE ancestors AS (
  -- Nivel 0 (roots)
  SELECT
    n."id",
    n."parentId",
    n."name",
    n."hash",
    n."size",
    n."mime",
    n."isDir",
    0 AS depth,
    n."id" AS "rootId"
  FROM "node" n
  WHERE n."id" = ANY(start_node_ids)

  UNION ALL

  -- Padres
  SELECT
    n."id",
    n."parentId",
    n."name",
    n."hash",
    n."size",
    n."mime",
    n."isDir",
    a.depth + 1,
    a."rootId"
  FROM "node" n
  JOIN ancestors a ON n."id" = a."parentId"
)
SELECT DISTINCT ON (id)
  id,
  "parentId",
  name,
  hash,
  size,
  mime,
  "isDir",
  depth,
  "rootId"
FROM ancestors
ORDER BY id, depth;
$function$;

/* ============================================================
   BULK — DESCENDANTS - Con esto se obtiene todos los descendientes de varios nodos a la vez en una sola query
   ============================================================ */

CREATE OR REPLACE FUNCTION public.get_descendants_bulk(start_node_ids uuid[])
RETURNS TABLE(
  id uuid,
  "parentId" uuid,
  name text,
  hash text,
  size bigint,
  mime text,
  "isDir" boolean,
  depth integer,
  "rootId" uuid
)
LANGUAGE sql
STABLE
AS $function$
WITH RECURSIVE descendants AS (
  -- Nivel 0 (roots)
  SELECT
    n."id",
    n."parentId",
    n."name",
    n."hash",
    n."size",
    n."mime",
    n."isDir",
    0 AS depth,
    n."id" AS "rootId"
  FROM "node" n
  WHERE n."id" = ANY(start_node_ids)

  UNION ALL

  -- Hijos
  SELECT
    n."id",
    n."parentId",
    n."name",
    n."hash",
    n."size",
    n."mime",
    n."isDir",
    d.depth + 1,
    d."rootId"
  FROM "node" n
  JOIN descendants d ON n."parentId" = d."id"
)
SELECT DISTINCT ON (id)
  id,
  "parentId",
  name,
  hash,
  size,
  mime,
  "isDir",
  depth,
  "rootId"
FROM descendants
ORDER BY id, depth;
$function$;
