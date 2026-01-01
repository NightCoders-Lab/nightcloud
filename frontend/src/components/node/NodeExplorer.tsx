import { useNode } from "@/hooks/useNode";
import classNames from "@/utils/classNames";
import { FaFolderOpen } from "react-icons/fa6";
import {
  HiArrowLeft,
  HiCheckCircle,
  HiOutlineCheckCircle,
} from "react-icons/hi";
import { useExplorer } from "@/hooks/explorer/useExplorer";
import { useExplorerContext } from "@/hooks/explorer/useExplorerContext";
import { useExplorerInitialization } from "@/hooks/explorer/useExplorerInitialization";
import { getVisibleBreadcrumbs } from "@/utils/getVisibleBreadcrums";
import NodeExplorerFolder from "./NodeExplorerFolder";

export default function NodeExplorer() {
  const {
    currentFolderId,
    selectedFolderId,
    contextRootId,
    breadcrumb,
    enterFolder,
    goBack,
    goToBreadcrumb,
    selectFolder,
  } = useExplorer();

  // Sincronizar el contextRootId con la URL
  const { rootParentId } = useExplorerContext();

  // Obtener los datos del nodo actual y sus hijos
  const { node, children } = useNode(
    currentFolderId ?? contextRootId,
    "node+children"
  );

  // Inicializar el explorador con el rootParentId y el nodeData actual
  useExplorerInitialization(rootParentId || undefined, node.data);

  // Verificar si la carpeta actual está seleccionada
  const isCurrentFolderSelected = selectedFolderId === currentFolderId;
  const isLiteralRoot =
    currentFolderId === undefined && contextRootId === undefined;

  const { items: visibleBreadcrumbs, hasEllipsis } = getVisibleBreadcrumbs(
    breadcrumb,
    1 // por defecto mostrar 2 elementos al final + el actual
  );

  return (
    <div className="flex flex-col gap-2">
      {/* Title */}
      <span className="tracking-wider mb-3 text-md font-semibold">
        Select destination folder:
      </span>

      {/* Header: Back + Breadcrumb */}
      <div className="flex justify-between items-center gap-2 text-sm text-night-muted">
        <button
          type="button"
          onClick={() => goBack()}
          disabled={isLiteralRoot}
          className="flex items-center gap-1 bg-night-primary hover:bg-night-primary-hover hover:cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed p-1 px-2 rounded-lg transition-colors duration-150"
        >
          <HiArrowLeft className="w-4 h-4 text-night-text" />
          <span className="text-night-text tracking-wider">
            Go {visibleBreadcrumbs.length === 1 ? "Root" : "Back"}
          </span>
        </button>

        <div className="flex items-center gap-1 truncate">
          {visibleBreadcrumbs.map((bNode, index) => {
            const isFirst = index === 0; // primer elemento
            const showEllipsis = hasEllipsis && index === 2; // segundo elemento y hay elipsis

            return (
              <div
                key={bNode.id ?? `root-${index}`}
                className="flex items-center gap-1"
              >
                {showEllipsis && (
                  <>
                    <span className="opacity-60">…</span>
                    <span>/</span>
                  </>
                )}

                <button
                  type="button"
                  onClick={() => goToBreadcrumb(bNode.id)}
                  disabled={bNode.id === currentFolderId}
                  className={classNames(
                    isFirst ? "" : "hover:underline",
                    "flex items-center hover:cursor-pointer group hover:text-night-primary/90 transition-colors duration-150 max-w-[12ch] disabled:cursor-not-allowed"
                  )}
                >
                  {isFirst && (
                    <FaFolderOpen
                      size={18}
                      className="shrink-0 mr-1 text-night-muted group-hover:text-night-primary/90 transition-colors duration-150"
                    />
                  )}
                  <span
                    className="truncate max-w-[12ch] inline-block"
                    title={bNode.name}
                  >
                    {bNode.name}
                  </span>
                </button>

                {index < visibleBreadcrumbs.length - 1 && <span>/</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Contenedor del explorador */}
      <div className="max-h-64 overflow-y-auto border border-night-border rounded-lg p-3">
        {/* Current folder (siempre aparece) */}
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
                    {node.data?.name}
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

        {/* Separador */}
        <div className="my-3 border-t border-night-border/50" />

        {/* Lista de folders */}
        {!children.loading &&
        Number(children.data?.filter((n) => n.isDir)?.length) > 0 ? (
          children.data
            ?.filter((n) => n.isDir)
            ?.map((node) => (
              <div
                key={node.id}
                className={classNames(
                  selectedFolderId === node.id
                    ? "bg-night-primary/20 border-night-primary/20"
                    : "hover:bg-night-surface hover:border-night-border/50",
                  "flex justify-between gap-3 text-left px-4 py-3 rounded-lg transition-all duration-200 border border-transparent cursor-default w-full"
                )}
              >
                <NodeExplorerFolder node={node} enterFolder={enterFolder} />

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
            ))
        ) : (
          <p className="flex flex-col text-night-muted text-center my-7 select-none">
            <span className="text-night-primary/70">No subfolders here</span>
            <span className="text-night-muted/70">
              You can still select this folder as destination
            </span>
          </p>
        )}
      </div>
    </div>
  );
}
