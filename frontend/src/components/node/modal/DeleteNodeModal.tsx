import { useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Modal from "../../Modal";
import { useNode } from "@/hooks/nodes/useNode";
import LoadingModal from "@/components/LoadingModal";
import ErrorModal from "@/components/ErrorModal";
import { useState } from "react";
import { useDeleteNode } from "@/hooks/nodes/useDeleteNode";

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
  const { node } = useNode(nodeId || undefined, "node");
  const [clicked, setClicked] = useState(false);
  const { deleteNode } = useDeleteNode();

  const handleSuccess = () => {
    closeModal();
    setClicked(false);
  };

  const handleDeleteNode = () => {
    if (clicked) return; // Prevenir múltiples clics
    deleteNode(node.data!, {
      onSuccess: handleSuccess,
    });
    setClicked(true);
  };

  if (node.loading) {
    return <LoadingModal isOpen={isOpen} closeModal={closeModal} />;
  }

  if (node.error) {
    toast.error(node.error.message);
    queryClient.invalidateQueries({ queryKey: ["node", "details", nodeId] });
    return (
      <ErrorModal
        message={
          "An error occurred while loading, are you sure this file/folder exists?"
        }
        isOpen={isOpen}
        closeModal={closeModal}
      />
    );
  }

  return (
    <Modal
      title={`Delete ${node.data?.isDir ? "Folder" : "File"}`}
      open={isOpen}
      close={closeModal}
    >
      {node.data && (
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
            disabled={clicked}
            className="w-full p-3 font-bold text-white uppercase cursor-pointer transition-colors duration-200 bg-red-500 hover:bg-red-700 rounded-xl disabled:cursor-not-allowed disabled:opacity-50"
          >
            {clicked ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-t-transparent border-night-text rounded-full animate-spin" />
                <span>Deleting...</span>
              </div>
            ) : (
              <span>Delete</span>
            )}
          </button>
        </div>
      )}
    </Modal>
  );
}
