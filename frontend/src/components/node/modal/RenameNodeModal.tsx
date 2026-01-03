import type { NodeRenameFormData, NodeType } from "@/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Modal from "../../Modal";
import { renameNode } from "@/api/NodeAPI";
import { useNode } from "@/hooks/nodes/useNode";
import RenameNodeForm from "../form/RenameNodeForm";
import { useEffect, useState } from "react";
import LoadingModal from "@/components/LoadingModal";
import ErrorModal from "@/components/ErrorModal";

export default function RenameNodeModal() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const queryParams = new URLSearchParams(location.search);
  const action = queryParams.get("action");
  const scope = queryParams.get("scope");
  const nodeId = queryParams.get("targetId");
  const isOpen = action === "rename" && scope === "single" && !!nodeId;
  const closeModal = () => navigate(location.pathname, { replace: true }); // Limpia los query params
  const parentId = location.pathname.split("/").pop() || null; // Obtener el parentId de la URL
  const { node } = useNode(nodeId || undefined, "node");
  const [clicked, setClicked] = useState(false);

  const initialValues: NodeRenameFormData = {
    name: "",
  };

  const {
    register,
    reset,
    handleSubmit,
    formState: { errors },
    setFocus,
  } = useForm({ defaultValues: initialValues });

  // Auto focus the name input when the modal opens
  useEffect(() => {
    if (isOpen) {
      // Use a timeout to wait for the Modal animation
      const timer = setTimeout(() => {
        // Focus the specific field name registered in CreateFolderForm
        setFocus("name");
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen, setFocus]);

  const { mutate } = useMutation({
    mutationFn: (data: NodeRenameFormData & { nodeId: NodeType["id"] }) =>
      renameNode(data),
    onSuccess: (data) => {
      // Actualizar la caché de React Query

      // Actualizar el nombre en la lista de nodos hijos
      queryClient.setQueryData(
        ["nodes", parentId ?? "root"],
        (oldData: NodeType[] | undefined) => {
          if (!oldData) return oldData;
          return oldData.map((node) =>
            node.id === data.id ? { ...node, name: data.name } : node
          );
        }
      );

      // Actualizar el nombre del nodo detallado
      queryClient.setQueryData(
        ["node", "details", nodeId],
        (oldData: NodeType | undefined) => {
          if (!oldData) return oldData;
          return { ...oldData, name: data.name };
        }
      );

      // Invalidar la caché de la lista de nodos para recargar en segundo plano (Optimistic Update)
      queryClient.invalidateQueries({
        queryKey: ["nodes", parentId ?? "root"],
      });
      queryClient.invalidateQueries({ queryKey: ["node", "details", nodeId] });

      closeModal();
      toast.success(`${data.isDir ? "Folder" : "File"} renamed successfully`, {
        autoClose: 1000,
      });
      reset();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleRenameNode = (formData: NodeRenameFormData) => {
    if (clicked) return; // Prevenir múltiples clics
    const data = {
      ...formData,
      nodeId: nodeId!,
    };
    mutate(data);
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

  const modalTitle = `Rename ${node.data?.isDir ? "Folder" : "File"}`;
  return (
    <Modal
      title={`${node.error ? "Error" : modalTitle}`}
      open={isOpen}
      close={closeModal}
    >
      {node.data && (
        <form
          className="space-y-8"
          onSubmit={handleSubmit(handleRenameNode)}
          noValidate
        >
          <RenameNodeForm
            register={register}
            errors={errors}
            node={node.data}
          />
          <button
            type="submit"
            disabled={clicked}
            className="w-full p-3 font-bold text-white uppercase transition-colors cursor-pointer bg-night-primary hover:bg-night-primary-hover rounded-xl disabled:cursor-not-allowed disabled:opacity-50"
          >
            {clicked ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-t-transparent border-night-text rounded-full animate-spin" />
                <span>Renaming...</span>
              </div>
            ) : (
              <span>Rename</span>
            )}
          </button>
        </form>
      )}
    </Modal>
  );
}
