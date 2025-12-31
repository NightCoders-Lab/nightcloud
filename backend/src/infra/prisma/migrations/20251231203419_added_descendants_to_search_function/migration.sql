CREATE OR REPLACE FUNCTION public.search_nodes(p_root_id uuid, p_parent_id uuid, p_query text, p_limit integer DEFAULT 20)
 RETURNS TABLE(id uuid, "parentId" uuid, name text, "blobId" uuid, size bigint, mime text, "isDir" boolean, "updatedAt" timestamp with time zone)
 LANGUAGE sql
 STABLE
AS $function$
  -- CTE RECURSIVA: Solo se activa si estamos buscando DENTRO de una carpeta específica
  WITH RECURSIVE scope_tree AS (
    -- Anchor: La carpeta actual
    SELECT id
    FROM "node"
    WHERE id = p_parent_id AND p_parent_id IS NOT NULL
    
    UNION ALL
    
    -- Recursión: Los hijos de la carpeta
    SELECT n.id
    FROM "node" n
    JOIN scope_tree st ON n."parentId" = st.id
  )
  
  SELECT
    n.id,
    n."parentId",
    n.name,
    n."blobId",
    n.size,
    n.mime,
    n."isDir",
    n."updatedAt"
  FROM "node" n
  WHERE
    -- SIEMPRE filtrar por el dueño de los archivos
    n."rootId" = p_root_id
    
    -- LÓGICA DE ÁMBITO (SCOPE)
    AND (
      p_parent_id IS NULL -- CASO GLOBAL: Si es null, ignora las carpetas y busca en TODO el rootId
      OR 
      n."parentId" = p_parent_id -- Hijos directos
      OR
      n."parentId" IN (SELECT id FROM scope_tree) -- Descendants (Recursión)
    )
    
    AND to_tsvector('simple', n.name) @@ to_tsquery('simple', p_query || ':*')
    
  ORDER BY 
    n."isDir" DESC, 
    n."updatedAt" DESC
  LIMIT LEAST(p_limit, 50);
$function$;