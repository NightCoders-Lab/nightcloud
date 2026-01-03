import type { NodeSearchType, NodeType } from "@/types";
import { useNavigate } from "react-router-dom";
import { useCtx } from "../context/useCtx";
import { useSelectedNodes } from "../stores/useSelectedNodes";
import { useDrag } from "../stores/useDrag";
import { useMemo, useRef, type MouseEvent } from "react";
import { isNodeDrag } from "../dnd/utils/dndGuards";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { useClickHandler } from "../useClickHandler";

type UseNodeItemLogicProps = {
  node: NodeType | NodeSearchType;
  mode: "folder" | "file";
};

/**
 * @description Hook para manejar la lógica de un ítem de nodo (carpeta o archivo) incluyendo selección, drag and drop y eventos de clic.
 * @param param0 Objeto con el nodo y el modo (folder o file).
 * @returns Objeto con propiedades y manejadores para el ítem de nodo.
 */
export function useNodeItemLogic({
  node,
  mode,
}: Readonly<UseNodeItemLogicProps>) {
  // Hooks y funciones necesarias
  const navigate = useNavigate();
  const { openCtx } = useCtx();
  const {
    selectedNodes,
    addSelectedNodes,
    removeSelectedNode,
    clearSelectedNodes,
  } = useSelectedNodes();
  const {
    isDropping: dropping,
    active,
    type: dragType,
    isDragging: isGlobalDragging,
  } = useDrag();

  // Determinar si es folder o file
  const isFolder = mode === "folder";

  // Determinar si el nodo está seleccionado
  const isSelected = useMemo(
    () => selectedNodes.some((n) => n.id === node.id),
    [selectedNodes, node.id]
  );

  // Ref para saber si estaba seleccionado antes de un mouse down
  const wasSelectedRef = useRef(false);

  // Si es folder, es droppable, si es file, no lo es
  const isDropping =
    isFolder && isNodeDrag(active) && active.id === node.id && dropping;

  //  Funciones para manejar la selección y eventos del nodo
  const toggleSelect = () => {
    if (isSelected) {
      removeSelectedNode(node.id);
    } else {
      addSelectedNodes([node]);
    }
  };

  // Manejadores de eventos
  const handleMouseDown = () => {
    // Guardar si estaba seleccionado antes del mouse down
    wasSelectedRef.current = isSelected;

    if (!isSelected) {
      addSelectedNodes([node]);
    }
    // Si YA estaba seleccionado, NO hacemos nada. Dejamos que el Drag o el Click decidan.
  };

  // Single Click: Quitar de la selección si estaba seleccionado
  const handleSingleClick = () => {
    // Si no estaba seleccionado antes del mouse down, quitar de la selección
    if (!wasSelectedRef.current) return;

    // Si estaba seleccionado, quitar de la selección
    removeSelectedNode(node.id);
  };

  // Double Click: Abrir carpeta si es folder
  const handleDoubleClick = () => {
    if (!isFolder) return;
    navigate(`/directory/${node.id}`);
  };

  // Configurar draggable
  const {
    attributes,
    listeners,
    transform,
    setNodeRef: setDragRef,
    isDragging: isSelfDragging,
  } = useDraggable({
    id: node.id,
    disabled: isDropping,
    data: {
      dropAction: "node_droppable",
      ...node,
    },
  });

  // Configurar droppable solo si es carpeta
  const { isOver, setNodeRef: setDropRef } = useDroppable({
    id: node.id,
    disabled: !isFolder,
    data: {
      dropAction: "node_droppable",
      ...node,
    },
  });

  // Combinar refs de draggable y droppable
  const setNodeRef = (el: HTMLElement | null) => {
    setDragRef(el);
    if (isFolder) {
      setDropRef(el);
    }
  };

  // Estilo de transformación durante el drag
  const style =
    transform && !isSelfDragging
      ? {
          transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        }
      : undefined;

  // Manejadores de click
  const clickEvents = useClickHandler<HTMLLIElement>({
    onMouseDown: handleMouseDown,
    onSingleClick: handleSingleClick,
    onDoubleClick: handleDoubleClick,
    delay: 150,
  });

  // Manejador del menú contextual
  const handleContextMenu = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openCtx("node", e.clientX, e.clientY, { selectedNode: node });
    clearSelectedNodes();
    addSelectedNodes([node]);
  };

  // Determinar si es ghost (fantasma) durante el drag
  const isGhost =
    isSelfDragging || (dragType === "nodes" && isSelected && isGlobalDragging);

  return {
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
  };
}
