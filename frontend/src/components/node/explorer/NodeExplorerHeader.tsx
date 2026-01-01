import { useExplorer } from "@/hooks/explorer/useExplorer";
import classNames from "@/utils/classNames";
import { getVisibleBreadcrumbs } from "@/utils/getVisibleBreadcrums";
import { FaFolderOpen } from "react-icons/fa6";
import { HiArrowLeft } from "react-icons/hi";

export default function NodeExplorerHeader() {
  const { currentFolderId, contextRootId, goBack, goToBreadcrumb, breadcrumb } =
    useExplorer();

  // Determinar si estamos en el root literal
  const isLiteralRoot =
    currentFolderId === undefined && contextRootId === undefined;

  // Obtener los breadcrumbs visibles
  const { items: visibleBreadcrumbs, hasEllipsis } = getVisibleBreadcrumbs(
    breadcrumb,
    1 // por defecto mostrar 2 elementos al final + el actual
  );

  return (
    <>
      {/* Header: Back + Breadcrumb */}
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
    </>
  );
}
