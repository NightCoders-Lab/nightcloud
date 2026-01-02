import { useLocation, useNavigate } from "react-router-dom";
import Modal from "../Modal";
import UploadDropzone from "./UploadDropzone";
import { useUploadFiles } from "@/hooks/upload/useUploadFiles";
import UploadStagingList from "./UploadStagingList";
import { useMemo } from "react";
import NodeExplorer from "../node/explorer/NodeExplorer";
import { useExplorer } from "@/hooks/explorer/useExplorer";
import { useUploadStage } from "@/hooks/upload/useUploadStage";

export default function ModalDropzone() {
  const location = useLocation();
  const navigate = useNavigate();
  const { stagedFiles, clearStagedFiles } = useUploadStage();
  const queryParams = new URLSearchParams(location.search);
  const isOpen = queryParams.get("action") === "upload-files";
  const closeModal = () => navigate(location.pathname, { replace: true }); // Limpia los query params
  const { selectedFolderId } = useExplorer();
  const { uploadFiles } = useUploadFiles(selectedFolderId ?? null);
  const filesToUpload = useMemo(
    () => stagedFiles.map((f) => f.file),
    [stagedFiles]
  );

  const handleOnUpload = () => {
    uploadFiles(filesToUpload);
    closeModal();
    clearStagedFiles();
  };

  return (
    <Modal title="Upload Files" size="large" open={isOpen} close={closeModal}>
      <UploadDropzone />
      <div className="grid grid-cols-1 gap-6 mt-12 text-night-muted text-sm">
        <div className="flex flex-col gap-4">
          <NodeExplorer />
        </div>
        <span className="tracking-wider font-semibold">
          Staged Files for Upload ({stagedFiles.length} / 10000 files):
        </span>
        <UploadStagingList />

        <button
          className="self-end bg-night-primary hover:bg-night-primary-hover hover:cursor-pointer transition duration-200 rounded-lg py-2 px-4 text-night-text font-semibold disabled:cursor-not-allowed disabled:bg-night-border/80 disabled:opacity-50"
          onClick={handleOnUpload}
          disabled={stagedFiles.length === 0}
        >
          Start Upload
        </button>
      </div>
    </Modal>
  );
}
