import { useAppStore } from "@/stores/useAppStore";
import type { NodeType } from "@/types";

/**
 * @description Hook para manejar la lógica del explorador de archivos, incluyendo navegación, selección y breadcrumb.
 * @returns {Object} Estado y funciones del explorador de archivos
 */
export function useExplorer() {
  const {
    currentFolderId,
    enterFolder,
    goBack,
    contextRootId,
    setContextRootId,
    selectFolder,
    selectedFolderId,
    resetExplorer,
    resetToLiteralRoot,
    breadcrumb,
    breadcrumbGoTo,
    breadcrumbPush,
    breadcrumbReset,
    breadcrumbPop,
  } = useAppStore();

  // Determinar si estamos en el root literal
  const isInLiteralRoot =
    currentFolderId === undefined && contextRootId === undefined;

  // Determinar si estamos en el root lógico (del breadcrumb)
  const isAtLogicalRoot = breadcrumb.length <= 1;

  // Obtener el currentFolderId efectivo (considerando el contextRootId)
  const effectiveCurrentFolderId = currentFolderId ?? contextRootId;

  // Manejar la navegación hacia atrás
  const handleGoBack = () => {
    // Si ya estamos en root, no hacer nada
    if (isInLiteralRoot) return;

    // Si estamos en el root lógico, resetear al root literal
    if (isAtLogicalRoot) {
      resetToLiteralRoot();
      breadcrumbReset({
        id: undefined,
        name: "Root",
        parentId: null,
      });
      return;
    }

    // Nodo padre en el breadcrumb
    const parent = breadcrumb.at(-2);
    // Si no se encuentra, no hacer nada
    if (!parent) return;

    // Navegar a la carpeta padre
    goBack(parent.id);
    breadcrumbPop();
  };

  // Manejar la entrada a una carpeta
  const handleEnterFolder = (node: NodeType) => {
    enterFolder(node.id);
    breadcrumbPush({ id: node.id, name: node.name, parentId: node.parentId });
  };

  // Resetear el explorador a un nodo raíz específico o al root literal
  const resetToNode = (rootNode?: NodeType) => {
    // Resetear el explorador al nodo raíz proporcionado o al root literal
    resetExplorer(rootNode?.id);

    // Resetear el breadcrumb
    breadcrumbReset(
      rootNode
        ? {
            // Si existe un nodo raíz, usar sus datos
            id: rootNode.id,
            name: rootNode.name,
            parentId: rootNode.parentId,
          } // Si no, usar el root literal
        : { id: undefined, name: "Root", parentId: null }
    );

    // Seleccionar el nodo raíz proporcionado o deseleccionar
    selectFolder(rootNode?.id);
  };

  // Manejar el reseteo del explorador
  const handleResetExplorer = (rootNode?: NodeType) => {
    resetToNode(rootNode); // Reutilizar la función de reseteo
  };

  // Manejar la navegación a través del breadcrumb
  const handleGoToBreadcrumb = (id?: NodeType["id"]) => {
    // Si ya estamos en esa carpeta, no hacer nada
    if (id === currentFolderId) return;

    // Nodo padre en el breadcrumb
    const parent = breadcrumb.find((n) => n.id === id);
    // Si no se encuentra, no hacer nada
    if (!parent) return;

    // Navegar a la carpeta seleccionada en el breadcrumb
    enterFolder(parent.id);
    breadcrumbGoTo(id);
  };

  // Manejar la selección de una carpeta
  const handleSelectFolder = (id?: string | undefined) => {
    // Determinar el fallbackId que deberia ser la carpeta actual
    const fallbackId = effectiveCurrentFolderId;

    // Si se intenta seleccionar la carpeta actual, no hacer nada
    if (id === fallbackId && selectedFolderId === fallbackId) {
      return;
    }

    // Si ya está seleccionada, deseleccionarla seleccionando la carpeta actual siempre
    if (selectedFolderId === id) {
      selectFolder(fallbackId);
      return;
    }

    // Seleccionar la carpeta con el id proporcionado
    selectFolder(id);
  };

  // Retornar el estado y las funciones del explorador
  return {
    currentFolderId,
    selectedFolderId,
    contextRootId,
    setContextRootId,
    breadcrumb,
    enterFolder: handleEnterFolder,
    goBack: handleGoBack,
    resetExplorer: handleResetExplorer,
    goToBreadcrumb: handleGoToBreadcrumb,
    selectFolder: handleSelectFolder,
  };
}
