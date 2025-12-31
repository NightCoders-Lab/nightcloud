import crypto from "node:crypto";

import { GLOBAL_ROOT_ID } from "@/config/constants";

import type { Prisma } from "../generated/client";

export const ROOT_FOLDERS: Prisma.NodeCreateManyInput[] = [
  {
    id: crypto.randomUUID(),
    parentId: GLOBAL_ROOT_ID,
    rootId: GLOBAL_ROOT_ID,
    blobId: null,
    name: "Documents",
    size: 0n,
    mime: "inode/directory",
    isDir: true,
  },
  {
    id: crypto.randomUUID(),
    parentId: GLOBAL_ROOT_ID,
    rootId: GLOBAL_ROOT_ID,
    blobId: null,
    name: "Pictures",
    size: 0n,
    mime: "inode/directory",
    isDir: true,
  },
  {
    id: crypto.randomUUID(),
    parentId: GLOBAL_ROOT_ID,
    rootId: GLOBAL_ROOT_ID,
    blobId: null,
    name: "Music",
    size: 0n,
    mime: "inode/directory",
    isDir: true,
  },
  {
    id: crypto.randomUUID(),
    parentId: GLOBAL_ROOT_ID,
    rootId: GLOBAL_ROOT_ID,
    blobId: null,
    name: "Videos",
    size: 0n,
    mime: "inode/directory",
    isDir: true,
  },
];
