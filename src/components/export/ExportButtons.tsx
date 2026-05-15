import { FileDown, Table, FileJson, Map, Loader2 } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { useStore } from "@/hooks/useStore";
import { exportFormat } from "@/engine/exporter";

const FORMATS = [
  { key: "csv" as const, label: "CSV", icon: Table, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-950/50", desc: "Columnas separadas por coma" },
  { key: "xlsx" as const, label: "XLSX", icon: FileDown, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-950/50", desc: "Celdas coloreadas por score + Resumen" },
  { key: "geojson" as const, label: "GeoJSON", icon: FileJson, color: "text-violet-500", bg: "bg-violet-50 dark:bg-violet-950/30 hover:bg-violet-100 dark:hover:bg-violet-950/50", desc: "FeatureCollection compatible GIS" },
  { key: "shp" as const, label: "Shapefile", icon: Map, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-950/50", desc: "ESRI .shp + .shx + .dbf + .prj" },
];

export function ExportButtons() {
  const rows = useStore((s) => s.rows);
  const [exporting, setExporting] = useState<string | null>(null);

  const handleExport = async (format: "csv" | "xlsx" | "geojson" | "shp") => {
    setExporting(format);
    try {
      await exportFormat(rows, format);
    } catch (e) {
      console.error(`Export ${format} failed:`, e);
    }
    setExporting(null);
  };

  const foundRows = rows.filter((r) => r.geocode?.found);
  const totalRows = rows.length;

  return (
    <div className="flex flex-wrap gap-3">
      {FORMATS.map((f, i) => (
        <motion.button
          key={f.key}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          onClick={() => handleExport(f.key)}
          disabled={exporting !== null || totalRows === 0}
          title={f.desc}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
            exporting !== null ? "opacity-50 cursor-not-allowed" : ""
          } ${f.bg} ${f.color} border border-transparent hover:border-current/20`}
        >
          {exporting === f.key ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <f.icon className="w-4 h-4" />
          )}
          {exporting === f.key ? "Exportando..." : f.label}
          {f.key === "shp" && (
            <span className="text-[10px] opacity-70">({foundRows.length} pts)</span>
          )}
        </motion.button>
      ))}
    </div>
  );
}
