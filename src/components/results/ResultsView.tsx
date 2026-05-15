import { useState } from "react";
import { BarChart3, Table2, Map } from "lucide-react";
import { motion } from "framer-motion";
import { Dashboard } from "./Dashboard";
import { ResultTable } from "./ResultTable";
import { ResultMap } from "./ResultMap";
import { ExportButtons } from "@/components/export/ExportButtons";

export function ResultsView() {
  const [view, setView] = useState<"dashboard" | "table" | "map">("dashboard");

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Resultados</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Direcciones geocodificadas con Nominatim y Photon. Explora en el mapa, revisa la tabla o mira el dashboard.</p>
        </div>
        <ExportButtons />
      </motion.div>

      <div className="flex gap-2">
        {[
          { key: "dashboard" as const, label: "Dashboard", icon: BarChart3 },
          { key: "map" as const, label: "Mapa", icon: Map },
          { key: "table" as const, label: "Tabla", icon: Table2 },
        ].map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setView(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              view === key ? "bg-azimut-500 text-white shadow-lg shadow-azimut-500/25"
              : "bg-white/70 dark:bg-gray-900/70 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}>
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      <motion.div key={view} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        {view === "dashboard" && <Dashboard />}
        {view === "map" && <ResultMap />}
        {view === "table" && <ResultTable />}
      </motion.div>
    </div>
  );
}
