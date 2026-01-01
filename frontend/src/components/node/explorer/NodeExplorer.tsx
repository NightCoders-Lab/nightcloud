import { useNode } from "@/hooks/useNode";
import { useExplorer } from "@/hooks/explorer/useExplorer";
import { useExplorerContext } from "@/hooks/explorer/useExplorerContext";
import { useExplorerInitialization } from "@/hooks/explorer/useExplorerInitialization";
import NodeExplorerHeader from "./NodeExplorerHeader";
import NodeExplorerCurrentFolder from "./NodeExplorerCurrentFolder";
import NodeExplorerItem from "./NodeExplorerItem";

export default function NodeExplorer() {
  const { currentFolderId, contextRootId } = useExplorer();

  // Sincronizar el contextRootId con la URL
  const { rootParentId } = useExplorerContext();

  // Obtener los datos del nodo actual y sus hijos
  const { node, children } = useNode(
    currentFolderId ?? contextRootId,
    "node+children"
  );

  // Inicializar el explorador con el rootParentId y el nodeData actual
  useExplorerInitialization(rootParentId || undefined, node.data);

  return (
    <div className="flex flex-col gap-2">
      {/* Title */}
      <span className="tracking-wider mb-3 text-md font-semibold">
        Select destination folder:
      </span>

      <div className="flex justify-between items-center gap-2 text-sm text-night-muted">
        <NodeExplorerHeader />
      </div>

      {/* Contenedor del explorador */}
      <div className="max-h-64 overflow-y-auto border border-night-border rounded-lg p-3">
        {/* Current folder (siempre aparece) */}
        <NodeExplorerCurrentFolder node={node.data} />

        {/* Separador */}
        <div className="my-3 border-t border-night-border/50" />

        <NodeExplorerItem nodeChildren={children} />
      </div>
    </div>
  );
}
