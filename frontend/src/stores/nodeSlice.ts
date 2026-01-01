import type { StateCreator } from "zustand";
import type { NodeSearchType, NodeType } from "@/types/index";

export type NodeSliceType = {
  selectedNodes: NodeType[] | NodeSearchType[];
  addSelectedNodes: (nodes: NodeType[] | NodeSearchType[]) => void;
  setSelectedNodes: (nodes: NodeType[] | NodeSearchType[]) => void;
  removeSelectedNode: (nodeId: NodeType["id"]) => void;
  clearSelectedNodes: () => void;
};

export const createNodeSlice: StateCreator<NodeSliceType> = (set) => ({
  selectedNodes: [],
  addSelectedNodes: (nodes) => {
    set((prev) => ({ selectedNodes: [...prev.selectedNodes, ...nodes] }));
  },
  setSelectedNodes: (nodes) => {
    set(() => ({ selectedNodes: nodes }));
  },
  removeSelectedNode: (nodeId: NodeType["id"]) => {
    set((prev) => ({
      selectedNodes: prev.selectedNodes.filter((n) => n.id !== nodeId),
    }));
  },
  clearSelectedNodes: () => {
    set(() => ({ selectedNodes: [] }));
  }
});
