import { FaFolder } from "react-icons/fa6";
import type { NodeSearchType, NodeType } from "@/types";
import getHumanFileType from "@/utils/files/getHumanFileType";
import getHumanFileSize from "@/utils/files/getHumanFileSize";
import formatDate from "@/utils/formatDate";
import classNames from "@/utils/classNames";
import NodeActions from "./actions/NodeActions";
import { useNodeItemLogic } from "@/hooks/nodes/useNodeItemLogic";

type NodeDirProps = {
  node: NodeType | NodeSearchType;
};

export default function NodeDir({ node }: Readonly<NodeDirProps>) {
  const {
    isSelected,
    isGhost,
    isOver,
    isDropping,
    style,
    setNodeRef,
    attributes,
    listeners,
    clickEvents,
    handleContextMenu,
    toggleSelect,
  } = useNodeItemLogic({ node, mode: "folder" });

  return (
    <li
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      {...clickEvents}
      onContextMenu={handleContextMenu}
      className={classNames(
        isSelected
          ? "bg-night-primary/10 border-night-primary/20"
          : "hover:bg-night-surface hover:border-night-border/50",
        isGhost
          ? "opacity-40 cursor-grabbing border-dashed"
          : "opacity-100 scale-100",
        isOver ? "border-night-primary/40 bg-night-primary/20" : "",
        isDropping ? "opacity-50 cursor-not-allowed" : "",
        "relative z-10 grid grid-cols-[50px_1fr_100px_100px_180px_50px] gap-4 items-center mb-1 px-4 py-3 rounded-lg transition-all duration-200 group border border-transparent cursor-default select-none w-full hover:cursor-pointer"
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
          className="z-30 w-4 h-4 rounded border-night-border bg-night-surface text-night-primary focus:ring-offset-night-main cursor-pointer"
          readOnly
        />
      </div>

      {/* Nombre e Icono */}
      <div className="flex items-center gap-3 overflow-hidden">
        {isDropping ? (
          <div className="w-5 h-5 border-2 border-t-transparent border-night-text rounded-full animate-spin" />
        ) : (
          <FaFolder className="text-xl text-night-primary shrink-0" />
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
      <div className="flex z-30 justify-end">
        <NodeActions node={node} />
      </div>
    </li>
  );
}
