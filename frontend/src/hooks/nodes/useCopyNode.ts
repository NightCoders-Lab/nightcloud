import { copyNode } from "@/api/NodeAPI";
import type { NodeType } from "@/types";
import { buildSuccessToast } from "@/utils/build/buildSuccessToast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

type CopyNodeParams = {
  node: NodeType;
  targetId: string | null;
  newName?: string;
};

export function useCopyNode() {
  const queryClient = useQueryClient();

  const { mutate, mutateAsync, isPending } = useMutation({
    mutationFn: ({ node, targetId, newName }: CopyNodeParams) =>
      copyNode(node.id, targetId, newName ?? node.name),

    onSuccess: (data, variables) => {
      // Obtener el nodo copiado
      const { node } = variables;
      // Determinar el parentId para invalidar la query correcta
      const parentId = node.parentId === node.rootId ? "root" : node.parentId;

      // Invalidar la caché para refrescar los datos
      queryClient.invalidateQueries({
        queryKey: ["nodes", parentId ?? "root"],
      });

      // Actualizar las estadísticas en caché
      queryClient.invalidateQueries({ queryKey: ["cloud", "stats"] });

      // Mostrar un toast de éxito
      buildSuccessToast("copy", data);
    },
    onError: (error) => {
      // Mostrar el error en un toast
      toast.error(error.message);
    },
  });

  return {
    copyNode: mutate,
    copyNodeAsync: mutateAsync,
    isPending,
  };
}
