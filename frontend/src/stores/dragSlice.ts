import type { DragRegistry, DragType } from "@/types/dragActions.types";
import type { StateCreator } from "zustand";

export type DragSliceType = {
  drag: {
    // Estado del drag and drop
    isDragging: boolean;
    isDropping: boolean;
    type: DragType | null;
    active: unknown;
    target: unknown;

    // Acciones para manejar el drag and drop
    startDrag: <T extends DragType>(type: T, data: DragRegistry[T]) => void;
    setOver: (data: unknown) => void;
    setDropping: (dropping: boolean) => void;
    endDrag: () => void;
  };
};

export const createDragSlice: StateCreator<DragSliceType> = (set) => ({
  drag: {
    isDragging: false,
    isDropping: false,
    type: null,
    active: null,
    target: null,

    startDrag: (type, data) => {
      set((state) => ({
        drag: {
          ...state.drag,
          isDragging: true,
          type,
          active: data,
          target: null,
        },
      }));
    },

    setOver: (data) => {
      set((state) => ({
        drag: {
          ...state.drag,
          target: data,
        },
      }));
    },

    setDropping: (dropping) => {
      set((state) => ({
        drag: {
          ...state.drag,
          isDropping: dropping,
        },
      }));
    },

    endDrag: () => {
      set((state) => ({
        drag: {
          ...state.drag,
          isDragging: false,
          type: null,
          active: null,
          target: null,
        },
      }));
    },
  },
});
