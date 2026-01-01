import ErrorMessage from "@/components/ErrorMessage";
import type { useNode } from "@/hooks/useNode";
import classNames from "@/utils/classNames";
import NodeExplorerAnimatedFolder from "./NodeExplorerAnimatedFolder";
import { useExplorer } from "@/hooks/explorer/useExplorer";
import { HiCheckCircle, HiOutlineCheckCircle } from "react-icons/hi";

type NodeExplorerItemProps = {
  nodeChildren: ReturnType<typeof useNode>["children"];
};

export default function NodeExplorerItem({
  nodeChildren,
}: Readonly<NodeExplorerItemProps>) {
  const { selectedFolderId, enterFolder, selectFolder } = useExplorer();

  if (nodeChildren.loading) {
    return (
      <div className="flex justify-center py-6">
        <div className="w-6 h-6 border-2 border-t-transparent border-night-text rounded-full animate-spin" />
      </div>
    );
  }

  if (nodeChildren.error) {
    return (
      <ErrorMessage>
        There was an error loading the folder contents. Please try again.
      </ErrorMessage>
    );
  }

  const nodesToRender = nodeChildren.data?.filter((n) => n.isDir);

  if (!nodesToRender || nodesToRender.length === 0) {
    return (
      <p className="flex flex-col text-night-muted text-center my-7 select-none">
        <span className="text-night-primary/70">No subfolders here</span>
        <span className="text-night-muted/70">
          You can still select this folder as destination
        </span>
      </p>
    );
  }

  return nodesToRender.map((node) => (
    <div
      key={node.id}
      className={classNames(
        selectedFolderId === node.id
          ? "bg-night-primary/20 border-night-primary/20"
          : "hover:bg-night-surface hover:border-night-border/50",
        "flex justify-between gap-3 text-left px-4 py-3 rounded-lg transition-all duration-200 border border-transparent cursor-default w-full"
      )}
    >
      <NodeExplorerAnimatedFolder node={node} enterFolder={enterFolder} />

      <button
        type="button"
        onClick={() => selectFolder(node.id)}
        className="flex items-center justify-center w-10 h-10 text-night-text opacity-80 hover:cursor-pointer"
      >
        {selectedFolderId === node.id ? (
          <HiCheckCircle size={25} />
        ) : (
          <HiOutlineCheckCircle size={25} />
        )}
      </button>
    </div>
  ));
}
