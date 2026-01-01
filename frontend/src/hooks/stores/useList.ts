import { useAppStore } from "@/stores/useAppStore";

export function useList() {
  const { listSelectedOption, listSetSelectedOption } = useAppStore();
  return {
    listSelectedOption,
    listSetSelectedOption,
  };
}
