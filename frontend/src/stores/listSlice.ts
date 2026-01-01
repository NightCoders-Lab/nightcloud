import type { StateCreator } from "zustand";

export type ListOption = {
  id: string;
  name: string;
  icon?: React.ComponentType;
};

export type ListSliceType = {
  listSelectedOption: ListOption | undefined;
  listSetSelectedOption: (option: ListOption) => void;
};

export const createListSlice: StateCreator<ListSliceType> = (set) => ({
  listSelectedOption: undefined,
  listSetSelectedOption: (option: ListOption) => {
    set({ listSelectedOption: option });
  },
});
