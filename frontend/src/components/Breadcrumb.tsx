import type { AncestorType } from "@/types";
import classNames from "@/utils/classNames";
import { useDroppable } from "@dnd-kit/core";
import { HiChevronRight } from "react-icons/hi";
import { Link } from "react-router-dom";

type BreadcrumbProps = {
  n: Pick<AncestorType, "id" | "name" | "parentId">;
};

export default function Breadcrumb({ n }: Readonly<BreadcrumbProps>) {
  const { isOver, setNodeRef } = useDroppable({
    id: n.id,
    data: {
      dropAction: "breadcrumb_dropable", // Para identificar droppables por feat en el futuro
      ...n,
    },
  });

  const isRoot = n.id === "breadcrumb:root";

  return (
    <>
      <Link
        ref={setNodeRef}
        className={classNames(
          isOver
            ? "bg-night-primary/20 text-night-primary ring-1 ring-night-primary/30"
            : "text-night-muted hover:text-night-text hover:bg-night-primary/10",
          "inline-block truncate max-w-30 px-2 py-1 rounded-md transition-colors duration-150"
        )}
        key={n.id}
        to={isRoot ? `/` : `/directory/${n.id}`}
      >
        {n.name}
      </Link>
      <HiChevronRight className="w-6 h-6 text-night-muted/40" />
    </>
  );
}
