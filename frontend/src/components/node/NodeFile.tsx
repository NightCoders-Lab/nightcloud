import { useMemo } from "react";
import type { NodeType } from "@/types";
import getHumanFileType from "@/utils/files/getHumanFileType";
import getHumanFileSize from "@/utils/files/getHumanFileSize";
import { getCategoryFromMime } from "@/utils/files/getCategoryFromExtAndMime";
import { FileCategoryIcons } from "@/data/fileCategoryIcons";
import formatDate from "@/utils/formatDate";
import NodeActions from "./actions/NodeActions";
import { useCtx } from "@/hooks/context/useCtx";
import { useSelectedNodes } from "@/hooks/stores/useSelectedNodes";
import { useDraggable } from "@dnd-kit/core";
import classNames from "@/utils/classNames";

type NodeFileProps = {
  node: NodeType;
};

export default function NodeFile({ node }: Readonly<NodeFileProps>) {
  const { selectedNodes, addSelectedNodes, removeSelectedNode } =
    useSelectedNodes();

  // Drag and Drop
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: node.id,
      data: node,
    });
  // Estilo de transformacion durante el drag
  const style =
    transform && !isDragging
      ? {
          transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        }
      : undefined;

  const { openCtx } = useCtx();
  const isSelected = useMemo(() => {
    return selectedNodes.some((n) => n.id === node.id);
  }, [selectedNodes, node.id]);

  // Determinar el icono del nodo
  const category = getCategoryFromMime(node.mime);
  const Icon = FileCategoryIcons[category];

  // Funciones de seleccion
  const toggleSelect = (selectedNode: NodeType) => {
    if (selectedNodes.some((node) => node.id === selectedNode.id)) {
      removeSelectedNode(selectedNode.id);
    } else {
      addSelectedNodes([selectedNode]);
    }
  };
  const handleOnClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleSelect(node);
  };
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openCtx("node", e.clientX, e.clientY, { selectedNode: node });
    toggleSelect(node);
  };

  return (
    <li
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={style}
      onContextMenu={handleContextMenu}
      className={classNames(
        isSelected
          ? "bg-night-primary/10 border-night-primary/20"
          : "hover:bg-night-surface hover:border-night-border/50",
        isDragging
          ? "opacity-40 cursor-grabbing border-dashed"
          : "opacity-100 scale-100",
        "grid grid-cols-[50px_1fr_100px_100px_180px_50px] gap-4 items-center px-4 py-3 rounded-lg transition-all duration-200 group border border-transparent select-none w-full"
      )}
    >
      {/* Checkbox */}
      <div className="flex justify-center">
        <input
          type="checkbox"
          checked={isSelected}
          onClick={handleOnClick}
          className="w-4 h-4 rounded border-night-border bg-night-surface text-night-primary focus:ring-offset-night-main cursor-pointer"
          readOnly
        />
      </div>

      {/* Nombre e Icono */}
      <div className="flex items-center gap-3 overflow-hidden">
        <Icon className="text-xl text-night-muted shrink-0" />
        <span
          className={`truncate font-medium ${
            isSelected ? "text-white" : "text-night-text"
          }`}
        >
          {node.name}
        </span>
      </div>

      <div className="flex">
        <span className="text-night-muted font-mono text-sm">
          {getHumanFileSize(node.size)}
        </span>
      </div>

      <div className="flex">
        <span className="text-night-muted font-mono text-sm">
          {getHumanFileType(node.mime)}
        </span>
      </div>

      <div className="flex">
        <span className="text-night-muted font-mono text-sm">
          {formatDate(node.updatedAt)}
        </span>
      </div>

      {/* Actions */}
      <div className="flex justify-end">
        <NodeActions node={node} />
      </div>
    </li>
  );
}
