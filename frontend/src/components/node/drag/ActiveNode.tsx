import { isNodeDrag } from "@/hooks/dnd/utils/dndGuards";
import type { NodeType } from "@/types";
import { useDndContext } from "@dnd-kit/core";
import MultiNodePreview from "./MultiNodePreview";
import SingleNodePreview from "./SingleNodePreview";
import { useSelectedNodes } from "@/hooks/stores/useSelectedNodes";

type ActiveNodeProps = {
  nodes: NodeType[];
};

export default function ActiveNode({ nodes }: Readonly<ActiveNodeProps>) {
  const { selectedNodes } = useSelectedNodes();
  const { active } = useDndContext();
  if (!active) return null;

  const data = active.data.current;

  if (!isNodeDrag(data)) return null;

  // Renderizar vista previa para múltiples nodos si el nodo activo está en la selección y hay más de uno seleccionado
  if (selectedNodes.length > 1 && selectedNodes.some((n) => n.id === data.id)) {
    return <MultiNodePreview nodes={selectedNodes} tableNodes={nodes} />;
  }

  // Renderizar vista previa para un solo nodo
  return (
    <SingleNodePreview
      node={Array.isArray(data) ? data[0] : data}
      tableNodes={nodes}
    />
  );
}
