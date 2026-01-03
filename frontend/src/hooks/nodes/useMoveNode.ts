import { moveNode } from "@/api/NodeAPI";
import type { NodeType } from "@/types";
import { buildSuccessToast } from "@/utils/build/buildSuccessToast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

export function useMoveNode() {
  const queryClient = useQueryClient();

  // Configurar la mutacion para mover nodos
  const { mutate, mutateAsync, isPending } = useMutation({
    mutationFn: ({
      node,
      targetId,
    }: {
      node: NodeType;
      targetId: NodeType["id"] | null;
    }) => moveNode(node.id, targetId, node.name), // pasar el nombre q tiene, el backend resolvera conflictos
    onSuccess: (data, variables) => {
      // Obtener el nodo movido
      const { node } = variables;
      // Determinar el parentId para invalidar la query correcta
      const parentId = node.parentId === node.rootId ? "root" : node.parentId;

      // Invalidar la caché para refrescar los datos
      queryClient.invalidateQueries({
        queryKey: ["nodes", parentId ?? "root"],
      });
      queryClient.invalidateQueries({ queryKey: ["cloud", "stats"] });

      // Mostrar un toast de éxito
      buildSuccessToast("move", data);
    },
    onError: (error) => {
      // Mostrar el error en un toast
      toast.error(error.message);
    },
  });

  return {
    moveNode: mutate,
    moveNodeAsync: mutateAsync,
    isPending,
  };
}
