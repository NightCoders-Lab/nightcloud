import crypto from "node:crypto";

import type { Prisma } from "../generated/client";

export const ROOT_FOLDERS: Prisma.NodeCreateManyInput[] = [
  {
    id: crypto.randomUUID(),
    parentId: "00000000-0000-0000-0000-000000000000",
    rootId: "00000000-0000-0000-0000-000000000000",
    blobId: null,
    name: "Documents",
    size: 0n,
    mime: "inode/directory",
    isDir: true,
  },
  {
    id: crypto.randomUUID(),
    parentId: "00000000-0000-0000-0000-000000000000",
    rootId: "00000000-0000-0000-0000-000000000000",
    blobId: null,
    name: "Pictures",
    size: 0n,
    mime: "inode/directory",
    isDir: true,
  },
  {
    id: crypto.randomUUID(),
    parentId: "00000000-0000-0000-0000-000000000000",
    rootId: "00000000-0000-0000-0000-000000000000",
    blobId: null,
    name: "Music",
    size: 0n,
    mime: "inode/directory",
    isDir: true,
  },
  {
    id: crypto.randomUUID(),
    parentId: "00000000-0000-0000-0000-000000000000",
    rootId: "00000000-0000-0000-0000-000000000000",
    blobId: null,
    name: "Videos",
    size: 0n,
    mime: "inode/directory",
    isDir: true,
  },
];
