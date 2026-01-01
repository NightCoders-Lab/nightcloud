-- Esta funcion permite buscar nodos (archivos/carpetas) por nombre,
-- opcionalmente filtrando por un nodo padre.
-- La busqueda utiliza un indice de texto completo para mejorar el rendimiento.
CREATE OR REPLACE FUNCTION search_nodes(
  p_parent_id uuid,
  p_query text,
  p_limit int DEFAULT 20 -- por defecto, un limite de 20 resultados
)
RETURNS TABLE (
  id uuid,
  "parentId" uuid,
  name text,
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
    n.size,
    n.mime,
    n."isDir",
    n."updatedAt"
  FROM node n
  WHERE
    (
      p_parent_id IS NULL
      OR n."parentId" = p_parent_id
    )
    AND to_tsvector('simple', n.name) -- Esto es para evitar problemas con acentos y caracteres especiales
        @@ to_tsquery('simple', p_query || ':*') -- Esto permite buscar prefijos
  ORDER BY n."isDir" DESC, n."updatedAt" DESC
  LIMIT LEAST(p_limit, 50); --- Limitar a un máximo de 50 resultados
$$;