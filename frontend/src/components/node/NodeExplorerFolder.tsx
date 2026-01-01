import type { NodeType } from "@/types";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { FaFolder, FaFolderOpen } from "react-icons/fa6";

type NodeExplorerFolderProps = {
  node: NodeType;
  enterFolder: (node: NodeType) => void;
};
export default function NodeExplorerFolder({
  node,
  enterFolder,
}: Readonly<NodeExplorerFolderProps>) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.button
      type="button"
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      onClick={() => enterFolder(node)}
      className="flex items-center gap-3 hover:cursor-pointer select-none flex-1 min-w-0"
    >
      <motion.div
        animate={hovered ? { x: 4 } : { x: 0 }}
        transition={{ duration: 0.12 }}
        className="flex items-center gap-3 flex-1 min-w-0 text-night-muted hover:text-night-text"
      >
        <div className="w-6 h-6 flex items-center justify-center">
          <AnimatePresence mode="wait" initial={false}>
            {hovered ? (
              <motion.span
                key="open"
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 4 }}
                transition={{
                  duration: 0.185,
                }}
              >
                <FaFolderOpen size={24} className="shrink-0" />
              </motion.span>
            ) : (
              <motion.span
                key="closed"
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 4 }}
                transition={{
                  duration: 0.185,
                }}
              >
                <FaFolder size={22} className="shrink-0 text-night-muted" />
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <span
          className={`truncate ${
            hovered ? "text-night-text" : "text-night-muted"
          }`}
        >
          {node.name}
        </span>
      </motion.div>
    </motion.button>
  );
}
