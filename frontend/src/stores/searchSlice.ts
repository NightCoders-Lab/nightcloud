import type { NodeSearchType } from "@/types";
import type { StateCreator } from "zustand";

export type SearchSliceType = {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: NodeSearchType[];
  setSearchResults: (results: NodeSearchType[]) => void;
  clearSearchResults: () => void;
};

export const createSearchSlice: StateCreator<SearchSliceType> = (set) => ({
  searchQuery: "",
  setSearchQuery: (query: string) => {
    set(() => ({ searchQuery: query }));
  },
  searchResults: [],
  setSearchResults: (results: NodeSearchType[]) => {
    set(() => ({ searchResults: results }));
  },
  clearSearchResults: () => {
    set(() => ({ searchResults: [] }));
  },
});
