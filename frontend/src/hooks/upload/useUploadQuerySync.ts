import { useQueryClient } from "@tanstack/react-query";
import { useUploadJob } from "./useUploadJob";
import { useEffect, useRef } from "react";
import type { NodeType } from "@/types";

export function useUploadQuerySync() {
  const queryClient = useQueryClient();
  const { completed } = useUploadJob();
  const syncedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    completed.forEach((job) => {
      if (!job.serverData) return;
      if (syncedRef.current.has(job.id)) return;
      queryClient.setQueryData(
        ["nodes", job.parentId],
        (oldData: NodeType[] = []) => {
          return [...oldData, ...job.serverData!];
        }
      );
      syncedRef.current.add(job.id);
    });
  }, [completed, queryClient]);
}
