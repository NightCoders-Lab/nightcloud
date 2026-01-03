import { useLocation, useNavigate } from "react-router-dom";
import Modal from "../../Modal";
import NodeExplorer from "../explorer/NodeExplorer";
import { useExplorer } from "@/hooks/explorer/useExplorer";
import { useSelectedNodes } from "@/hooks/stores/useSelectedNodes";
import { buildBulkModalTitle } from "@/utils/build/buildBulkModalTitle";
import { useState } from "react";
import { useBulkMoveNodes } from "@/hooks/nodes/bulk/useBulkMoveNodes";

export default function BulkMoveNodeModal() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const action = queryParams.get("action");
  const scope = queryParams.get("scope");
  const { selectedNodes } = useSelectedNodes();
  const { selectedFolderId } = useExplorer();
  const isOpen =
    action === "move" && scope === "bulk" && selectedNodes.length > 0;
  const closeModal = () => navigate(location.pathname, { replace: true }); // Remover los query params
  const [clicked, setClicked] = useState(false);
  const { bulkMoveNodes } = useBulkMoveNodes();

  const handleSuccess = () => {
    closeModal();
    setClicked(false);
  };

  const handleMoveNode = () => {
    if (clicked) return; // Prevenir múltiples clics
    bulkMoveNodes(
      {
        nodeIds: selectedNodes.map((n) => n.id),
        destinationFolderId: selectedFolderId ?? null,
      },
      {
        onSuccess: handleSuccess,
      }
    );
    setClicked(true);
  };

  // Contar archivos y carpetas seleccionadas
  const files = selectedNodes.filter((n) => !n.isDir).length;
  const folders = selectedNodes.filter((n) => n.isDir).length;
  // Construir el título del modal dinámicamente
  const modalTitle = buildBulkModalTitle("move", files, folders);

  return (
    <Modal title={modalTitle} open={isOpen} close={closeModal}>
      <div className="mt-5 space-y-10">
        <NodeExplorer />
        <button
          onClick={handleMoveNode}
          disabled={clicked}
          className="w-full p-3 font-bold text-white uppercase cursor-pointer transition-colors duration-200 bg-night-primary hover:bg-night-primary-hover rounded-xl disabled:cursor-not-allowed disabled:opacity-50"
        >
          {clicked ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-t-transparent border-night-text rounded-full animate-spin" />
              <span>Moving {files + folders} item(s)...</span>
            </div>
          ) : (
            <span>Move {files + folders} Item(s)</span>
          )}
        </button>
      </div>
    </Modal>
  );
}
