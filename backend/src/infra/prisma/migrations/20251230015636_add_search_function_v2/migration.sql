DROP FUNCTION IF EXISTS search_nodes (uuid, text, int);

CREATE OR REPLACE FUNCTION search_nodes(
  p_root_id uuid, -- Vital para el scope (Tenant/Usuario)
  p_parent_id uuid, -- Opcional: Si es NULL busca en todo el rootId, si tiene valor busca en esa carpeta
  p_query text,
  p_limit int DEFAULT 20
)
RETURNS TABLE (
  id uuid,
  "parentId" uuid,
  name text,
  "blobId" uuid, -- Puntero al blob por si se necesita
  size bigint,
  mime text,
  "isDir" boolean,
  "updatedAt" timestamptz
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    n.id,
    n."parentId",
    n.name,
    n."blobId", -- Puntero al blob por si se necesita
    n.size,
    n.mime,
    n."isDir",
    n."updatedAt"
  FROM "node" n
  WHERE
    -- SCOPE DE SEGURIDAD
    n."rootId" = p_root_id
    
    -- FILTRO DE CARPETA
    -- Si p_parent_id es NULL, busca en todo el drive del usuario.
    -- Si tiene valor, busca solo en los hijos directos de esa carpeta.
    AND (
      p_parent_id IS NULL
      OR n."parentId" = p_parent_id
    )
    
    -- BÚSQUEDA DE TEXTO
    -- Usamos 'plainto_tsquery' para convertir "foto vacaciones" en "foto & vacaciones"
    -- y le concatenamos ':*' para búsqueda de prefijo.
    AND to_tsvector('simple', n.name) @@ to_tsquery('simple', trim(p_query) || ':*')
    
  ORDER BY 
    -- Ponderación => Las coincidencias exactas o carpetas primero
    n."isDir" DESC, 
    n."updatedAt" DESC
  LIMIT LEAST(p_limit, 50);
$$;