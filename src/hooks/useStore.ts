import { create } from "zustand";
import type { WizardStep, NormalizedAddress, GeocodeResult } from "@/types";

export interface AddressRow {
  id: number;
  original: Record<string, string>;
  normalized: NormalizedAddress;
  geocode?: GeocodeResult;
  selected: boolean;
}

interface AppState {
  step: WizardStep;
  fileName: string | null;
  fileData: Record<string, string>[];
  headers: string[];
  addressColumns: string[];
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
  setAddressColumns: (cols: string[]) => void;
  setRows: (rows: AddressRow[]) => void;
  updateRowGeocode: (id: number, geocode: GeocodeResult) => void;
  toggleTheme: () => void;
  updateProcessing: (updates: Partial<AppState["processing"]>) => void;
  reset: () => void;
}

export const useStore = create<AppState>((set, get) => ({
  step: "upload",
  fileName: null,
  fileData: [],
  headers: [],
  addressColumns: [],
  rows: [],
  isDark: window.matchMedia("(prefers-color-scheme: dark)").matches,
  processing: { current: 0, total: 0, paused: false, elapsed: 0 },

  setStep: (step) => set({ step }),

  setFileData: (data, fileName) => {
    const headers = data.length > 0 ? Object.keys(data[0]) : [];
    set({ fileData: data, headers, fileName });
  },

  setAddressColumns: (cols) => set({ addressColumns: cols }),

  setRows: (rows) => set({ rows }),

  updateRowGeocode: (id, geocode) =>
    set((state) => ({
      rows: state.rows.map((r) => (r.id === id ? { ...r, geocode } : r)),
    })),

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
      addressColumns: [],
      rows: [],
      processing: { current: 0, total: 0, paused: false, elapsed: 0 },
      isDark,
    });
  },
}));
