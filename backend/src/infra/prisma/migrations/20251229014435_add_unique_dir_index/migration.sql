-- Esto asegura que no haya dos directorios con el mismo nombre bajo el mismo directorio padre
CREATE UNIQUE INDEX node_unique_dir_per_parent ON "node" ("parentId", "name")
WHERE
    "isDir" = TRUE;