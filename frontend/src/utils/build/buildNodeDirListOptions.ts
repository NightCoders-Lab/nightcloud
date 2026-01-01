import type { ListOption } from "@/stores/listSlice";
import type { NodeType } from "@/types";
import { FaFolder } from "react-icons/fa6";

export default function buildNodeDirListOptions(
  nodes: NodeType[]
): ListOption[] {
  const result = [];

  result.push(
    ...nodes
      .filter((n) => n.isDir)
      .map((n) => ({
        id: n.id,
        icon: FaFolder,
        name: n.name,
      }))
  );

  return result;
}
