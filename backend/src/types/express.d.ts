import type {
  DirectoryNode,
  FileNodeWithBlob,
  Node,
} from "@/domain/nodes/node";
import "express-serve-static-core";

// Agregar tipos personalizados al Response de Express
declare module "express-serve-static-core" {
  interface Response {
    success: (data?: unknown, http?: number) => void;
  }

  interface Request {
    parent?: DirectoryNode;
    node?: Node | FileNodeWithBlob;
    nodes?: Node[] | FileNodeWithBlob[];
  }
}
