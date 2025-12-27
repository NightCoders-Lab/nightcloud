import type { FileWithPath } from "react-dropzone";
import { useUploadJob } from "./useUploadJob";
import type { NodeType } from "@/types";

export function useUploadFiles(parentId: NodeType["id"] | null) {
  const { enqueue } = useUploadJob();

  return {
    uploadFiles: (files: FileWithPath[]) => {
      enqueue(files, parentId);
    },
  };
}
