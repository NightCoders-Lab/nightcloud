import { GLOBAL_ROOT_ID } from "@/config/constants";

import type { Prisma } from "../generated/client";

export const GLOBAL_ROOT: Prisma.NodeCreateManyInput[] = [
  {
    id: GLOBAL_ROOT_ID,
    rootId: GLOBAL_ROOT_ID,
    blobId: null,
    parentId: null,
    name: "Root",
    size: 0n,
    mime: "inode/directory",
    isDir: true,
  },
];
