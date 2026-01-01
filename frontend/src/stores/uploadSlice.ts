import type { StateCreator } from "zustand";

export type UploadSliceType = {
  upload: {
    isUploading: boolean;
    progress: number;
    status: "idle" | "uploading" | "success" | "error";
    controller: AbortController | null;
    setProgress: (p: number) => void;
    setController: (c: AbortController) => void;
    start: () => void;
    cancel: () => void;
    finish: () => void;
    fail: () => void;
    reset: () => void;
  };
};

export const createUploadSlice: StateCreator<UploadSliceType> = (set, get) => ({
  upload: {
    isUploading: false,
    progress: 0,
    status: "idle",
    controller: null,
    setProgress: (p: number) => {
      set((state) => ({
        upload: { ...state.upload, progress: p },
      }));
    },
    setController: (controller) => {
      set((state) => ({
        upload: { ...state.upload, controller },
      }));
    },
    start: () => {
      set((state) => ({
        upload: { ...state.upload, isUploading: true, status: "uploading" },
      }));
    },
    cancel: () => {
      // Abortar la subida si hay un controlador
      const controller = get().upload.controller;
      // Si existe, abortar la petición
      if (controller) {
        controller.abort();
      }
      // Resetear el estado de la subida
      set((state) => ({
        upload: {
          ...state.upload,
          isUploading: false,
          status: "idle",
          controller: null,
          progress: 0,
        },
      }));
    },
    finish: () => {
      set((state) => ({
        upload: { ...state.upload, isUploading: false, status: "idle" },
      }));
    },
    fail: () => {
      set((state) => ({
        upload: { ...state.upload, isUploading: false, status: "error" },
      }));
    },
    reset: () => {
      set((state) => ({
        upload: {
          ...state.upload,
          isUploading: false,
          status: "idle",
          progress: 0,
        },
      }));
    },
  },
});
