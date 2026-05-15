import { create } from "zustand";
import type { AddressRow, WizardStep, GeocodeResult, NormalizedAddress } from "@/types";

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
  init: () => void;
}

const MOCK_GEOCODES: Partial<GeocodeResult>[] = [
  { lat: -33.4489, lon: -70.6693, score: 94, precision: "excelente", matchType: "building", importance: 0.85, api: "Nominatim", display_name: "Avenida Providencia 1234, Providencia, Santiago, Región Metropolitana, Chile" },
  { lat: -33.4372, lon: -70.6506, score: 88, precision: "excelente", matchType: "house_number", importance: 0.78, api: "Nominatim", display_name: "Avenida Libertador Bernardo O'Higgins 3494, Santiago, Región Metropolitana, Chile" },
  { lat: -33.4173, lon: -70.6091, score: 76, precision: "bueno", matchType: "street", importance: 0.65, api: "Nominatim", display_name: "Avenida Las Condes 1234, Las Condes, Santiago, Región Metropolitana, Chile" },
  { lat: -33.0472, lon: -71.6127, score: 71, precision: "bueno", matchType: "street", importance: 0.60, api: "Photon", display_name: "Pasaje Los Alerces 567, Viña del Mar, Valparaíso, Chile" },
  { lat: -33.5200, lon: -70.7550, score: 52, precision: "regular", matchType: "suburb", importance: 0.40, api: "Nominatim", display_name: "San Bernardo, Santiago, Región Metropolitana, Chile" },
  { lat: -33.6000, lon: -70.8000, score: 41, precision: "regular", matchType: "city", importance: 0.35, api: "Photon", display_name: "Melipilla, Región Metropolitana, Chile" },
  { lat: -33.4500, lon: -70.6700, score: 22, precision: "bajo", matchType: "state", importance: 0.20, api: "Nominatim", display_name: "Región Metropolitana, Chile" },
  { lat: 0, lon: 0, score: 0, precision: "nulo", matchType: "", importance: 0, api: "", display_name: "" },
];

function generateMockData(): AddressRow[] {
  const addresses = [
    { direccion: "Av. Providencia 1234", ciudad: "Santiago" },
    { direccion: "Av. Libertador Bernardo O'Higgins 3494", ciudad: "Santiago" },
    { direccion: "Av. Las Condes 1234", ciudad: "Las Condes" },
    { direccion: "Psje Los Alerces 567", ciudad: "Viña del Mar" },
    { direccion: "Camino a Melipilla Km 12", ciudad: "Melipilla" },
    { direccion: "San Bernardo", ciudad: "" },
    { direccion: "Melipilla", ciudad: "" },
    { direccion: "Dirección desconocida 9999", ciudad: "Chile" },
    { direccion: "Av. Pdte Kennedy 5678 Dpto 502", ciudad: "Vitacura" },
    { direccion: "Esq. Alameda con San Antonio", ciudad: "Santiago" },
    { direccion: "Villa Frei Block 23", ciudad: "Ñuñoa" },
    { direccion: "Fundo El Peumo Lote 5", ciudad: "Rancagua" },
    { direccion: "Av. 11 de Septiembre 1234", ciudad: "Providencia" },
    { direccion: "P 18 N° 2345", ciudad: "Santiago" },
    { direccion: "José Miguel Carrera 1234", ciudad: "Santiago" },
    { direccion: "losalerces567", ciudad: "Viña del Mar" },
    { direccion: "av providencia 1234 dpto 502", ciudad: "Providencia" },
    { direccion: "Panamericana Norte Km 45", ciudad: "" },
    { direccion: "Los Leones 56", ciudad: "Providencia" },
    { direccion: "Calle 12 #5678", ciudad: "Santiago" },
  ];

  return addresses.map((addr, i) => ({
    id: i + 1,
    original: { direccion: addr.direccion, ciudad: addr.ciudad },
    normalized: {
      original: addr.direccion,
      normalized: `${addr.direccion}, ${addr.ciudad || "Santiago"}, Región Metropolitana, Chile`,
      comuna: addr.ciudad || "Santiago",
      region: "Región Metropolitana",
      warnings: addr.direccion.includes("desconocida") ? ["DIRECCION_INCOMPLETA"] : [],
      suggestions: addr.direccion.includes("desconocida") ? ["¿Quisiste decir una dirección válida?"] : [],
    } as NormalizedAddress,
    geocode: MOCK_GEOCODES[i] as GeocodeResult,
    selected: true,
  }));
}

export const useStore = create<AppState>((set) => ({
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
    const isDark = useStore.getState().isDark;
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

  init: () => {
    const mock = generateMockData();
    set({
      rows: mock,
      fileData: mock.map((r) => r.original),
      headers: ["direccion", "ciudad"],
      fileName: "direcciones_ejemplo.csv",
      addressColumn: "direccion",
      processing: { current: mock.length, total: mock.length, paused: false, elapsed: 127 },
    });
  },
}));
