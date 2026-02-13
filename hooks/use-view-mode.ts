import { create } from "zustand";

type ViewMode = "expert" | "simple";

interface ViewModeStore {
  mode: ViewMode;
  toggle: () => void;
  setMode: (mode: ViewMode) => void;
}

export const useViewMode = create<ViewModeStore>((set) => ({
  mode: "simple",
  toggle: () =>
    set((s) => ({ mode: s.mode === "expert" ? "simple" : "expert" })),
  setMode: (mode) => set({ mode }),
}));
