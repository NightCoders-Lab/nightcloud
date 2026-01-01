import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Modal from "../../Modal";
import { deleteNode } from "@/api/NodeAPI";
import { useNode } from "@/hooks/useNode";

export default function DeleteNodeModal() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const queryParams = new URLSearchParams(location.search);
  const action = queryParams.get("action");
  const scope = queryParams.get("scope");
  const nodeId = queryParams.get("targetId");
  const isOpen = action === "delete" && scope === "single" && !!nodeId;
  const closeModal = () => navigate(location.pathname, { replace: true }); // Limpia los query params
  const parentId = location.pathname.split("/").pop() || null; // Obtener el parentId de la URL
  const { node } = useNode(nodeId || undefined, "node");

  const { mutate } = useMutation({
    mutationFn: () => deleteNode(nodeId!),
    onSuccess: () => {
      // Invalidar la caché para refrescar los datos
      queryClient.invalidateQueries({
        queryKey: ["nodes", parentId ?? "root"],
      });
      queryClient.invalidateQueries({ queryKey: ["node", "details", nodeId] });
      queryClient.invalidateQueries({ queryKey: ["cloudStats"] });

      closeModal();
      toast.success(
        `${node.data?.isDir ? "Folder" : "File"} deleted successfully`,
        {
          autoClose: 1000,
        }
      );
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleDeleteNode = () => {
    mutate();
  };

  if (node.error) {
    toast.error(node.error.message);
    queryClient.invalidateQueries({ queryKey: ["node", "details", nodeId] });
    return null;
  }

  return (
    <Modal
      title={`Delete ${node.data?.isDir ? "Folder" : "File"}`}
      open={isOpen}
      close={closeModal}
    >
      {node.loading && <p className="mt-2">Loading...</p>}
      {!node.loading && node.data && (
        <div className="mt-5 space-y-10">
          <p className="text-night-muted tracking-wider">
            {node.data.isDir ? (
              <>
                Are you sure you want to delete the folder{" "}
                <span className="font-bold whitespace-nowrap">
                  {""}"
                  <span className="truncate max-w-40 inline-block align-bottom">
                    {node.data.name}
                  </span>
                  {""}"
                </span>{" "}
                and all its contents? This action cannot be undone.
              </>
            ) : (
              <>
                Are you sure you want to delete the file{" "}
                <span className="font-bold truncate max-w-20">
                  {node.data.name}
                </span>
                {""}? This action cannot be undone.
              </>
            )}
          </p>
          <button
            onClick={handleDeleteNode}
            className="w-full p-3 font-bold text-white uppercase cursor-pointer transition-colors duration-200 bg-red-500 hover:bg-red-700 rounded-xl"
          >
            {`Delete ${node.data.isDir ? "Folder" : "File"}`}
          </button>
        </div>
      )}
    </Modal>
  );
}
