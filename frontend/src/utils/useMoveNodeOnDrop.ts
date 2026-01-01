import { moveNode } from "@/api/NodeAPI";
import type { NodeType } from "@/types";
import type { DragEndEvent } from "@dnd-kit/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { getDropData } from "./getDropData";

export function useMoveNodeOnDrop() {
  const queryClient = useQueryClient();

  // Configurar la mutacion para mover nodos
  const { mutate } = useMutation({
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

      // mensaje de éxito
      const nodesAffected = Array.isArray(data) ? data.length : 1;
      const successOperations = node?.isDir
        ? `${nodesAffected} Folder(s)`
        : `${nodesAffected} File(s)`;

      // Invalidar la caché para refrescar los datos
      queryClient.invalidateQueries({
        queryKey: ["nodes", node.parentId ?? "root"],
      });
      queryClient.invalidateQueries({ queryKey: ["cloudStats"] });

      // Finalmente mostrar el toast de éxito
      toast.success(`${successOperations} moved successfully`, {
        autoClose: 1000,
      });
    },
    onError: (error) => {
      // Mostrar el error en un toast
      toast.error(error.message);
    },
  });

  // Manejar el fin del drag
  const handleNodeDrop = (event: DragEndEvent) => {
    // Obtener datos del drag and drop
    const data = getDropData(event);
    // Si no se arrastro sobre un nodo valido entonces no habra data y no se hace nada
    if (!data) return;

    const { activeId, overId, activeData, overData } = data;

    // Si no hay datos actuales, no hacer nada
    if (!activeData || !overData) return;

    // Prevenir mover una carpeta dentro de si misma
    if (activeId === overId) {
      return toast.info("Cannot move a folder into itself.", {
        autoClose: 2000,
      });
    }

    // Obtener los nodos activos y sobre el que se solto
    const activeNode = activeData as NodeType; // Hacer un casteo ya que si o si debe ser un NodeType
    // Si se suelta sobre el breadcrumb root, el targetId es null
    // Sino, es el id del nodo sobre el que se suelta
    const overNodeId =
      overId === "breadcrumb:root" ? null : (overData as NodeType)?.id; // Castear a NodeType si no es root

    // Ejecutar la mutacion para mover el nodo
    mutate({ node: activeNode, targetId: overNodeId });
  };

  return { handleNodeDrop };
}
