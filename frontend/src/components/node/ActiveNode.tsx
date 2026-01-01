import { FileCategoryIcons } from "@/data/fileCategoryIcons";
import type { NodeType } from "@/types";
import classNames from "@/utils/classNames";
import { getCategoryFromMime } from "@/utils/files/getCategoryFromExtAndMime";
import { useDndContext } from "@dnd-kit/core";
import { useQueryClient } from "@tanstack/react-query";
import { FaFolder } from "react-icons/fa6";

type ActiveNodeProps = {
  nodes: NodeType[];
};

export default function ActiveNode({ nodes }: Readonly<ActiveNodeProps>) {
  const { active, over } = useDndContext();
  const queryClient = useQueryClient();
  if (!active) return null;
  const node = nodes.find((n) => n.id === active.id);
  if (!node) return null;

  // Buscar si el nodo sobre el que se está arrastrando es un directorio válido
  const ancestors =
    queryClient.getQueryData<NodeType[]>(["ancestors", node.parentId]) || [];
  const overValidNode = nodes.find((n) => n.id === over?.id && n.isDir);
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

  // Determinar el icono del nodo arrastrandose
  const category = getCategoryFromMime(node.mime);
  const Icon = node.isDir ? FaFolder : FileCategoryIcons[category];

  return (
    <div
      className={classNames(
        opacityClass,
        "cursor-grabbing flex items-center gap-4 px-4 py-3 rounded-lg border border-night-border/50 bg-night-surface shadow-lg w-60 transition-all duration-200"
      )}
    >
      <div className="w-8 h-8 flex items-center justify-center bg-night-muted/10 rounded-md">
        <Icon className="w-5 h-5 text-night-muted" />
      </div>
      <span className="truncate font-medium">{node.name}</span>
    </div>
  );
}
