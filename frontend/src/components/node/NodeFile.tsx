import type { NodeSearchType, NodeType } from "@/types";
import getHumanFileType from "@/utils/files/getHumanFileType";
import getHumanFileSize from "@/utils/files/getHumanFileSize";
import { getCategoryFromMime } from "@/utils/files/getCategoryFromExtAndMime";
import { FileCategoryIcons } from "@/data/fileCategoryIcons";
import formatDate from "@/utils/formatDate";
import NodeActions from "./actions/NodeActions";
import classNames from "@/utils/classNames";
import { useNodeItemLogic } from "@/hooks/nodes/useNodeItemLogic";

type NodeFileProps = {
  node: NodeType | NodeSearchType;
};

export default function NodeFile({ node }: Readonly<NodeFileProps>) {
  const {
    isSelected,
    isGhost,
    isDropping, // Siempre false en archivos
    style,
    setNodeRef,
    attributes,
    listeners,
    clickEvents,
    handleContextMenu,
    toggleSelect,
  } = useNodeItemLogic({ node, mode: "file" });

  // Determinar el icono del nodo
  const category = getCategoryFromMime(node.mime);
  const Icon = FileCategoryIcons[category];

  return (
    <li
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      {...clickEvents}
      style={style}
      onContextMenu={handleContextMenu}
      className={classNames(
        isSelected
          ? "bg-night-primary/10 border-night-primary/20"
          : "hover:bg-night-surface hover:border-night-border/50",
        isGhost
          ? "opacity-40 cursor-grabbing border-dashed"
          : "opacity-100 scale-100",
        isDropping ? "opacity-50 cursor-not-allowed" : "",
        "grid grid-cols-[50px_1fr_100px_100px_180px_50px] gap-4 mb-1 items-center px-4 py-3 rounded-lg transition-all duration-200 group border border-transparent select-none w-full"
      )}
    >
      {/* Checkbox */}
      <div className="flex justify-center">
        <input
          type="checkbox"
          checked={isSelected}
          onClick={(e) => {
            e.stopPropagation();
            toggleSelect();
          }}
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onDoubleClick={(e) => e.stopPropagation()}
          className="w-4 h-4 rounded border-night-border bg-night-surface text-night-primary focus:ring-offset-night-main cursor-pointer"
          readOnly
        />
      </div>

      {/* Nombre e Icono */}
      <div className="flex items-center gap-3 overflow-hidden">
        {isDropping ? (
          <div className="w-5 h-5 border-2 border-t-transparent border-night-text rounded-full animate-spin" />
        ) : (
          <Icon className="text-xl text-night-muted shrink-0" />
        )}
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
