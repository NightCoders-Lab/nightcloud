-- 1) Directorios root: nombre único
CREATE UNIQUE INDEX IF NOT EXISTS node_unique_root_dir_name ON "node" ("name")
WHERE
    "isDir" = TRUE
    AND "parentId" IS NULL;

-- 2) Directorios con padre: (parentId, name) único
CREATE UNIQUE INDEX IF NOT EXISTS node_unique_child_dir_parent_name ON "node" ("parentId", "name")
WHERE
    "isDir" = TRUE
    AND "parentId" IS NOT NULL;