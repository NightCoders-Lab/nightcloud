import { useLocation, useNavigate, useParams } from "react-router-dom";
import { FaFolderPlus } from "react-icons/fa";
import NodeTable from "@/components/node/NodeTable";
import buildBreadcrumbs from "@/utils/build/buildBreadcrumbs";
import { useNode } from "@/hooks/useNode";
import Breadcrumb from "@/components/Breadcrumb";
import CreateFolderModal from "@/components/node/modal/CreateFolderModal";
import UploadModal from "@/components/upload/UploadModal";
import RenameNodeModal from "@/components/node/modal/RenameNodeModal";
import DeleteNodeModal from "@/components/node/modal/DeleteNodeModal";
import CopyNodeModal from "@/components/node/modal/CopyNodeModal";
import { getVisibleBreadcrumbs } from "@/utils/getVisibleBreadcrums";
import { HiArrowLeft, HiChevronRight } from "react-icons/hi";
import MoveNodeModal from "@/components/node/modal/MoveNodeModal";
import DirectorySkeleton from "../components/skeletons/DirectorySkeleton";
import ErrorState from "@/components/ErrorState";
import { useSelectedNodes } from "@/hooks/stores/useSelectedNodes";
import BulkCopyNodeModal from "@/components/node/modal/BulkCopyNodeModal";
import NodeBulkActions from "@/components/node/actions/NodeBulkActions";
import BulkMoveNodeModal from "@/components/node/modal/BulkMoveNodeModal";
import BulkDeleteNodeModal from "@/components/node/modal/BulkDeleteNodeModal";
import BulkDownloadNodeModal from "@/components/node/modal/BulkDownloadNodeModal";

export default function DirectoryView() {
  const location = useLocation();
  const { nodeId } = useParams();
  const navigate = useNavigate();
  const { selectedNodes } = useSelectedNodes();
  const openModal = () => navigate(location.pathname + "?action=create-folder");

  const { children, ancestors } = useNode(nodeId, "children+ancestors");

  const handleGoBack = () => {
    if (ancestors.data?.length === 0) {
      navigate(`/`);
    } else {
      // Navegar al padre inmediato
      const parent = ancestors.data?.find((a) => a.id === nodeId);

      // SI no hay padre, navegar al root
      if (!parent?.parentId) return navigate("/");

      // Navegar al parentId del nodo actual
      navigate(`/directory/${parent.parentId}`);
    }
  };

  if (!nodeId) {
    return (
      <ErrorState
        title="No directory specified"
        btnMessage="Go Root"
        onRetry={() => navigate("/")}
      >
        Please specify a valid directory to view its contents.
      </ErrorState>
    );
  }

  if (children.loading || ancestors.loading) {
    return <DirectorySkeleton filesCount={5} />;
  }

  if (children.error || ancestors.error || !children.data || !ancestors.data) {
    return <ErrorState btnMessage="Go Root" onRetry={() => navigate("/")} />;
  }

  // Construir los breadcrums visibles
  const breadcrums = [...buildBreadcrumbs(nodeId, ancestors.data)];
  // Obtener los breadcrums visibles con elipsis si es necesario
  const { items: visibleBreadcrumbs, hasEllipsis } = getVisibleBreadcrumbs(
    breadcrums,
    3
  );
  // Agregar el breadcrumb de root al inicio
  const breadcrumbs = [
    {
      id: "breadcrumb:root",
      name: "My Files",
      parentId: null,
    },
    ...visibleBreadcrumbs,
  ];

  return (
    <>
      <div className="flex items-center justify-between h-14 px-4 shrink-0 mb-4">
        <div className="flex items-center gap-4">
          <button
            onClick={handleGoBack}
            className="flex items-center gap-1 px-2 py-1 rounded-md border border-night-border/50 text-night-muted hover:text-night-text hover:bg-night-surface/40 hover:cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150"
          >
            <HiArrowLeft className="w-4 h-4 text-night-text" />
          </button>
          <div className="flex items-center gap-1 text-xl font-bold leading-none rounded-lg bg-night-surface/60 backdrop-blur-md border border-night-border/40 px-3 py-1 overflow-hidden">
            {breadcrumbs.map((n, i) => {
              const showEllipsis = hasEllipsis && i === 2; // si es el segundo elemento y hay elipsis
              if (showEllipsis) {
                return (
                  <span
                    key="ellipsis"
                    className="flex items-center gap-2 text-night-muted/60"
                  >
                    <span className="tracking-widest">…</span>
                    <HiChevronRight className="w-6 h-6 opacity-60" />
                  </span>
                );
              }
              if (i < breadcrumbs.length - 1) {
                return <Breadcrumb key={n.id} n={n} />;
              }
              return (
                <span
                  className="truncate max-w-50 px-2 py-1 rounded-md bg-night-surface/60 text-night-text font-semibold cursor-default select-text"
                  key={n.id}
                >
                  {n.name}
                </span>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <NodeBulkActions />
          <button
            className="flex items-center gap-3 bg-night-primary hover:bg-night-primary-hover hover:cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed transition duration-200 rounded-lg py-2 px-4 text-night-text font-semibold"
            disabled={selectedNodes.length > 0}
            onClick={openModal}
          >
            <FaFolderPlus size={18} />
            Create Folder
          </button>
        </div>
      </div>

      {/* El contenedor de la tabla crece para ocupar el resto del espacio */}
      <div className="flex-1 min-h-0 relative overflow-hidden">
        <NodeTable nodes={children.data} />
      </div>

      <CreateFolderModal />
      <UploadModal />
      <RenameNodeModal />
      <DeleteNodeModal />
      <CopyNodeModal />
      <MoveNodeModal />
      <BulkCopyNodeModal />
      <BulkMoveNodeModal />
      <BulkDeleteNodeModal />
      <BulkDownloadNodeModal />
    </>
  );
}
