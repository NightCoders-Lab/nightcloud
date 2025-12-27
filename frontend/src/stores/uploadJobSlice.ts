import type { StateCreator } from "zustand";
import { nanoid } from "nanoid";
import type { UploadJob } from "@/types/upload.types";
import type { FileWithPath } from "react-dropzone";
import type { NodeType } from "@/types";
import { chunk } from "@/utils/chunk";

export type UploadJobSliceType = {
  // Cola de trabajos de subida
  queue: UploadJob[];
  active: UploadJob[];
  completed: UploadJob[];
  failed: UploadJob[];
  cancelled: UploadJob[];
  // Configuración de la subida
  maxConcurrency: number;
  paused: boolean;

  // Agregar trabajos a la cola
  enqueue: (files: FileWithPath[], parentId: string | null) => void;

  // Control de la subida
  startJob: (jobId: string) => UploadJob | undefined;
  updateProgress: (jobId: string, progress: number) => void;
  completeJob: (jobId: string, data: NodeType[]) => void;
  failJob: (jobId: string, error: unknown) => void;

  cancelJob: (jobId: string) => void;
  cancelAll: () => void;
  pauseAll: () => void;
  resumeAll: () => void;
};

// Límite de archivos a subir simultáneamente (configurable vía variable de entorno)
const uploadLimit = Number(import.meta.env.VITE_API_UPLOAD_FILES_LIMIT) || 10;

export const createUploadJobSlice: StateCreator<UploadJobSliceType> = (
  set,
  get
) => ({
  // Cola de trabajos de subida
  queue: [],
  active: [],
  completed: [],
  failed: [],
  cancelled: [],
  // Configuración de la subida
  maxConcurrency: uploadLimit,
  paused: false,

  // Acciones

  // Agregar trabajos a la cola
  enqueue: (files, parentId) => {
    // Dividir los archivos en batches según el límite de subida
    const batches = chunk(files, uploadLimit);

    set((state) => ({
      queue: [
        // Mantener los trabajos existentes en la cola
        ...state.queue,
        ...batches.map((batch) => ({
          id: nanoid(),
          files: batch,
          parentId,
          status: "queued" as const,
          progress: 0,
        })),
      ],
    }));
  },

  // Iniciar un trabajo de subida
  startJob: (jobId) => {
    // Buscar el trabajo en la cola
    const { queue } = get();
    // Si no se encuentra, no hacer nada
    const job = queue.find((j) => j.id === jobId);
    if (!job) return;

    // Crear un controlador de aborto para el trabajo (para poder cancelar la subida)
    const controller = new AbortController();

    // Mover el trabajo de la cola a la lista de trabajos activos
    set((state) => ({
      // Eliminar el trabajo de la cola
      queue: state.queue.filter((j) => j.id !== jobId),
      // Agregar el trabajo a la lista de activos
      active: [
        // Mantener los trabajos activos existentes
        ...state.active,
        // Agregar el trabajo que se va a iniciar, actualizando su estado y asignándole el controlador
        {
          ...job,
          status: "uploading",
          controller,
        },
      ],
    }));

    // Devolver el trabajo iniciado con su controlador
    return { ...job, controller };
  },

  // Actualizar el progreso de un trabajo activo
  updateProgress: (jobId, progress) => {
    // Actualizar el progreso del trabajo en la lista de activos
    set((state) => ({
      active: state.active.map((j) =>
        j.id === jobId ? { ...j, progress } : j
      ),
    }));
  },

  // Completar un trabajo activo
  completeJob: (jobId, data) => {
    // Mover el trabajo de la lista de activos a la lista de completados
    set((state) => {
      // Buscar el trabajo en la lista de activos
      const job = state.active.find((j) => j.id === jobId);
      // Si no se encuentra, no hacer nada
      if (!job) return state;

      // Mover el trabajo a la lista de completados
      return {
        // Eliminar el trabajo de la lista de activos
        active: state.active.filter((j) => j.id !== jobId),
        // Agregar el trabajo a la lista de completados
        completed: [
          ...state.completed,
          { ...job, status: "success", serverData: data },
        ],
      };
    });
  },

  // Marcar un trabajo activo como fallido
  failJob: (jobId, error) => {
    set((state) => {
      // Buscar el trabajo en la lista de activos
      const job = state.active.find((j) => j.id === jobId);
      // Si no se encuentra, no hacer nada
      if (!job) return state;

      // Mover el trabajo a la lista de fallidos
      return {
        // Eliminar el trabajo de la lista de activos
        active: state.active.filter((j) => j.id !== jobId),
        // Agregar el trabajo a la lista de fallidos
        failed: [...state.failed, { ...job, status: "error", error }],
      };
    });
  },

  // Cancelar un trabajo (activo o en cola)
  cancelJob: (jobId) => {
    set((state) => {
      // Abortar la subida si el trabajo está activo
      const activeJob =
        state.active.find((j) => j.id === jobId) ??
        state.queue.find((j) => j.id === jobId);
      if (!activeJob) return state;

      // Abortar la solicitud de subida
      activeJob.controller?.abort();

      // Eliminar el trabajo de la cola o de la lista de activos
      return {
        // Filtrar el trabajo de ambas listas
        queue: state.queue.filter((j) => j.id !== jobId),
        active: state.active.filter((j) => j.id !== jobId),
        // Agregar el trabajo a la lista de cancelados
        cancelled: [...state.cancelled, { ...activeJob, status: "cancelled" }],
      };
    });
  },

  cancelAll: () => {
    // Abortar todas las subidas activas
    get().active.forEach((job) => job.controller?.abort());
    // Limpiar la cola y la lista de activos
    set(() => ({
      queue: [],
      active: [],
    }));
  },

  pauseAll: () => {
    // Pausar todas las subidas
    set(() => ({
      paused: true,
    }));
  },

  resumeAll: () => {
    // Reanudar todas las subidas
    set(() => ({
      paused: false,
    }));
  },
});
