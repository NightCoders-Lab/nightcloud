import { Transition } from "@headlessui/react";
import { Fragment, useRef } from "react";
import {
  HiOutlinePencil,
  HiOutlineFolderOpen,
  HiOutlineDuplicate,
  HiOutlineTrash,
  HiOutlineDownload,
} from "react-icons/hi";
import { useNavigate, useLocation } from "react-router-dom";
import { useCtx } from "@/hooks/context/useCtx";
import type { NodeType } from "@/types";
import { useCtxPayload } from "@/hooks/context/useCtxPayload";
import { useSelectedNodes } from "@/hooks/stores/useSelectedNodes";
import { useCtxClickOutside } from "@/hooks/context/useCtxClickOutside";
import { downloadNode } from "@/api/NodeAPI";

export default function NodeContextMenu() {
  const {
    selectedNodes,
    removeSelectedNode,
    addSelectedNodes,
    clearSelectedNodes,
  } = useSelectedNodes();
  const { closeCtx, isOpen, type, position } = useCtx();
  const payload = useCtxPayload("node");
  const navigate = useNavigate();
  const location = useLocation();
  const menuRef = useRef<HTMLDivElement>(null);

  // Hook para manejar el cierre si hacen click fuera del ctx menu
  useCtxClickOutside({
    ref: menuRef, // Referencia al menú
    onClose: () => {
      closeCtx(); // Cerrar el menú contextual
      clearSelectedNodes(); // Limpiar nodos seleccionados
    },
    enabled: isOpen, // Solo activar cuando el menú está abierto
  });

  const toggleSelect = (selectedNode: NodeType) => {
    if (selectedNodes.some((node) => node.id === selectedNode.id)) {
      removeSelectedNode(selectedNode.id);
    } else {
      addSelectedNodes([selectedNode]);
    }
  };

  const handleAction = (action: string) => {
    if (!payload) return;
    navigate(
      `${location.pathname}?action=${action}&scope=single&targetId=${payload.selectedNode.id}`
    );
    closeCtx();
    toggleSelect(payload.selectedNode);
  };

  // Renderizado condicional simple
  if (!isOpen || type !== "node") return null;

  return (
    // Z-Index alto para asegurar que se vea encima de cualquier cosa
    <div className="fixed inset-0 z-9999 pointer-events-none">
      <button
        className="fixed inset-0 pointer-events-auto bg-transparent"
        onClick={closeCtx}
      />

      <Transition
        as={Fragment}
        show={isOpen}
        appear={true}
        enter="transition ease-out duration-100"
        enterFrom="opacity-0 scale-5"
        enterTo="opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="opacity-100 scale-100"
        leaveTo="opacity-0 scale-5"
      >
        <div
          ref={menuRef}
          className="fixed pointer-events-auto w-56 py-2 bg-night-surface border border-night-border rounded-md shadow-2xl focus:outline-none flex flex-col"
          style={{
            top: position.y,
            left: position.x,
          }}
        >
          {payload?.selectedNode && (
            <div className="flex flex-col px-1 gap-0.5">
              <button
                onClick={() => downloadNode(payload.selectedNode.id)}
                className="flex items-center w-full px-3 py-1 overflow-hidden text-sm font-semibold leading-6 text-left text-night-text hover:bg-night-border/50 hover:text-white transition-colors rounded-md hover:cursor-pointer"
              >
                <HiOutlineDownload className="mr-2 text-lg" />
                Download
              </button>
              <button
                onClick={() => handleAction("rename")}
                className="flex items-center w-full px-3 py-1 overflow-hidden text-sm font-semibold leading-6 text-left text-night-text hover:bg-night-border/50 hover:text-white transition-colors rounded-md hover:cursor-pointer"
              >
                <HiOutlinePencil className="mr-2 text-lg" />
                Rename
              </button>

              <button
                onClick={() => handleAction("move")}
                className="flex items-center w-full px-3 py-1 overflow-hidden text-sm font-semibold leading-6 text-left text-night-text hover:bg-night-border/50 hover:text-white transition-colors rounded-md hover:cursor-pointer"
              >
                <HiOutlineFolderOpen className="mr-2 text-lg" />
                Move
              </button>

              <button
                onClick={() => handleAction("copy")}
                className="flex items-center w-full px-3 py-1 overflow-hidden text-sm font-semibold leading-6 text-left text-night-text hover:bg-night-border/50 hover:text-white transition-colors rounded-md hover:cursor-pointer"
              >
                <HiOutlineDuplicate className="mr-2 text-lg" />
                Copy
              </button>

              <div className="my-2 border-t border-night-border/30" />

              <button
                onClick={() => handleAction("delete")}
                className="flex items-center w-full px-3 py-1 overflow-hidden text-sm font-semibold leading-6 text-left text-red-400 hover:bg-night-border/50 hover:text-red-300 transition-colors rounded-md hover:cursor-pointer"
              >
                <HiOutlineTrash className="mr-2 text-lg" />
                Remove
              </button>
            </div>
          )}
        </div>
      </Transition>
    </div>
  );
}
