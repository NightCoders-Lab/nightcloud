import { useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import Modal from "../../Modal";
import CreateFolderForm from "../form/CreateFolderForm";
import type { NodeFolderFormData } from "@/types";
import { useEffect, useState } from "react";
import { useCreateNodeFolder } from "@/hooks/nodes/useCreateNodeFolder";

export default function CreateFolderModal() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const isOpen = queryParams.get("action") === "create-folder";
  const closeModal = () => navigate(location.pathname, { replace: true }); // Limpia los query params
  const parentId = location.pathname.split("/").pop() || null; // Obtener el parentId de la URL
  const [clicked, setClicked] = useState(false);
  const { createNodeFolder } = useCreateNodeFolder();

  const initialValues: NodeFolderFormData = {
    name: "",
  };

  const {
    register,
    reset,
    handleSubmit,
    formState: { errors },
    setFocus,
  } = useForm({ defaultValues: initialValues });

  const handleSuccess = () => {
    closeModal();
    reset();
    setClicked(false);
  };

  const handleCreateFolder = (formData: NodeFolderFormData) => {
    if (clicked) return; // Prevenir múltiples clics
    const data = {
      ...formData,
      parentId,
    };
    createNodeFolder(data, {
      onSuccess: handleSuccess,
    });
    setClicked(true);
  };

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

  return (
    <Modal title="Create New Folder" open={isOpen} close={closeModal}>
      <form
        className="space-y-8"
        onSubmit={handleSubmit(handleCreateFolder)}
        noValidate
      >
        <CreateFolderForm register={register} errors={errors} />
        <button
          type="submit"
          disabled={clicked}
          className="w-full p-3 font-bold text-white uppercase transition-colors cursor-pointer bg-night-primary hover:bg-night-primary-hover rounded-xl disabled:cursor-not-allowed disabled:opacity-50"
        >
          {clicked ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-t-transparent border-night-text rounded-full animate-spin" />
              <span>Creating Folder...</span>
            </div>
          ) : (
            <span>Create Folder</span>
          )}
        </button>
      </form>
    </Modal>
  );
}
