import { useExplorer } from "@/hooks/explorer/useExplorer";
import type { NodeType } from "@/types";
import classNames from "@/utils/classNames";
import { FaFolderOpen } from "react-icons/fa6";
import { HiCheckCircle, HiOutlineCheckCircle } from "react-icons/hi";

type NodeExplorerCurrentFolderProps = {
  node?: NodeType;
};

export default function NodeExplorerCurrentFolder({
  node,
}: Readonly<NodeExplorerCurrentFolderProps>) {
  const { currentFolderId, selectedFolderId, contextRootId, selectFolder } =
    useExplorer();

  // Verificar si la carpeta actual está seleccionada
  const isCurrentFolderSelected = selectedFolderId === currentFolderId;
  const isLiteralRoot =
    currentFolderId === undefined && contextRootId === undefined;

  return (
    <div
      className={classNames(
        classNames(
          isCurrentFolderSelected
            ? "bg-night-primary/20 border-night-primary/20"
            : "hover:bg-night-surface hover:border-night-border/50",
          "flex justify-between gap-2 text-left px-4 py-3 rounded-lg transition-all duration-200 border border-transparent w-full"
        )
      )}
    >
      <div className="flex items-center gap-3 select-none">
        <FaFolderOpen size={22} className="shrink-0 text-night-muted" />
        <div className="flex flex-col items-start justify-center">
          <span className="flex text-night-muted w-full">
            Current folder (
            {isLiteralRoot ? (
              "Root"
            ) : (
              <span className="block max-w-10 sm:max-w-30 truncate">
                {node?.name}
              </span>
            )}
            )
          </span>
          <span className="text-xs text-night-muted/80">
            This is where you are now
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={() => selectFolder(currentFolderId)}
        className="flex items-center justify-center w-10 h-10 text-night-text opacity-80 hover:cursor-pointer"
      >
        {isCurrentFolderSelected ? (
          <HiCheckCircle size={25} />
        ) : (
          <HiOutlineCheckCircle size={25} />
        )}
      </button>
    </div>
  );
}
