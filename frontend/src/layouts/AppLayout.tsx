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
import {
  DndContext,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { useMoveNodeOnDrop } from "@/utils/useMoveNodeOnDrop";
import { useUploadScheduler } from "@/hooks/upload/useUploadScheduler";
import { useUploadQuerySync } from "@/hooks/upload/useUploadQuerySync";
import { useUploadInvalidateQueries } from "@/hooks/upload/useUploadInvalidateQueries";
import { useUploadToast } from "@/hooks/upload/useUploadToast";
import { useSearch } from "@/hooks/search/useSearch";
import { useSearchCleanup } from "@/hooks/search/useSearchCleanup";

export default function AppLayout() {
  const location = useLocation();
  const params = useParams();
  const queryParams = new URLSearchParams(location.search);
  const scope = queryParams.get("scope");
  const { setSelectedNodes } = useSelectedNodes();
  const { setSearchResults, setSearchQuery } = useSearch();
  const { openCtx } = useCtx();
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

  // Configurar sensores para el drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6, // Activar el drag solo si se mueve 6px
      },
    })
  );

  // Limpiar resultados de búsqueda al cambiar de ruta
  useSearchCleanup();

  // Sistema de subida de archivos
  useUploadScheduler(); // Iniciar el scheduler de subidas
  useUploadQuerySync(); // Sincronizar el estado de las subidas con las queries
  useUploadInvalidateQueries(); // Invalidar queries al completar subidas
  useUploadToast(); // Gestionar toasts de subida

  // Obtener el handler para mover nodos al soltar
  const { handleNodeDrop } = useMoveNodeOnDrop();

  const handleDragEnd = (event: DragEndEvent) => {
    // Leer los datos del elemento sobre el cual se solto
    const { over } = event;
    // Extraer la accion q se definio en el droppable
    const action = over?.data.current?.dropAction;
    // Ejecutar la accion correspondiente
    switch (action) {
      case "node_dropable":
      case "breadcrumb_dropable": {
        handleNodeDrop(event); // Dejarselo al hook que se encargue por el respeto xd
        break;
      }
      default: {
        // No hacer nada si no hay una accion definida
        break;
      }
    }
    // Aqui se podrian agregar mas cosas si se quiere en el futuro para el drag and drop en cualquier parte
  };

  // Con el collisionDetection=pointerWithin, el over sera el elemento bajo el cursor literal,
  // Por defecto se calcula en base al rect de cada elemento, pero asi podria no ser preciso
  // al usar el snapCenterToCursor en el DragOverlay de los nodos para centrar el elemento arrastrado al cursor.
  // Por ende opte por usar pointerWithin que es más intuitivo en este caso para calcular el over en base al cursor.
  // En el futuro si se necesita mas precision se podria implementar un callback para collision personalizado que combine ambos metodos.
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
            onDragEnd={handleDragEnd}
            collisionDetection={pointerWithin}
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
