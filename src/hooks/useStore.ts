import { create } from "zustand";
import type { WizardStep, NormalizedAddress } from "@/types";

interface AddressRow {
  id: number;
  original: Record<string, string>;
  normalized: NormalizedAddress;
  selected: boolean;
}

interface AppState {
  step: WizardStep;
  fileName: string | null;
  fileData: Record<string, string>[];
  headers: string[];
  addressColumn: string | null;
  rows: AddressRow[];
  isDark: boolean;
  processing: {
    current: number;
    total: number;
    paused: boolean;
    elapsed: number;
  };
  setStep: (step: WizardStep) => void;
  setFileData: (data: Record<string, string>[], fileName: string) => void;
  setAddressColumn: (col: string) => void;
  setRows: (rows: AddressRow[]) => void;
  toggleTheme: () => void;
  updateProcessing: (updates: Partial<AppState["processing"]>) => void;
  reset: () => void;
}

export const useStore = create<AppState>((set, get) => ({
  step: "upload",
  fileName: null,
  fileData: [],
  headers: [],
  addressColumn: null,
  rows: [],
  isDark: window.matchMedia("(prefers-color-scheme: dark)").matches,
  processing: { current: 0, total: 0, paused: false, elapsed: 0 },

  setStep: (step) => set({ step }),

  setFileData: (data, fileName) => {
    const headers = data.length > 0 ? Object.keys(data[0]) : [];
    set({ fileData: data, headers, fileName });
  },

  setAddressColumn: (col) => set({ addressColumn: col }),

  setRows: (rows) => set({ rows }),

  toggleTheme: () =>
    set((state) => {
      const next = !state.isDark;
      document.documentElement.classList.toggle("dark", next);
      return { isDark: next };
    }),

  updateProcessing: (updates) =>
    set((state) => ({
      processing: { ...state.processing, ...updates },
    })),

  reset: () => {
    const isDark = get().isDark;
    set({
      step: "upload",
      fileName: null,
      fileData: [],
      headers: [],
      addressColumn: null,
      rows: [],
      processing: { current: 0, total: 0, paused: false, elapsed: 0 },
      isDark,
    });
  },
}));
