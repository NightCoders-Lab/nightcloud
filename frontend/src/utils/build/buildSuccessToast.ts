import type { NodeLiteType, NodeType } from "@/types";
import { toast } from "react-toastify";

type OperationAction = "copy" | "move" | "delete" | "download";

export function buildSuccessToast(
  action: OperationAction,
  data: NodeType | NodeType[] | NodeLiteType | NodeLiteType[]
) {
  let files = 0;
  let folders = 0;

  if (Array.isArray(data)) {
    files = data.filter((n) => !n.isDir).length;
    folders = data.filter((n) => n.isDir).length;
  } else if (data.isDir) {
    folders = 1;
  } else {
    files = 1;
  }

  const parts: string[] = [];

  if (files > 0) {
    parts.push(files === 1 ? "1 File" : `${files} Files`);
  }

  if (folders > 0) {
    parts.push(folders === 1 ? "1 Folder" : `${folders} Folders`);
  }

  const verb: Record<OperationAction, string> = {
    copy: "copied",
    move: "moved",
    delete: "deleted",
    download: "downloaded",
  };

  if (parts.length === 0) {
    return "Operation completed";
  }

  // Ejemplo: "2 Files and 1 Folder copied successfully"
  toast.success(`${parts.join(" and ")} ${verb[action]} successfully`, {
    autoClose: 1000,
  });
}
