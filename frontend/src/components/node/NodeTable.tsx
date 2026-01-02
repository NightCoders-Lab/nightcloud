import { FaArrowUp } from "react-icons/fa6";
import type { NodeType, SortDirection } from "@/types";
import NodeDir from "@/components/node/NodeDir";
import NodeFile from "@/components/node/NodeFile";
import { toggleNameDirection } from "@/utils/node/sortNodes";
import classNames from "@/utils/classNames";
import { useMemo, useRef, useState } from "react";
import { useSelectedNodes } from "@/hooks/stores/useSelectedNodes";
import { DragOverlay } from "@dnd-kit/core";
import { snapCenterToCursor } from "@dnd-kit/modifiers";
import { useSearch } from "@/hooks/search/useSearch";
import { useVirtualizer } from "@tanstack/react-virtual";
import ActiveNode from "./ActiveNode";

// TODO: Adaptar el backend para los favoritos

type NodeTableProps = {
  nodes: NodeType[];
};

export default function NodeTable({ nodes }: Readonly<NodeTableProps>) {
  // Estado de ordenamiento
  const [direction, setDirection] = useState<SortDirection>("asc");
  const { selectedNodes, setSelectedNodes, clearSelectedNodes } =
    useSelectedNodes();
  const { searchResults, searchQuery } = useSearch();
  const parentRef = useRef<HTMLDivElement>(null); // Ref del contenedor de nodos para virtualizacion

  // Nodos ordenados segun la direccion
  const sortedNodes = useMemo(() => {
    return toggleNameDirection(direction, [...nodes]);
  }, [nodes, direction]);

  // Nodos a renderizar (resultados de busqueda o todos los nodos)
  const isSearching = searchQuery.trim().length > 0;
  const nodesToRender = isSearching ? searchResults : sortedNodes;
  const hasNodes = nodesToRender.length > 0;

  // Configuracion del virtualizer para las filas
  // La alerta desactivada es del eslint ya que el virtualizer no se puede memoizar 
  // ya que siempre se necesita actualizar al cambiar el scroll
  // eslint-disable-next-line react-hooks/incompatible-library
  const rowVirtualizer = useVirtualizer({
    count: nodesToRender.length,
    getScrollElement: () => parentRef.current, // Elemento scrollable
    estimateSize: () => 64, // Altura estimada de cada fila
    overscan: 8, // Filas adicionales a renderizar fuera de vista - RECOMENDADO: 8-10 para evitar parpadeos al scrollear rápido
  });

  // Alternar la direccion de ordenamiento
  const toggleDirection = () => {
    setDirection((d) => (d === "asc" ? "desc" : "asc"));
  };

  // Alternar seleccion de todos los nodos
  const toggleSelectAll = () => {
    if (selectedNodes.length === nodes.length) {
      clearSelectedNodes();
    } else {
      setSelectedNodes(nodes);
    }
  };

  return (
    <div className="flex flex-col w-full h-full">
      {/* Header Tabla - shrink-0 para que no se encoja al hacer scroll */}
      <div className="shrink-0 grid grid-cols-[50px_1fr_100px_100px_180px_50px] gap-4 items-center px-4 py-3 text-xs font-semibold text-night-muted uppercase tracking-wider border-b border-night-border z-10">
        <div className="flex justify-center">
          <input
            type="checkbox"
            checked={selectedNodes.length === nodes.length && nodes.length > 0}
            onChange={toggleSelectAll}
            className="w-4 h-4 rounded border-night-border bg-night-surface text-night-primary focus:ring-offset-night-main cursor-pointer"
          />
        </div>
        <button
          type="button"
          onClick={toggleDirection}
          className="flex items-center gap-2 cursor-pointer hover:text-night-text font-sans transition-colors group"
        >
          <span className="text-xs font-semibold text-night-muted uppercase tracking-wider">
            Name
          </span>
          <FaArrowUp
            className={classNames(
              direction === "asc" ? "rotate-0" : "rotate-180",
              "opacity-60 group-hover:opacity-100 transition-all text-[10px] transform duration-300"
            )}
          />
        </button>
        <div>Size</div>
        <div>Type</div>
        <div>Last modified</div>
      </div>

      {/* Filas */}
      <div
        ref={parentRef} // Ref del contenedor scrollable
        className="flex-1 overflow-y-auto mt-2 space-y-1 scrollbar-thin scrollbar-thumb-night-border scrollbar-track-transparent pb-2"
      >
        {!hasNodes && (
          <div className="text-center text-night-muted text-xl mt-20">
            {isSearching
              ? "No results found"
              : "This folder is empty. Upload files to get started!"}
          </div>
        )}

        {hasNodes && (
          <div // Necesitamos un contenedor padre relativo para posicionar las filas virtuales de forma absoluta
            className="relative"
            style={{
              height: rowVirtualizer.getTotalSize(), // Altura total del contenedor virtualizado
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => { // Obtenemos las filas virtuales a renderizar
              // Obtener el nodo correspondiente a la fila virtual
              const node = nodesToRender[virtualRow.index]; // En realidad solo es el index, el virtualizer nunca tiene los datos

              // Renderizar ya normalmente el nodo
              return (
                <div // Se necesita de otro contenedor padre para posicionar absolutamente con respecto al contenedor relativo virtual
                  key={virtualRow.key} // Usar key unica para cada fila
                  className="absolute top-0 left-0 w-full" // Posicionar absolutamente con respecto al contendor virtual
                  style={{
                    height: virtualRow.size, // Esto es necesario, ya que las filas pueden tener diferentes alturas
                    transform: `translateY(${virtualRow.start}px)`, // Mover la fila a su posicion correcta
                  }}
                >
                  {node.isDir ? (
                    <NodeDir key={node.id} node={node} />
                  ) : (
                    <NodeFile key={node.id} node={node} />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {!isSearching && (
          <DragOverlay dropAnimation={null} modifiers={[snapCenterToCursor]}>
            {" "}
            {/* ese modifier centra el dragoverlay al cursor */}
            <ActiveNode nodes={sortedNodes} />
          </DragOverlay>
        )}
      </div>
    </div>
  );
}
