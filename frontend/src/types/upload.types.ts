import type { FileWithPath } from "react-dropzone";
import type { NodeType } from ".";

// Type para el progreso de subida de archivos
export type UploadProgress = {
  loaded: number;
  total: number;
  percent: number;
};

// Type para el estado de la subida
export type UploadStatus =
  | "queued"
  | "uploading"
  | "success"
  | "error"
  | "cancelled";

// Type para un trabajo de subida
export type UploadJob = {
  id: string;
  files: FileWithPath[];
  parentId: string | null;
  status: UploadStatus;
  progress: number;
  controller?: AbortController;
  serverData?: NodeType[];
  error?: unknown;
};
