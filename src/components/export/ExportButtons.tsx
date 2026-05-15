import { FileDown, Table, FileJson, Map } from "lucide-react";
import { motion } from "framer-motion";

const FORMATS = [
  { key: "csv", label: "CSV", icon: Table, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-950/50" },
  { key: "xlsx", label: "XLSX", icon: FileDown, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-950/50" },
  { key: "geojson", label: "GeoJSON", icon: FileJson, color: "text-violet-500", bg: "bg-violet-50 dark:bg-violet-950/30 hover:bg-violet-100 dark:hover:bg-violet-950/50" },
  { key: "shp", label: "Shapefile", icon: Map, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-950/50" },
];

export function ExportButtons() {
  const handleExport = (format: string) => {
    console.log(`Exportando como ${format}`);
  };

  return (
    <div className="flex flex-wrap gap-3">
      {FORMATS.map((f, i) => (
        <motion.button
          key={f.key}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          onClick={() => handleExport(f.key)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${f.bg} ${f.color} border border-transparent hover:border-current/20`}
        >
          <f.icon className="w-4 h-4" />
          {f.label}
        </motion.button>
      ))}
    </div>
  );
}
