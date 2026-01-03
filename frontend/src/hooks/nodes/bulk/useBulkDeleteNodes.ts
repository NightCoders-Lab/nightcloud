import { bulkDeleteNodes } from "@/api/BulkNodeAPI";
import type { NodeSearchType, NodeType } from "@/types";
import { buildSuccessToast } from "@/utils/build/buildSuccessToast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { toast } from "react-toastify";

type BulkDeleteNodesParams = {
  nodes: NodeType[] | NodeSearchType[];
};

export function useBulkDeleteNodes() {
  const location = useLocation();
  const parentId = location.pathname.split("/").pop() || null; // Obtener el parentId de la URL
  const queryClient = useQueryClient();

  const { mutate, mutateAsync, isPending } = useMutation({
    mutationFn: ({ nodes }: BulkDeleteNodesParams) =>
      bulkDeleteNodes(nodes.map((n) => n.id)),
    onSuccess: (_, variables) => {
      const { nodes } = variables;
      // Invalidar la caché para refrescar los datos
      queryClient.invalidateQueries({
        queryKey: ["nodes", parentId ?? "root"],
      });
      queryClient.invalidateQueries({ queryKey: ["cloud", "stats"] });

      // Mostrar toast de éxito
      buildSuccessToast("delete", nodes);
    },
    onError: (error) => {
      // Mostrar el error en un toast
      toast.error(error.message);
    },
  });

  return {
    bulkDeleteNodes: mutate,
    bulkDeleteNodesAsync: mutateAsync,
    isPending,
  };
}
