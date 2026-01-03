import type { NodeSearchType, NodeType } from "@/types";
import { buildBulkModalTitle } from "@/utils/build/buildBulkModalTitle";
import classNames from "@/utils/classNames";
import { useDndContext } from "@dnd-kit/core";
import { useQueryClient } from "@tanstack/react-query";
import { LuFiles } from "react-icons/lu";

type MultiNodePreviewProps = {
  nodes: NodeType[] | NodeSearchType[];
  tableNodes: NodeType[] | NodeSearchType[];
};

export default function MultiNodePreview({
  nodes,
  tableNodes,
}: Readonly<MultiNodePreviewProps>) {
  const { active, over } = useDndContext();
  const queryClient = useQueryClient();
  if (!active) return null;
  const parentId = nodes[0].parentId;

  // Buscar si el nodo sobre el que se está arrastrando es un directorio válido
  const ancestors =
    queryClient.getQueryData<NodeType[]>(["ancestors", parentId]) || [];
  const overValidNode = tableNodes.find((n) => n.id === over?.id && n.isDir);
  const overValidBreadcrumb = ancestors.find(
    (n) => n.id === over?.id && n.isDir
  );
  const overRoot = over?.id === "breadcrumb:root";

  // Determinar la opacidad según si está sobre un nodo válido o breadcrumb válido
  let opacityClass = "opacity-100";
  if (overValidBreadcrumb || overRoot) {
    opacityClass = "opacity-20"; // Más transparente si es breadcrumb para que se vea mejor la carpeta destino
  } else if (overValidNode) {
    opacityClass = "opacity-50"; // Menos transparente si es un nodo válido ya que se ve mejor
  }

  // Construir el texto de la vista previa múltiple
  const folderCount = nodes.filter((n) => n.isDir).length;
  const fileCount = nodes.length - folderCount;
  const parts: string[] = [];
  if (folderCount > 0)
    parts.push(`${folderCount} folder${folderCount === 1 ? "" : "s"}`);
  if (fileCount > 0)
    parts.push(`${fileCount} file${fileCount === 1 ? "" : "s"}`);
  const text = parts.join(" and ");

  return (
    <div
      className={classNames(
        opacityClass,
        "cursor-grabbing flex items-center gap-4 px-4 py-3 rounded-lg border border-night-border/50 bg-night-surface shadow-lg w-60 transition-all duration-200"
      )}
    >
      <div className="w-8 h-8 flex items-center justify-center bg-night-muted/10 rounded-md">
        <LuFiles className="w-5 h-5 text-night-muted" />
      </div>
      <span className="truncate font-medium">{text}</span>
    </div>
  );
}
