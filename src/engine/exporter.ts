import type { AddressRow } from "@/hooks/useStore";
import Papa from "papaparse";

export function flattenRows(rows: AddressRow[]) {
  return rows.map(({ normalized: n, geocode: g }) => ({
    original: n.original, normalizada: n.normalized,
    lat: g?.found ? g.lat : null, lon: g?.found ? g.lon : null,
    score: g?.score ?? 0, metodo: g?.method || "", precision: g?.precision || "nulo",
    revisar: g?.needsReview ?? true, comuna: n.comuna || "", region: n.region || "", via: n.via || "", numero: n.numero || "",
    advertencias: [...new Set([...n.warnings, ...(g?.warnings || [])])].join("; "),
    evidencia: g?.evidence?.join("; ") || "", fuente: g?.api || "", encontrada: Boolean(g?.found),
    rango: g?.range?.join(" → ") || "", lado: g?.side || "",
    fuentes: g?.sources?.map(s => `${s.source}: ${s.status} (${s.detail})`).join("; ") || "",
  }));
}

export function toGeoJSON(rows: AddressRow[]) {
  return { type: "FeatureCollection", features: flattenRows(rows).filter(r => r.encontrada).map(r => ({
    type: "Feature", geometry: { type: "Point", coordinates: [r.lon, r.lat] }, properties: r,
  })) };
}

export async function exportCSV(rows: AddressRow[]): Promise<void> {
  downloadBlob(new Blob(["\uFEFF", Papa.unparse(flattenRows(rows), { escapeFormulae: true })], { type: "text/csv;charset=utf-8" }), "csv");
}

export async function exportXLSX(rows: AddressRow[]): Promise<void> {
  const XLSX = await import("xlsx"), flat = flattenRows(rows);
  const workbook = XLSX.utils.book_new(), sheet = XLSX.utils.json_to_sheet(flat);
  sheet["!cols"] = Object.keys(flat[0] || {}).map(key => ({ wch: ["evidencia", "advertencias", "normalizada", "fuentes"].includes(key) ? 50 : 18 }));
  XLSX.utils.book_append_sheet(workbook, sheet, "Resultados");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet([
    { metrica: "Direcciones", valor: rows.length }, { metrica: "Encontradas", valor: flat.filter(r => r.encontrada).length },
    { metrica: "Registradas", valor: flat.filter(r => r.metodo === "address").length },
    { metrica: "Interpoladas", valor: flat.filter(r => r.metodo === "interpolated").length },
    { metrica: "Por revisar", valor: flat.filter(r => r.revisar).length },
    { metrica: "Score", valor: "Indicador de evidencia; no es probabilidad de exactitud" },
  ]), "Resumen");
  downloadBlob(new Blob([XLSX.write(workbook, { bookType: "xlsx", type: "array" })], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), "xlsx");
}

export function exportGeoJSON(rows: AddressRow[]): void {
  downloadBlob(new Blob([JSON.stringify(toGeoJSON(rows), null, 2)], { type: "application/geo+json" }), "geojson");
}

export async function exportShapefile(rows: AddressRow[]): Promise<void> {
  const { zip } = await import("@crmackey/shp-write") as { zip: (geojson: unknown, options: { outputType: string }) => Promise<Blob> };
  // DBF field names are limited to 10 characters; keep evidence and uncertainty.
  const dbfText = (value: string, limit: number) => value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/→/g, "->").replace(/[^\x20-\x7e]/g, " ").slice(0, limit);
  const features = toGeoJSON(rows).features.map(feature => ({ ...feature, properties: {
    original: dbfText(feature.properties.original, 200), direccion: dbfText(feature.properties.normalizada, 200),
    comuna: dbfText(feature.properties.comuna, 200), score: feature.properties.score, metodo: feature.properties.metodo,
    revisar: feature.properties.revisar ? 1 : 0, fuente: dbfText(feature.properties.fuente, 200),
    avisos: dbfText(feature.properties.advertencias, 254), evidencia: dbfText(feature.properties.evidencia, 254),
  } }));
  downloadBlob(await zip({ type: "FeatureCollection", features }, { outputType: "blob" }), "zip");
}

function downloadBlob(blob: Blob, ext: string): void {
  const url = URL.createObjectURL(blob), link = document.createElement("a");
  link.href = url; link.download = `azimut_${new Date().toISOString().replace(/[:.]/g, "-")}.${ext}`;
  document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
}

export function exportFormat(rows: AddressRow[], format: "csv" | "xlsx" | "geojson" | "shp"): Promise<void> {
  switch (format) {
    case "csv": return exportCSV(rows);
    case "xlsx": return exportXLSX(rows);
    case "geojson": return Promise.resolve(exportGeoJSON(rows));
    case "shp": return exportShapefile(rows);
  }
}
