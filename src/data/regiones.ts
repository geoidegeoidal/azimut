export interface Region {
  id: string;
  nombre: string;
  romano: string;
  alias: string[];
}

export const REGIONES: Region[] = [
  { id: "15", nombre: "Arica y Parinacota", romano: "XV", alias: ["Arica", "XV"] },
  { id: "01", nombre: "Tarapacá", romano: "I", alias: ["Tarapaca", "I"] },
  { id: "02", nombre: "Antofagasta", romano: "II", alias: ["Antofagasta", "II"] },
  { id: "03", nombre: "Atacama", romano: "III", alias: ["Atacama", "III"] },
  { id: "04", nombre: "Coquimbo", romano: "IV", alias: ["Coquimbo", "IV"] },
  { id: "05", nombre: "Valparaíso", romano: "V", alias: ["Valparaiso", "V", "Valpo"] },
  { id: "06", nombre: "O'Higgins", romano: "VI", alias: ["OHiggins", "VI", "Libertador", "Rancagua"] },
  { id: "07", nombre: "Maule", romano: "VII", alias: ["Maule", "VII", "Talca"] },
  { id: "08", nombre: "Biobío", romano: "VIII", alias: ["Biobio", "Bio-Bio", "VIII", "Concepcion", "Concepción"] },
  { id: "09", nombre: "La Araucanía", romano: "IX", alias: ["Araucania", "IX", "Temuco"] },
  { id: "10", nombre: "Los Lagos", romano: "X", alias: ["Los Lagos", "X", "Puerto Montt"] },
  { id: "11", nombre: "Aysén", romano: "XI", alias: ["Aysen", "XI", "Coyhaique"] },
  { id: "12", nombre: "Magallanes", romano: "XII", alias: ["Magallanes", "XII", "Punta Arenas"] },
  { id: "13", nombre: "Región Metropolitana", romano: "XIII", alias: ["Metropolitana", "RM", "XIII", "Santiago", "Metropolitana de Santiago"] },
  { id: "14", nombre: "Los Ríos", romano: "XIV", alias: ["Los Rios", "XIV", "Valdivia"] },
  { id: "16", nombre: "Ñuble", romano: "XVI", alias: ["Nuble", "XVI", "Chillan", "Chillán"] },
];

export function normalizeRegionName(input: string): string | null {
  const cleaned = input.trim().toLowerCase();
  for (const region of REGIONES) {
    if (region.nombre.toLowerCase() === cleaned) return region.nombre;
    if (region.romano.toLowerCase() === cleaned) return region.nombre;
    for (const alias of region.alias) {
      if (alias.toLowerCase() === cleaned) return region.nombre;
    }
  }
  return null;
}

export const REGIONS_MAP: Record<string, string> = {
  rm: "Región Metropolitana",
  "región metropolitana": "Región Metropolitana",
  metropolitana: "Región Metropolitana",
  xiii: "Región Metropolitana",
  "13": "Región Metropolitana",
  v: "Valparaíso",
  valparaiso: "Valparaíso",
  valpo: "Valparaíso",
  vi: "O'Higgins",
  "o'higgins": "O'Higgins",
  ohiggins: "O'Higgins",
  vii: "Maule",
  maule: "Maule",
  viii: "Biobío",
  bio: "Biobío",
  biobio: "Biobío",
  ix: "La Araucanía",
  araucania: "La Araucanía",
  x: "Los Lagos",
  lagos: "Los Lagos",
  xi: "Aysén",
  aysen: "Aysén",
  xii: "Magallanes",
  magallanes: "Magallanes",
  xiv: "Los Ríos",
  rios: "Los Ríos",
  xv: "Arica y Parinacota",
  arica: "Arica y Parinacota",
  xvi: "Ñuble",
  nuble: "Ñuble",
  i: "Tarapacá",
  tarapaca: "Tarapacá",
  ii: "Antofagasta",
  antofagasta: "Antofagasta",
  iii: "Atacama",
  atacama: "Atacama",
  iv: "Coquimbo",
  coquimbo: "Coquimbo",
};
