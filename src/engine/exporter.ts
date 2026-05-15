import type { AddressRow } from "@/hooks/useStore";
import type { GeocodeResult } from "@/types";

interface ExportRow {
  original: string;
  normalizada: string;
  lat: string;
  lon: string;
  score: string;
  precision: string;
  comuna: string;
  region: string;
  via: string;
  numero: string;
  warnings: string;
  api: string;
  matchType: string;
  displayName: string;
  found: string;
}

function flattenRows(rows: AddressRow[]): ExportRow[] {
  return rows.map((r) => {
    const g = r.geocode;
    const n = r.normalized;
    return {
      original: n.original || "",
      normalizada: n.normalized || "",
      lat: g?.found ? String(g.lat) : "",
      lon: g?.found ? String(g.lon) : "",
      score: String(g?.score ?? 0),
      precision: g?.precision || "nulo",
      comuna: n.comuna || "",
      region: n.region || "",
      via: n.via || "",
      numero: n.numero || "",
      warnings: n.warnings.join("; "),
      api: g?.api || "",
      matchType: g?.matchType || "",
      displayName: g?.displayName || "",
      found: g?.found ? "Sí" : "No",
    };
  });
}

export async function exportCSV(rows: AddressRow[]): Promise<void> {
  const flat = flattenRows(rows);
  const headers = [
    "original", "normalizada", "lat", "lon", "score", "precision",
    "comuna", "region", "via", "numero", "warnings", "api",
    "matchType", "found",
  ];
  const lines: string[] = [headers.join(",")];
  for (const row of flat) {
    const csvLine = headers
      .map((h) => {
        const val = String((row as unknown as Record<string, string>)[h] || "");
        return val.includes(",") || val.includes('"') || val.includes("\n")
          ? `"${val.replace(/"/g, '""')}"`
          : val;
      })
      .join(",");
    lines.push(csvLine);
  }
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  downloadBlob(blob, "csv");
}

