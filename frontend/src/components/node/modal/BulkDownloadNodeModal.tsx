import { useLocation, useNavigate } from "react-router-dom";
import { useSelectedNodes } from "@/hooks/stores/useSelectedNodes";
import Modal from "../../Modal";
import { api } from "@/lib/axios";

export default function BulkDownloadNodeModal() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const action = queryParams.get("action");
  const scope = queryParams.get("scope");
  const { selectedNodes } = useSelectedNodes();
  const isOpen =
    action === "download" && scope === "bulk" && selectedNodes.length > 0;
  const closeModal = () => navigate(location.pathname, { replace: true }); // Remover los query params

  return (
    <Modal title="Download Files" open={isOpen} close={closeModal}>
      <form
        className="mt-5 space-y-10"
        method="POST"
        action={api.defaults.baseURL + "/nodes/bulk/download"}
        onSubmit={closeModal}
      >
        <input
          type="hidden"
          name="nodeIds"
          value={JSON.stringify(selectedNodes.map((n) => n.id))}
        />

        <p className="text-md text-night-muted leading-relaxed">
          The selected items will be packaged into a single compressed archive
          and downloaded to your device. Large downloads may take a few moments
          to start, depending on the total size and your connection.
        </p>

        <input
          type="submit"
          value="Download Selected Items"
          className="w-full p-3 font-bold text-white uppercase cursor-pointer transition-colors duration-200 bg-night-primary hover:bg-night-primary-hover rounded-xl"
        />
      </form>
    </Modal>
  );
}
