import type { StateCreator } from "zustand";
import type {
  ContextMenuRegistry,
  ContextMenuType,
} from "@/types/contextMenu.types";

export type ContextMenuState = {
  isOpen: boolean;
  type: ContextMenuType | null;
  position: { x: number; y: number };
  payload: unknown;
  openCtx: <T extends ContextMenuType>(
    type: T,
    x: number,
    y: number,
    ...args: ContextMenuRegistry[T] extends void ? [] : [ContextMenuRegistry[T]]
  ) => void;

  closeCtx: () => void;
};

export const createContextMenuSlice: StateCreator<ContextMenuState> = (set) => ({
  isOpen: false,
  type: null,
  position: { x: 0, y: 0 },
  payload: null,
  openCtx: (type, x, y, ...args) => {
    const payload = args[0] ?? null;
    set({ isOpen: true, type, position: { x, y }, payload });
  },
  closeCtx: () => {
    set({ isOpen: false, type: null, payload: null });
  },
});
