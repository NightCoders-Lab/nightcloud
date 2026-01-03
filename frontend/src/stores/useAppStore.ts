import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { createNodeSlice, type NodeSliceType } from "./nodeSlice";
import {
  createUploadStaging,
  type UploadStagingType,
} from "./uploadStagingSlice";
import { createListSlice, type ListSliceType } from "./listSlice";
import { createExplorerSlice, type ExplorerSliceType } from "./explorerSlice";
import {
  createBreadcrumbSlice,
  type BreadcrumbSliceType,
} from "./breadcrumbSlice";
import {
  createContextMenuSlice,
  type ContextMenuState,
} from "./contextMenuSlice";
import { createUploadSlice, type UploadSliceType } from "./uploadSlice";
import {
  createUploadJobSlice,
  type UploadJobSliceType,
} from "./uploadJobSlice";
import { createSearchSlice, type SearchSliceType } from "./searchSlice";
import { createDragSlice, type DragSliceType } from "./dragSlice";

export const useAppStore = create<
  NodeSliceType &
    UploadStagingType &
    ListSliceType &
    ExplorerSliceType &
    BreadcrumbSliceType &
    ContextMenuState &
    UploadSliceType &
    UploadJobSliceType &
    SearchSliceType &
    DragSliceType
>()(
  devtools((...args) => ({
    ...createNodeSlice(...args),
    ...createUploadStaging(...args),
    ...createListSlice(...args),
    ...createExplorerSlice(...args),
    ...createBreadcrumbSlice(...args),
    ...createContextMenuSlice(...args),
    ...createUploadSlice(...args),
    ...createUploadJobSlice(...args),
    ...createSearchSlice(...args),
    ...createDragSlice(...args),
  }))
);
