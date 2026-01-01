-- DropIndex
DROP INDEX "node_parentId_hash_idx";

-- CreateIndex
CREATE INDEX "node_parentId_name_hash_idx" ON "node"("parentId", "name", "hash");
