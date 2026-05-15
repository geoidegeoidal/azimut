import { useState } from "react";
import { ChevronUp, ChevronDown, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { useStore } from "@/hooks/useStore";

type SortKey = "id" | "comuna" | "region";
type SortDir = "asc" | "desc";

export function ResultTable() {
  const rows = useStore((s) => s.rows);
  const [sortKey, setSortKey] = useState<SortKey>("id");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [filterWarning, setFilterWarning] = useState<string>("all");

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const filtered = rows
    .filter((r) =>
      filterWarning === "all"
        ? true
        : filterWarning === "with"
          ? r.normalized.warnings.length > 0
          : r.normalized.warnings.length === 0,
    )
    .sort((a, b) => {
      if (sortKey === "id") {
        return sortDir === "asc" ? a.id - b.id : b.id - a.id;
      }
      const aVal = a.normalized[sortKey] || "";
      const bVal = b.normalized[sortKey] || "";
      return sortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ChevronUp className="w-3 h-3 opacity-30" />;
    return sortDir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500 dark:text-gray-400">Filtro:</label>
          <select
            value={filterWarning}
            onChange={(e) => setFilterWarning(e.target.value)}
            className="text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1"
          >
            <option value="all">Todas</option>
            <option value="with">Con advertencias</option>
            <option value="without">Sin advertencias</option>
          </select>
        </div>

        <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto">
          {filtered.length} de {rows.length} resultados
        </span>
      </div>

      <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-800/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200/50 dark:border-gray-800/50">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">#</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">Dirección original</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">Normalizada</th>
                <th
                  className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
                  onClick={() => handleSort("comuna")}
                >
                  <span className="flex items-center gap-1">
                    Comuna
                    <SortIcon col="comuna" />
                  </span>
                </th>
                <th
                  className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
                  onClick={() => handleSort("region")}
                >
                  <span className="flex items-center gap-1">
                    Región
                    <SortIcon col="region" />
                  </span>
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">Vía</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">⚠️</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, i) => (
                <motion.tr
                  key={row.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b border-gray-100 dark:border-gray-800/30 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                >
                  <td className="px-4 py-3 font-mono text-xs text-gray-400">{row.id}</td>
                  <td className="px-4 py-3 max-w-48 truncate text-gray-600 dark:text-gray-400">
                    {row.normalized.original}
                  </td>
                  <td className="px-4 py-3 max-w-56 truncate text-gray-900 dark:text-white font-medium">
                    {row.normalized.normalized}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {row.normalized.comuna || "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {row.normalized.region || "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {row.normalized.via || "—"}
                  </td>
                  <td className="px-4 py-3">
                    {row.normalized.warnings.length > 0 && (
                      <span
                        className="text-amber-500 cursor-help"
                        title={row.normalized.warnings.join(", ")}
                      >
                        <AlertTriangle className="w-4 h-4" />
                      </span>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
