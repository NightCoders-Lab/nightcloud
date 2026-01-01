DROP FUNCTION IF EXISTS public.get_ancestors(uuid);
DROP FUNCTION IF EXISTS public.get_descendants(uuid);

-- se agrega rootId a las funciones get_ancestors y get_descendants
-- para identificar el nodo raíz desde el cual se comenzó la búsqueda
CREATE OR REPLACE FUNCTION public.get_ancestors(start_node_id uuid)
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
    -- Nivel 0
    SELECT
      "id",
      "parentId",
      "name",
      "hash",
      "size",
      "mime",
      "isDir",
      0 AS depth,
      "id" AS "rootId"
    FROM "node"
    WHERE "id" = start_node_id

    UNION ALL

    -- Recursividad (Padres)
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
  SELECT
    "id",
    "parentId",
    "name",
    "hash",
    "size",
    "mime",
    "isDir",
    depth,
    "rootId"
  FROM ancestors
  ORDER BY depth;
$function$;

-- Se agrego el campo de rootId para identificar el nodo raiz desde el cual se obtuvieron los descendientes
CREATE OR REPLACE FUNCTION public.get_descendants(start_node_id uuid)
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
    -- Nivel 0
    SELECT
      "id",
      "parentId",
      "name",
      "hash",
      "size",
      "mime",
      "isDir",
      0 AS depth,
      "id" AS "rootId"
    FROM "node"
    WHERE "id" = start_node_id

    UNION ALL

    -- Recursividad (Hijos)
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
  SELECT
    "id",
    "parentId",
    "name",
    "hash",
    "size",
    "mime",
    "isDir",
    depth,
    "rootId"
  FROM descendants
  ORDER BY depth;
$function$;
