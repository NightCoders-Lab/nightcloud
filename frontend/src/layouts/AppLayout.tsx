import { useEffect } from "react";
import { Outlet, useLocation, useParams } from "react-router-dom";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { ToastContainer } from "react-toastify";
import GlobalDropzone from "@/components/upload/GlobalDropzone";
import NodeContextMenu from "@/components/context/NodeContextMenu";
import { useSelectedNodes } from "@/hooks/stores/useSelectedNodes";
import ModalContextMenu from "@/components/context/ModalContextMenu";
import NodeAreaContextMenu from "@/components/context/NodeAreaContextMenu";
import { useCtx } from "@/hooks/context/useCtx";
import { DndContext } from "@dnd-kit/core";
import { useUploadScheduler } from "@/hooks/upload/useUploadScheduler";
import { useUploadQuerySync } from "@/hooks/upload/useUploadQuerySync";
import { useUploadInvalidateQueries } from "@/hooks/upload/useUploadInvalidateQueries";
import { useUploadToast } from "@/hooks/upload/useUploadToast";
import { useSearch } from "@/hooks/search/useSearch";
import { useSearchCleanup } from "@/hooks/search/useSearchCleanup";
import { useDndCollision } from "@/hooks/dnd/useDndCollision";
import { useDndSensors } from "@/hooks/dnd/useDndSensors";
import { useDndController } from "@/hooks/dnd/useDndController";

export default function AppLayout() {
  // Obtener información de la ruta actual
  const location = useLocation();
  const params = useParams();
  const queryParams = new URLSearchParams(location.search);
  const scope = queryParams.get("scope");

  // Hooks y funciones globales
  const { openCtx } = useCtx();
  const { setSelectedNodes } = useSelectedNodes();
  const { setSearchResults, setSearchQuery } = useSearch();
  const { handleDragStart, handleDragOver, handleDragEnd } = useDndController();

  // Determinar si estamos en root o en directory view
  const isRootOrDirView =
    location.pathname === "/" || location.pathname.startsWith("/directory/");

  // Manejador del click derecho en el área principal
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isRootOrDirView) return; // Solo abrir el context menu en root o directory view
    openCtx("nodeAreas", e.clientX, e.clientY);
  };

  // Limpiar los nodos seleccionados al cambiar de ruta
  useEffect(() => {
    if (scope === "bulk") return;
    setTimeout(() => {
      setSelectedNodes([]);
    }, 300);
  }, [params, setSelectedNodes, scope, setSearchResults, setSearchQuery]);

  // Hooks para obtener la configuracion de DnD (para drag and drop)
  const sensors = useDndSensors();
  const collision = useDndCollision();

  // Limpiar resultados de búsqueda al cambiar de ruta
  useSearchCleanup();

  // Sistema de subida de archivos
  useUploadScheduler(); // Iniciar el scheduler de subidas
  useUploadQuerySync(); // Sincronizar el estado de las subidas con las queries
  useUploadInvalidateQueries(); // Invalidar queries al completar subidas
  useUploadToast(); // Gestionar toasts de subida

  return (
    <>
      {/* Zona de drop global, solamente renderizada en /directory/* y root */}
      <GlobalDropzone />

      <div className="flex h-screen w-full bg-night-main text-night-text overflow-hidden relative font-sans">
        {/* Fondo Aurora */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute top-[-10%] left-[0%] w-125 h-125 bg-night-primary/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[0%] w-125 h-125 bg-night-success/5 rounded-full blur-[100px]" />
        </div>

        {/* Sidebar fijo a la izquierda */}
        <div className="relative z-10 hidden md:block h-full shrink-0">
          <Sidebar />
        </div>

        {/* Área Principal */}
        <main className="flex-1 flex flex-col relative z-10 min-w-0 h-full">
          <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            collisionDetection={collision}
          >
            <Header />

            <div // NOSONAR - Desactivar el aviso de sonar puesto q es solo por el context menu
              role="main"
              aria-label="Main Content Area"
              onContextMenu={handleContextMenu}
              className="flex-1 flex flex-col overflow-hidden p-8"
            >
              <div className="w-full h-full mx-auto flex flex-col">
                <Outlet />
              </div>
            </div>
          </DndContext>
        </main>
      </div>

      <ToastContainer
        pauseOnHover={true}
        pauseOnFocusLoss={false}
        theme="dark"
        toastClassName={() =>
          "relative grid grid-cols-[auto_1fr_auto] items-center w-full overflow-hidden cursor-pointer rounded-md shadow-lg pr-16 pl-4 py-5 mb-4 bg-night-surface text-night-text border border-night-border"
        }
      />
      <NodeContextMenu />
      <ModalContextMenu />
      <NodeAreaContextMenu />
    </>
  );
}
