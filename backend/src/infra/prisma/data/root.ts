import type { Prisma } from "../generated/client";

export const GLOBAL_ROOT: Prisma.NodeCreateManyInput[] = [
  {
    id: "00000000-0000-0000-0000-000000000000",
    rootId: "00000000-0000-0000-0000-000000000000",
    blobId: null,
    parentId: null,
    name: "Root",
    size: 0n,
    mime: "inode/directory",
    isDir: true,
  },
];
