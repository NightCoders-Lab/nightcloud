import { Transition } from "@headlessui/react";
import { Fragment, useRef } from "react";
import { useCtx } from "@/hooks/context/useCtx";
import { useCtxClickOutside } from "@/hooks/context/useCtxClickOutside";
import { FaFolderPlus } from "react-icons/fa6";
import { useNavigate } from "react-router-dom";

export default function NodeAreaContextMenu() {
  const { closeCtx, isOpen, position, type } = useCtx();
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement>(null);

  // Hook para manejar el cierre si hacen click fuera del ctx menu
  useCtxClickOutside({
    ref: menuRef, // Referencia al menú
    onClose: () => {
      closeCtx(); // Cerrar el menú contextual
    },
    enabled: isOpen, // Solo activar cuando el menú está abierto
  });

  // Renderizado condicional simple
  if (!isOpen || type !== "nodeAreas") return null;

  const handleCreateFolder = () => {
    closeCtx();
    navigate(location.pathname + "?action=create-folder");
  };

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
          <div className="flex flex-col px-1 gap-0.5">
            <button
              onClick={handleCreateFolder}
              className="flex items-center w-full px-3 py-1 overflow-hidden text-sm font-semibold leading-6 text-left text-night-text hover:bg-night-border/50 hover:text-white transition-colors rounded-md hover:cursor-pointer"
            >
              <FaFolderPlus className="mr-2 text-lg" />
              Create New Folder
            </button>
          </div>
        </div>
      </Transition>
    </div>
  );
}
