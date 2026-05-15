import { useState } from "react";
import { BarChart3, Table2 } from "lucide-react";
import { motion } from "framer-motion";
import { Dashboard } from "./Dashboard";
import { ResultTable } from "./ResultTable";
import { ExportButtons } from "@/components/export/ExportButtons";

export function ResultsView() {
  const [view, setView] = useState<"dashboard" | "table">("dashboard");

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Resultados</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Direcciones geocodificadas con Nominatim y Photon. Exportalas en el formato que necesités.</p>
        </div>
        <ExportButtons />
      </motion.div>

      <div className="flex gap-2">
        <button onClick={() => setView("dashboard")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            view === "dashboard" ? "bg-azimut-500 text-white shadow-lg shadow-azimut-500/25"
            : "bg-white/70 dark:bg-gray-900/70 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          }`}>
          <BarChart3 className="w-4 h-4" /> Dashboard
        </button>
        <button onClick={() => setView("table")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            view === "table" ? "bg-azimut-500 text-white shadow-lg shadow-azimut-500/25"
            : "bg-white/70 dark:bg-gray-900/70 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          }`}>
          <Table2 className="w-4 h-4" /> Tabla
        </button>
      </div>

      <motion.div key={view} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        {view === "dashboard" ? <Dashboard /> : <ResultTable />}
      </motion.div>
    </div>
  );
}