export async function exportXLSX(rows: AddressRow[]): Promise<void> {
  const XLSX = await import("xlsx");
  const flat = flattenRows(rows);

  // Results sheet
  const wsData = flat.map((r, i) => {
    const score = parseInt(r.score) || 0;
    let color = "FF0000";
    if (score >= 85) color = "10b981";
    else if (score >= 60) color = "f59e0b";
    else if (score >= 35) color = "f97316";
    else if (score === 0) color = "9ca3af";

    return {
      "#": i + 1,
      Original: r.original,
      Normalizada: r.normalizada,
      Score: parseInt(r.score) || 0,
      Precisión: r.precision,
      Lat: r.lat,
      Lon: r.lon,
      Comuna: r.comuna,
      Región: r.region,
      Vía: r.via,
      Número: r.numero,
      Warnings: r.warnings,
      API: r.api,
      ScoreColor: color,
    };
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(wsData);

  // Apply conditional coloring on Score column
  const range = XLSX.utils.decode_range(ws["!ref"] || "A1");
  for (let r = 1; r <= range.e.r; r++) {
    const scoreCell = ws[XLSX.utils.encode_cell({ r, c: 3 })];
    const colorCell = ws[XLSX.utils.encode_cell({ r, c: 13 })];
    if (scoreCell && colorCell) {
      scoreCell.s = {
        fill: { fgColor: { rgb: String(colorCell.v) } },
        font: { bold: true, color: { rgb: "FFFFFF" } },
      };
    }
  }
  // Remove the helper ScoreColor column
  delete ws[XLSX.utils.encode_cell({ r: 0, c: 13 })];
  for (let r = 1; r <= range.e.r; r++) {
    delete ws[XLSX.utils.encode_cell({ r, c: 13 })];
  }

  // Summary sheet
  const total = rows.length;
  const found = rows.filter((r) => r.geocode?.found).length;
  const avgScore = total > 0 ? Math.round(rows.reduce((s, r) => s + (r.geocode?.score ?? 0), 0) / total) : 0;
  const summaryData = [
    { Métrica: "Total direcciones", Valor: total },
    { Métrica: "Encontradas", Valor: found },
    { Métrica: "No encontradas", Valor: total - found },
    { Métrica: "Score promedio", Valor: avgScore },
    { Métrica: "Excelentes", Valor: rows.filter((r) => (r.geocode?.score ?? 0) >= 85).length },
    { Métrica: "Buenos", Valor: rows.filter((r) => { const s = r.geocode?.score ?? 0; return s >= 60 && s < 85; }).length },
    { Métrica: "Regulares", Valor: rows.filter((r) => { const s = r.geocode?.score ?? 0; return s >= 35 && s < 60; }).length },
    { Métrica: "Bajos", Valor: rows.filter((r) => { const s = r.geocode?.score ?? 0; return s > 0 && s < 35; }).length },
    { Métrica: "Nulos", Valor: rows.filter((r) => !r.geocode?.found).length },
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Resultados");
  const ws2 = XLSX.utils.json_to_sheet(summaryData);
  // Fix column widths
  ws2["!cols"] = [{ wch: 20 }, { wch: 10 }];
  ws["!cols"] = Array(13).fill(null).map(() => ({ wch: 16 }));
  XLSX.utils.book_append_sheet(wb, ws2, "Resumen");

  const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  downloadBlob(blob, "xlsx");
}

export function exportGeoJSON(rows: AddressRow[]): void {
  const features: Array<{
    type: "Feature";
    geometry: { type: "Point"; coordinates: [number, number] } | null;
    properties: Record<string, string | number | boolean | null>;
  }> = rows
    .filter((r) => r.geocode?.found)
    .map((r) => {
      const g = r.geocode as GeocodeResult;
      const n = r.normalized;
      return {
        type: "Feature" as const,
        geometry: g.found ? { type: "Point" as const, coordinates: [g.lon, g.lat] } : null,
        properties: {
          original: n.original,
          normalizada: n.normalized,
          lat: g.lat,
          lon: g.lon,
          score: g.score,
          precision: g.precision,
          comuna: n.comuna || null,
          region: n.region || null,
          via: n.via || null,
          numero: n.numero || null,
          warnings: n.warnings.join(";") || null,
          api: g.api || null,
          matchType: g.matchType || null,
        },
      };
    });

  const geojson = {
    type: "FeatureCollection",
    features: features.filter((f) => f.geometry !== null),
    crs: {
      type: "name",
      properties: { name: "urn:ogc:def:crs:EPSG::4326" },
    },
  };

  const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: "application/geo+json" });
  downloadBlob(blob, "geojson");
}

export async function exportShapefile(rows: AddressRow[]): Promise<void> {
  const found = rows.filter((r) => r.geocode?.found);
  if (found.length === 0) return;

  try {
    // @crmackey/shp-write ESM import with types workaround
    const shpModule = await import("@crmackey/shp-write") as { download: (geojson: unknown, options?: { name: string }) => void };
    const { download } = shpModule;

    const features = found.map((r) => {
      const g = r.geocode as GeocodeResult;
      const n = r.normalized;
      return {
        type: "Feature",
        geometry: { type: "Point", coordinates: [g.lon, g.lat] },
        properties: {
          original: n.original.slice(0, 80),
          normalizad: n.normalized.slice(0, 80),
          score: g.score,
          precision: g.precision.slice(0, 15),
          comuna: (n.comuna || "").slice(0, 30),
          region: (n.region || "").slice(0, 30),
          api: g.api.slice(0, 15),
          found: g.found ? 1 : 0,
        },
      };
    });

    download({ type: "FeatureCollection", features } as Record<string, unknown>, {
      name: filename(),
    });
  } catch (e) {
    console.warn("Shapefile export failed, trying fallback...", e);
    exportGeoJSON(rows);
  }
}

function filename(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `azimut_${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

function downloadBlob(blob: Blob, ext: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename()}.${ext}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportFormat(rows: AddressRow[], format: "csv" | "xlsx" | "geojson" | "shp"): Promise<void> {
  switch (format) {
    case "csv": return exportCSV(rows);
    case "xlsx": return exportXLSX(rows);
    case "geojson": return Promise.resolve(exportGeoJSON(rows));
    case "shp": return exportShapefile(rows);
  }
}
