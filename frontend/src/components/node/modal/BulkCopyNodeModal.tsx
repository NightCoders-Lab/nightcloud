import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Modal from "../../Modal";
import NodeExplorer from "../NodeExplorer";
import { useExplorer } from "@/hooks/explorer/useExplorer";
import { bulkCopyNodes } from "@/api/BulkNodeAPI";
import { useSelectedNodes } from "@/hooks/stores/useSelectedNodes";
import { buildBulkModalTitle } from "@/utils/build/buildBulkModalTitle";
import { buildSuccessToast } from "@/utils/build/buildSuccessToast";

export default function BulkCopyNodeModal() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const queryParams = new URLSearchParams(location.search);
  const action = queryParams.get("action");
  const scope = queryParams.get("scope");
  const parentId = location.pathname.split("/").pop() || null; // Obtener el parentId de la URL
  const { selectedNodes } = useSelectedNodes();
  const { selectedFolderId } = useExplorer();
  const isOpen =
    action === "copy" && scope === "bulk" && selectedNodes.length > 0;
  const closeModal = () => navigate(location.pathname, { replace: true }); // Remover los query params

  const { mutate } = useMutation({
    mutationFn: () =>
      bulkCopyNodes(
        selectedNodes.map((n) => n.id),
        selectedFolderId ?? null
      ),
    onSuccess: (data) => {
      // Invalidar la caché para refrescar los datos
      queryClient.invalidateQueries({
        queryKey: ["nodes", parentId ?? "root"],
      });
      queryClient.invalidateQueries({ queryKey: ["cloudStats"] });

      // Mostrar toast de éxito
      buildSuccessToast("copy", data);

      closeModal();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleCopyNode = () => {
    mutate();
  };

  // Contar archivos y carpetas seleccionadas
  const files = selectedNodes.filter((n) => !n.isDir).length;
  const folders = selectedNodes.filter((n) => n.isDir).length;
  // Construir el título del modal dinámicamente
  const modalTitle = buildBulkModalTitle("copy", files, folders);

  return (
    <Modal title={modalTitle} open={isOpen} close={closeModal}>
      <div className="mt-5 space-y-10">
        <NodeExplorer />
        <button
          onClick={handleCopyNode}
          className="w-full p-3 font-bold text-white uppercase cursor-pointer transition-colors duration-200 bg-night-primary hover:bg-night-primary-hover rounded-xl"
        >
          Copy {files + folders} Item(s)
        </button>
      </div>
    </Modal>
  );
}
