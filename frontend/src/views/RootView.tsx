import { FaFolderPlus } from "react-icons/fa";
import NodeTable from "@/components/node/NodeTable";
import CreateFolderModal from "@/components/node/modal/CreateFolderModal";
import { useNavigate } from "react-router-dom";
import UploadModal from "@/components/upload/UploadModal";
import { useNode } from "@/hooks/useNode";
import RenameNodeModal from "@/components/node/modal/RenameNodeModal";
import DeleteNodeModal from "@/components/node/modal/DeleteNodeModal";
import CopyNodeModal from "@/components/node/modal/CopyNodeModal";
import MoveNodeModal from "@/components/node/modal/MoveNodeModal";
import { HiArrowLeft } from "react-icons/hi";
import DirectorySkeleton from "../components/skeletons/DirectorySkeleton";
import ErrorState from "@/components/ErrorState";
import NodeBulkActions from "@/components/node/actions/NodeBulkActions";
import { useSelectedNodes } from "@/hooks/stores/useSelectedNodes";
import BulkCopyNodeModal from "@/components/node/modal/BulkCopyNodeModal";
import BulkMoveNodeModal from "@/components/node/modal/BulkMoveNodeModal";
import BulkDeleteNodeModal from "@/components/node/modal/BulkDeleteNodeModal";
import BulkDownloadNodeModal from "@/components/node/modal/BulkDownloadNodeModal";

export default function DirectoryView() {
  const navigate = useNavigate();
  const { selectedNodes } = useSelectedNodes();
  const openModal = () => navigate(location.pathname + "?action=create-folder");

  const { children } = useNode(undefined, "children");

  if (children.loading) {
    return <DirectorySkeleton filesCount={10} />;
  }

  if (children.error || !children.data) {
    return <ErrorState />;
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between h-14 px-4 shrink-0 mb-4">
          <div className="flex items-center gap-4">
            <button
              disabled
              className="flex items-center gap-1 px-2 py-1 rounded-md border border-night-border/50 text-night-muted hover:text-night-text hover:bg-night-surface/40 hover:cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150"
            >
              <HiArrowLeft className="w-4 h-4 text-night-text" />
            </button>
            <div className="flex items-center gap-1 text-xl font-bold leading-none rounded-lg bg-night-surface/60 backdrop-blur-md border border-night-border/40 px-3 py-1 overflow-hidden">
              <span className="px-2 py-1 rounded-md bg-night-surface/60 text-night-text font-semibold cursor-default select-text">
                My Files
              </span>
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
