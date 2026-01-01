import type { StateCreator } from "zustand";

export type ExplorerSliceType = {
  // navegacion
  currentFolderId?: string;

  // seleccion
  selectedFolderId?: string;

  // root logico
  contextRootId?: string;

  // acciones
  enterFolder: (id?: string) => void;
  goBack: (parentId?: string) => void;

  // para tener un root lógico distinto al literal en la URL
  setContextRootId: (id?: string) => void;
  resetToLiteralRoot: () => void;

  // seleccion
  selectFolder: (id?: string) => void;
  resetExplorer: (rootId?: string) => void;
};

export const createExplorerSlice: StateCreator<ExplorerSliceType> = (set) => ({
  currentFolderId: undefined,
  selectedFolderId: undefined,
  contextRootId: undefined,

  // acciones
  enterFolder: (id) => {
    // navegar a la carpeta con id, siempre seleccionandola automaticamente
    set({ currentFolderId: id, selectedFolderId: id });
  },
  goBack: (parentId) => {
    // navegar a la carpeta padre, si se proporciona parentId, seleccionandola automaticamente
    set({ currentFolderId: parentId, selectedFolderId: parentId });
  },

  // root logico
  setContextRootId: (id) => set({ contextRootId: id }),
  resetToLiteralRoot: () => {
    set({
      currentFolderId: undefined,
      selectedFolderId: undefined,
      contextRootId: undefined,
    });
  },

  // seleccion
  selectFolder: (id) => {
    // seleccionar la carpeta con id
    set({ selectedFolderId: id });
  },

  // reset del explorador
  resetExplorer: (rootId) => {
    set({
      currentFolderId: rootId,
      selectedFolderId: rootId,
    });
  },
});
