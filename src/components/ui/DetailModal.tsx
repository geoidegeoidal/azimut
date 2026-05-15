import { X, MapPin, Clock, Globe } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { AddressRow } from "@/hooks/useStore";
import { ScoreBadge } from "@/components/ui/ScoreBadge";

interface DetailModalProps {
  row: AddressRow | null;
  onClose: () => void;
}

export function DetailModal({ row, onClose }: DetailModalProps) {
  if (!row || !row.geocode) return null;

  const { geocode, normalized } = row;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        >
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Detalle</h3>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Score */}
            <div className="flex items-center justify-center">
              <ScoreBadge score={geocode.score} size="lg" />
            </div>

            {/* Score breakdown */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Desglose del score</h4>
              {[
                { label: "Tipo de match", value: geocode.score * 0.4, max: 40, color: "bg-emerald-500" },
                { label: "Importancia", value: (geocode.importance ?? 0) * 30, max: 30, color: "bg-blue-500" },
                { label: "Completitud", value: geocode.completeness * 0.2, max: 20, color: "bg-violet-500" },
                { label: "Unicidad", value: geocode.uniqueness * 0.1, max: 10, color: "bg-amber-500" },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600 dark:text-gray-400">{item.label}</span>
                    <span className="text-xs font-mono text-gray-500">{Math.round(item.value)}/{item.max}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div className={`h-full ${item.color} rounded-full`} style={{ width: `${(item.value / item.max) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Addresses */}
            <div className="space-y-3">
              <div>
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Original</span>
                <p className="mt-1 text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2 font-mono">
                  {normalized.original}
                </p>
              </div>
              <div>
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Normalizada</span>
                <p className="mt-1 text-sm text-gray-900 dark:text-white bg-azimut-50 dark:bg-azimut-950/30 rounded-lg px-3 py-2 font-medium">
                  {normalized.normalized}
                </p>
              </div>
            </div>

            {/* Coordinates */}
            {geocode.found && (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Latitud</span>
                  <p className="text-sm font-mono font-medium text-gray-900 dark:text-white">{geocode.lat.toFixed(6)}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Longitud</span>
                  <p className="text-sm font-mono font-medium text-gray-900 dark:text-white">{geocode.lon.toFixed(6)}</p>
                </div>
              </div>
            )}

            {/* Metadata */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Metadata</h4>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Globe className="w-4 h-4" />
                  <span>API: <strong className="text-gray-900 dark:text-white">{geocode.api}</strong></span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <MapPin className="w-4 h-4" />
                  <span>Tipo: <strong className="text-gray-900 dark:text-white">{geocode.matchType || "—"}</strong></span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Clock className="w-4 h-4" />
                  <span>{new Date(geocode.timestamp).toLocaleString("es-CL")}</span>
                </div>
              </div>
            </div>

            {/* Warnings */}
            {normalized.warnings.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-2">Advertencias</h4>
                <div className="space-y-1">
                  {normalized.warnings.map((w) => (
                    <span key={w} className="inline-block text-xs bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 rounded-md px-2 py-1 mr-1 mb-1">
                      {w}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Suggestions */}
            {normalized.suggestions.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-azimut-600 dark:text-azimut-400 uppercase tracking-wider mb-2">Sugerencias</h4>
                <ul className="space-y-1">
                  {normalized.suggestions.map((s) => (
                    <li key={s} className="text-xs text-azimut-700 dark:text-azimut-300">• {s}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
