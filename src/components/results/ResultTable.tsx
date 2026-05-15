import { useState } from "react";
import { ChevronUp, ChevronDown, AlertTriangle, Eye } from "lucide-react";
import { motion } from "framer-motion";
import { useStore } from "@/hooks/useStore";
import type { AddressRow } from "@/hooks/useStore";
import { ScoreBadge } from "@/components/ui/ScoreBadge";
import { DetailModal } from "@/components/ui/DetailModal";

type SortKey = "id" | "score";
type SortDir = "asc" | "desc";

export function ResultTable() {
  const rows = useStore((s) => s.rows);
  const [sortKey, setSortKey] = useState<SortKey>("id");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [filterMin, setFilterMin] = useState(0);
  const [filterPrecision, setFilterPrecision] = useState<string>("all");
  const [selectedRow, setSelectedRow] = useState<AddressRow | null>(null);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };

  const filtered = rows
    .filter((r) => (r.geocode?.score ?? 0) >= filterMin)
    .filter((r) => filterPrecision === "all" ? true : r.geocode?.precision === filterPrecision)
    .sort((a, b) => {
      const aVal = sortKey === "id" ? a.id : (a.geocode?.score ?? 0);
      const bVal = sortKey === "id" ? b.id : (b.geocode?.score ?? 0);
      return sortDir === "asc" ? aVal - bVal : bVal - aVal;
    });

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ChevronUp className="w-3 h-3 opacity-30" />;
    return sortDir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />;
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500 dark:text-gray-400">Score mín:</label>
            <input type="range" min={0} max={100} value={filterMin} onChange={(e) => setFilterMin(Number(e.target.value))} className="w-24 accent-azimut-500" />
            <span className="text-xs font-mono text-gray-600 dark:text-gray-300 w-8">{filterMin}</span>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500 dark:text-gray-400">Precisión:</label>
            <select value={filterPrecision} onChange={(e) => setFilterPrecision(e.target.value)}
              className="text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1">
              <option value="all">Todas</option>
              <option value="excelente">Excelente</option>
              <option value="bueno">Bueno</option>
              <option value="regular">Regular</option>
              <option value="bajo">Bajo</option>
              <option value="nulo">Nulo</option>
            </select>
          </div>
          <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto">{filtered.length} de {rows.length}</span>
        </div>

        <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-800/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200/50 dark:border-gray-800/50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">#</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">Original</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">Normalizada</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-200" onClick={() => handleSort("score")}>
                    <span className="flex items-center gap-1">Score<SortIcon col="score" /></span>
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">Comuna</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">Lat / Lon</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">API</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">⚠️</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, i) => (
                  <motion.tr key={row.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                    className="border-b border-gray-100 dark:border-gray-800/30 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-400">{row.id}</td>
                    <td className="px-4 py-3 max-w-48 truncate text-gray-600 dark:text-gray-400">{row.normalized.original}</td>
                    <td className="px-4 py-3 max-w-56 truncate text-gray-900 dark:text-white font-medium">{row.normalized.normalized}</td>
                    <td className="px-4 py-3"><ScoreBadge score={row.geocode?.score ?? 0} size="sm" /></td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{row.normalized.comuna || "—"}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500 dark:text-gray-400">
                      {row.geocode?.found ? `${row.geocode.lat.toFixed(4)}, ${row.geocode.lon.toFixed(4)}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">{row.geocode?.api || "—"}</td>
                    <td className="px-4 py-3">
                      {row.normalized.warnings.length > 0 && <span className="text-amber-500 cursor-help" title={row.normalized.warnings.join(", ")}><AlertTriangle className="w-4 h-4" /></span>}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => setSelectedRow(row)} className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" title="Ver detalle">
                        <Eye className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <DetailModal row={selectedRow} onClose={() => setSelectedRow(null)} />
    </>
  );
}
