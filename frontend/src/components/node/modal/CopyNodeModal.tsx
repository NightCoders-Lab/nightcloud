import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Modal from "../../Modal";
import NodeExplorer from "../NodeExplorer";
import { copyNode } from "@/api/NodeAPI";
import { useNode } from "@/hooks/useNode";
import CopyNodeForm from "../form/CopyNodeForm";
import type { NodeCopyFormData } from "@/types";
import { useForm } from "react-hook-form";
import { useExplorer } from "@/hooks/explorer/useExplorer";
import { useEffect } from "react";
import { buildSuccessToast } from "@/utils/build/buildSuccessToast";

export default function CopyNodeModal() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const queryParams = new URLSearchParams(location.search);
  const action = queryParams.get("action");
  const scope = queryParams.get("scope");
  const nodeId = queryParams.get("targetId");
  const isOpen = action === "copy" && scope === "single" && !!nodeId;
  const parentId = location.pathname.split("/").pop() || null; // Obtener el parentId de la URL
  const { selectedFolderId } = useExplorer();
  const { node } = useNode(nodeId || undefined, "node");

  const initialValues: NodeCopyFormData = {
    name: "",
  };

  const {
    register,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues: initialValues });

  // Setear el nombre inicial del nodo a copiar cuando este disponible luego del fetch
  useEffect(() => {
    if (node.isPlaceholderData || !node.data) return;

    reset({
      name: node.data.name,
    });
  }, [node.data, reset, node.isPlaceholderData]);

  const closeModal = () => navigate(location.pathname, { replace: true }); // Remover los query params

  const { mutate } = useMutation({
    mutationFn: (data: NodeCopyFormData) =>
      copyNode(nodeId!, selectedFolderId ?? null, data.name ?? node.data!.name),
    onSuccess: (data) => {
      // Invalidar la caché para refrescar los datos
      queryClient.invalidateQueries({
        queryKey: ["nodes", parentId ?? "root"],
      });
      queryClient.invalidateQueries({ queryKey: ["cloudStats"] });

      // Mostrar toast de éxito
      buildSuccessToast("copy", data);

      closeModal();
      reset();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleCopyNode = (formData: NodeCopyFormData) => {
    const data = {
      ...formData,
    };
    mutate(data);
  };

  if (node.error) {
    toast.error(node.error.message);
    queryClient.invalidateQueries({ queryKey: ["node", "details", nodeId] });
    return null;
  }

  // Usar una key dinámica para forzar el remount del formulario cuando el node.data cambia
  const formKey = `${nodeId}-${node.isPlaceholderData ? "loading" : "ready"}`;
  return (
    <Modal
      title={`Copy ${node.data?.isDir ? "Folder" : "File"} ${node.data?.name}`}
      open={isOpen}
      close={closeModal}
    >
      {node.loading && <p className="mt-2">Loading...</p>}
      {!node.loading && node.data && (
        <form
          className="mt-5 space-y-10"
          noValidate
          onSubmit={handleSubmit(handleCopyNode)}
        >
          <NodeExplorer />
          <CopyNodeForm
            key={formKey}
            register={register}
            errors={errors}
            isDir={node.data.isDir}
          />
          <input
            type="submit"
            value={`Copy ${node.data.isDir ? "Folder" : "File"}`}
            className="w-full p-3 font-bold text-white uppercase cursor-pointer transition-colors duration-200 bg-night-primary hover:bg-night-primary-hover rounded-xl"
          />
        </form>
      )}
    </Modal>
  );
}
