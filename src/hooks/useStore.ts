import { create } from "zustand";
import type { NormalizedAddress, GeocodeResult } from "@/types";

export interface AddressRow {
  id: number;
  original: Record<string, string>;
  normalized: NormalizedAddress;
  geocode?: GeocodeResult;
  selected: boolean;
}

interface AppState {
  rows: AddressRow[];
  setRows: (rows: AddressRow[]) => void;
  updateRowGeocode: (id: number, geocode: GeocodeResult) => void;
}

export const useStore = create<AppState>(set => ({
  rows: [],
  setRows: rows => set({ rows }),
  updateRowGeocode: (id, geocode) => set(state => ({ rows: state.rows.map(row => row.id === id ? { ...row, geocode } : row) })),
}));
