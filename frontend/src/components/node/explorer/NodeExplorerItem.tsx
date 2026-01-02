import ErrorMessage from "@/components/ErrorMessage";
import type { useNode } from "@/hooks/useNode";
import classNames from "@/utils/classNames";
import NodeExplorerAnimatedFolder from "./NodeExplorerAnimatedFolder";
import { useExplorer } from "@/hooks/explorer/useExplorer";
import { HiCheckCircle, HiOutlineCheckCircle } from "react-icons/hi";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { RefObject } from "react";

type NodeExplorerItemProps = {
  nodeChildren: ReturnType<typeof useNode>["children"];
  parentRef: RefObject<HTMLDivElement | null>;
};

export default function NodeExplorerItem({
  nodeChildren,
  parentRef,
}: Readonly<NodeExplorerItemProps>) {
  const { selectedFolderId, enterFolder, selectFolder } = useExplorer();
  const nodesToRender = nodeChildren.data?.filter((n) => n.isDir);

  // Configuracion del virtualizer para las filas calculadas previamente
  // La alerta desactivada es del eslint ya que el virtualizer no se puede memoizar
  // ya que siempre se necesita actualizar al cambiar el scroll
  // eslint-disable-next-line react-hooks/incompatible-library
  const rowVirtualizer = useVirtualizer({
    count: nodesToRender ? nodesToRender.length : 0,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60, // Altura estimada de cada fila
    overscan: 4, // Filas adicionales para renderizar fuera de la vista
  });

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

  return (
    <div
      style={{
        height: rowVirtualizer.getTotalSize(),
        position: "relative",
      }}
    >
      {rowVirtualizer.getVirtualItems().map((virtualRow) => {
        const node = nodesToRender[virtualRow.index];
        const isSelected = selectedFolderId === node.id;

        return (
          <div
            key={virtualRow.key}
            style={{
              height: virtualRow.size,
              transform: `translateY(${virtualRow.start}px)`,
            }}
            className={classNames(
              isSelected
                ? "bg-night-primary/20 border-night-primary/20"
                : "hover:bg-night-surface hover:border-night-border/50",
              "absolute top-0 left-0 w-full flex justify-between gap-3 text-left px-4 py-3 rounded-lg transition-all duration-200 border border-transparent cursor-default"
            )}
          >
            <NodeExplorerAnimatedFolder node={node} enterFolder={enterFolder} />

            <button
              type="button"
              onClick={() => selectFolder(node.id)}
              className="flex items-center justify-center w-10 h-10 text-night-text opacity-80 hover:cursor-pointer"
            >
              {isSelected ? (
                <HiCheckCircle size={25} />
              ) : (
                <HiOutlineCheckCircle size={25} />
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
}
