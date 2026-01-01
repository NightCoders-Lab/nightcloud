import type { StateCreator } from "zustand";

type BreadcrumbNode = {
  id?: string;
  name: string;
  parentId: string | null;
};

export type BreadcrumbSliceType = {
  breadcrumb: BreadcrumbNode[];
  breadcrumbPush: (node: BreadcrumbNode) => void;
  breadcrumbPop: () => void;
  breadcrumbGoTo: (id?: string) => void;
  breadcrumbReset: (root: BreadcrumbNode) => void;
};

export const createBreadcrumbSlice: StateCreator<BreadcrumbSliceType> = (
  set
) => ({
  breadcrumb: [],
  breadcrumbPush: (node) => {
    // Agregar un nuevo nodo al breadcrumb
    set((state) => ({
      breadcrumb: [...state.breadcrumb, node],
    }));
  },
  breadcrumbPop: () => {
    // Eliminar el último nodo del breadcrumb
    set((s) => ({
      breadcrumb: s.breadcrumb.slice(0, -1),
    }));
  },
  breadcrumbGoTo: (id) => {
    set((s) => {
      // Encontrar el índice del nodo al que queremos ir
      const idx = s.breadcrumb.findIndex((n) => n.id === id);

      // Si no se encuentra, no hacer nada
      if (idx === -1) return s;

      // Cortar el breadcrumb hasta ese índice
      return {
        breadcrumb: s.breadcrumb.slice(0, idx + 1),
      };
    });
  },
  breadcrumbReset: (root) => {
    // Reiniciar el breadcrumb con el nodo raíz proporcionado
    set({
      breadcrumb: [root],
    });
  },
});
