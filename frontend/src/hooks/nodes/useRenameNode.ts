import { renameNode } from "@/api/NodeAPI";
import type { NodeType } from "@/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

type RenameNodeParams = {
  node: NodeType;
  newName?: string;
};

export function useRenameNode() {
  const queryClient = useQueryClient();

  const { mutate, mutateAsync, isPending } = useMutation({
    mutationFn: ({ node, newName }: RenameNodeParams) =>
      renameNode({ nodeId: node.id, name: newName ?? node.name }),
    onSuccess: (data, variables) => {
      // Obtener el nodo renombrado
      const { node } = variables;
      // Determinar el parentId para invalidar la query correcta
      const parentId = node.parentId === node.rootId ? "root" : node.parentId;

      // Actualizar el nombre en la lista de nodos hijos
      queryClient.setQueryData(
        ["nodes", parentId ?? "root"],
        (oldData: NodeType[] | undefined) => {
          if (!oldData) return oldData;
          return oldData.map((node) =>
            node.id === data.id ? { ...node, name: data.name } : node
          );
        }
      );

      // Actualizar el nombre del nodo detallado
      queryClient.setQueryData(
        ["node", "details", node.id],
        (oldData: NodeType | undefined) => {
          if (!oldData) return oldData;
          return { ...oldData, name: data.name };
        }
      );

      // Invalidar la caché de la lista de nodos para recargar en segundo plano (Optimistic Update)
      queryClient.invalidateQueries({
        queryKey: ["nodes", parentId ?? "root"],
      });
      queryClient.invalidateQueries({ queryKey: ["node", "details", node.id] });

      toast.success(`${data.isDir ? "Folder" : "File"} renamed successfully`, {
        autoClose: 1000,
      });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return {
    renameNode: mutate,
    renameNodeAsync: mutateAsync,
    isPending,
  };
}
