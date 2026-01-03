import { bulkMoveNodes } from "@/api/BulkNodeAPI";
import type { NodeType } from "@/types";
import { buildSuccessToast } from "@/utils/build/buildSuccessToast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";

type BulkMoveNodesParams = {
  nodeIds: NodeType["id"][];
  destinationFolderId: NodeType["id"] | null;
};

export function useBulkMoveNodes() {
  const location = useLocation();
  const queryClient = useQueryClient();
  const parentId = location.pathname.split("/").pop() || null; // Obtener el parentId de la URL

  const { mutate, mutateAsync, isPending } = useMutation({
    mutationFn: ({ nodeIds, destinationFolderId }: BulkMoveNodesParams) =>
      bulkMoveNodes(nodeIds, destinationFolderId),
    onSuccess: (data) => {
      // Invalidar la caché para refrescar los datos
      queryClient.invalidateQueries({
        queryKey: ["nodes", parentId ?? "root"],
      });
      queryClient.invalidateQueries({ queryKey: ["cloud", "stats"] });

      // Mostrar toast de éxito
      buildSuccessToast("move", data);
    },
  });

  return {
    bulkMoveNodes: mutate,
    bulkMoveNodesAsync: mutateAsync,
    isPending,
  };
}
