import { deleteNode } from "@/api/NodeAPI";
import type { NodeType } from "@/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { toast } from "react-toastify";

export function useDeleteNode() {
  const location = useLocation();
  const parentId = location.pathname.split("/").pop() || null; // Obtener el parentId de la URL
  const queryClient = useQueryClient();

  const { mutate, mutateAsync, isPending } = useMutation({
    mutationFn: (node: NodeType) => deleteNode(node.id),
    onSuccess(_, variables) {
      const node = variables;

      // Invalidar la caché para refrescar los datos
      queryClient.invalidateQueries({
        queryKey: ["nodes", parentId ?? "root"],
      });
      queryClient.invalidateQueries({ queryKey: ["cloud", "stats"] });

      toast.success(`${node.isDir ? "Folder" : "File"} deleted successfully`, {
        autoClose: 1000,
      });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return {
    deleteNode: mutate,
    deleteNodeAsync: mutateAsync,
    isPending,
  };
}
