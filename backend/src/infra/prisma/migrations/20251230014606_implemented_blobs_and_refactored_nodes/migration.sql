/*
  Warnings:

  - You are about to drop the column `hash` on the `node` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[parentId,name]` on the table `node` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `rootId` to the `node` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "StorageType" AS ENUM ('LOCAL', 'S3');

-- DropForeignKey
ALTER TABLE "node" DROP CONSTRAINT "node_parentId_fkey";

-- DropIndex
DROP INDEX "node_hash_key";

-- DropIndex
DROP INDEX "node_parentId_name_hash_idx";

-- AlterTable
ALTER TABLE "node" DROP COLUMN "hash",
ADD COLUMN     "blobId" UUID,
ADD COLUMN     "rootId" UUID NOT NULL,
ALTER COLUMN "size" SET DEFAULT 0;

-- CreateTable
CREATE TABLE "blob" (
    "id" UUID NOT NULL,
    "hash" TEXT NOT NULL,
    "size" BIGINT NOT NULL,
    "mime" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "storageType" "StorageType" NOT NULL DEFAULT 'LOCAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "blob_hash_key" ON "blob"("hash");

-- CreateIndex
CREATE INDEX "node_rootId_parentId_name_idx" ON "node"("rootId", "parentId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "unique_parent_name" ON "node"("parentId", "name");

-- AddForeignKey
ALTER TABLE "node" ADD CONSTRAINT "node_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "node"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "node" ADD CONSTRAINT "node_blobId_fkey" FOREIGN KEY ("blobId") REFERENCES "blob"("id") ON DELETE SET NULL ON UPDATE CASCADE;
