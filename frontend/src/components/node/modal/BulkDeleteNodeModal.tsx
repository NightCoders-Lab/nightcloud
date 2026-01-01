import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { bulkDeleteNodes } from "@/api/BulkNodeAPI";
import { useSelectedNodes } from "@/hooks/stores/useSelectedNodes";
import { buildBulkModalTitle } from "@/utils/build/buildBulkModalTitle";
import { buildSuccessToast } from "@/utils/build/buildSuccessToast";
import Modal from "../../Modal";

export default function BulkDeleteNodeModal() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const queryParams = new URLSearchParams(location.search);
  const action = queryParams.get("action");
  const scope = queryParams.get("scope");
  const parentId = location.pathname.split("/").pop() || null; // Obtener el parentId de la URL
  const { selectedNodes } = useSelectedNodes();
  const isOpen = action === "delete" && scope === "bulk" && selectedNodes.length > 0;
  const closeModal = () => navigate(location.pathname, { replace: true }); // Remover los query params

  const { mutate } = useMutation({
    mutationFn: () => bulkDeleteNodes(selectedNodes.map((n) => n.id)),
    onSuccess: () => {
      // Invalidar la caché para refrescar los datos
      queryClient.invalidateQueries({
        queryKey: ["nodes", parentId ?? "root"],
      });
      queryClient.invalidateQueries({ queryKey: ["cloudStats"] });

      // Mostrar toast de éxito
      buildSuccessToast("delete", selectedNodes);

      closeModal();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleDeleteNode = () => {
    mutate();
  };

  // Contar archivos y carpetas seleccionadas
  const files = selectedNodes.filter((n) => !n.isDir).length;
  const folders = selectedNodes.filter((n) => n.isDir).length;
  // Construir el título del modal dinámicamente
  const modalTitle = buildBulkModalTitle("delete", files, folders);

  return (
    <Modal title={modalTitle} open={isOpen} close={closeModal}>
      <div className="mt-5 space-y-10">
        <p className="text-night-muted leading-relaxed">
          You are about to permanently delete the selected items. This action
          will permanently remove them and cannot be undone.
        </p>
        <button
          onClick={handleDeleteNode}
          className="w-full p-3 font-bold text-white uppercase cursor-pointer transition-colors duration-200 bg-night-primary hover:bg-night-primary-hover rounded-xl"
        >
          Delete {files + folders} Item(s)
        </button>
      </div>
    </Modal>
  );
}
