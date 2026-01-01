import {
  HiOutlineDownload,
  HiOutlineDuplicate,
  HiOutlineFolderOpen,
  HiTrash,
  HiX,
} from "react-icons/hi";
import { useNavigate } from "react-router-dom";
import { useSelectedNodes } from "@/hooks/stores/useSelectedNodes";
import { AnimatePresence, motion } from "framer-motion";

export default function NodeBulkActions() {
  const { selectedNodes, setSelectedNodes } = useSelectedNodes();
  const navigate = useNavigate();

  const handleAction = (action: string) => {
    navigate(`${location.pathname}?action=${action}&scope=bulk`);
  };

  return (
    <AnimatePresence mode="wait">
      {selectedNodes.length > 0 && (
        <motion.div
          key="bulk-actions"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="flex items-center gap-2 px-2 py-1 rounded-lg bg-night-surface/60 backdrop-blur-md border border-night-border/40"
        >
          <span className="text-sm font-semibold text-night-muted px-2">
            {selectedNodes.length} selected
          </span>
          {/* Copiar */}
          <button
            onClick={() => handleAction("copy")}
            className="flex items-center justify-center w-9 h-9 rounded-md bg-night-surface/40 hover:bg-night-border/50 hover:cursor-pointer border border-night-border/30 transition-colors"
          >
            <HiOutlineDuplicate className="w-5 h-5" />
          </button>
          {/* Mover */}
          <button
            onClick={() => handleAction("move")}
            className="flex items-center justify-center w-9 h-9 rounded-md bg-night-surface/40 hover:bg-night-border/50 hover:cursor-pointer border border-night-border/30 transition-colors"
          >
            <HiOutlineFolderOpen className="w-5 h-5" />
          </button>
          {/* Descargar */}
          <button
            onClick={() => handleAction("download")}
            className="flex items-center justify-center w-9 h-9 rounded-md bg-night-surface/40 hover:bg-night-border/50 hover:cursor-pointer border border-night-border/30 transition-colors"
          >
            <HiOutlineDownload className="w-5 h-5" />
          </button>
          {/* Eliminar */}
          <button
            onClick={() => handleAction("delete")}
            className="flex items-center justify-center w-9 h-9 rounded-md bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:cursor-pointer border border-red-500/30 transition-colors"
          >
            <HiTrash className="w-5 h-5" />
          </button>
          {/* Cancelar selección */}
          <button
            className="flex items-center justify-center w-9 h-9 rounded-md hover:bg-night-border/50 hover:cursor-pointer transition-colors"
            onClick={() => setSelectedNodes([])}
          >
            <HiX className="w-5 h-5 text-night-muted" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
