import { create } from "zustand";
import type { ModelProvider } from "@/types/models";

interface ModelStore {
  model: ModelProvider;
  setModel: (model: ModelProvider) => void;
}

export const useModelStore = create<ModelStore>((set) => ({
  model: "zai",
  setModel: (model) => set({ model }),
}));
