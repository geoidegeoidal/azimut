import { useStore } from "@/hooks/useStore";
import { motion } from "framer-motion";
import { MapPin, CheckCircle, AlertTriangle, Building2 } from "lucide-react";

export function Dashboard() {
  const rows = useStore((s) => s.rows);

  const total = rows.length;
  const withComuna = rows.filter((r) => r.normalized.comuna).length;
  const withWarnings = rows.filter((r) => r.normalized.warnings.length > 0).length;
  const rural = rows.filter((r) => r.normalized.isRural).length;

  const stats = [
    { label: "Total procesadas", value: total, icon: MapPin, color: "text-azimut-500", bg: "bg-azimut-50 dark:bg-azimut-950/30" },
    { label: "Con comuna", value: withComuna, icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
    { label: "Con advertencias", value: withWarnings, icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950/30" },
    { label: "Rurales", value: rural, icon: Building2, color: "text-violet-500", bg: "bg-violet-50 dark:bg-violet-950/30" },
  ];

  const comunaCounts: Record<string, number> = {};
  for (const row of rows) {
    if (row.normalized.comuna) {
      comunaCounts[row.normalized.comuna] = (comunaCounts[row.normalized.comuna] || 0) + 1;
    }
  }

  const topComunas = Object.entries(comunaCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const warningCounts: Record<string, number> = {};
  for (const row of rows) {
    for (const w of row.normalized.warnings) {
      warningCounts[w] = (warningCounts[w] || 0) + 1;
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-800/50 p-4"
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{s.value}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-800/50 p-6">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
            Top comunas encontradas
          </h3>
          <div className="space-y-3">
            {topComunas.map(([comuna, count], i) => (
              <motion.div
                key={comuna}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-600 dark:text-gray-400">{comuna}</span>
                  <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                    {count} ({total > 0 ? Math.round((count / total) * 100) : 0}%)
                  </span>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-azimut-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${total > 0 ? (count / total) * 100 : 0}%` }}
                    transition={{ duration: 0.8, delay: 0.5 + i * 0.1, ease: "easeOut" }}
                  />
                </div>
              </motion.div>
            ))}
            {topComunas.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-4">Sin datos de comunas</p>
            )}
          </div>
        </div>

        <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-800/50 p-6">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
            Advertencias detectadas
          </h3>
          <div className="space-y-3">
            {Object.entries(warningCounts).map(([warning, count], i) => (
              <motion.div
                key={warning}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-600 dark:text-gray-400 font-mono">{warning}</span>
                  <span className="text-xs font-mono text-gray-500 dark:text-gray-400">{count}</span>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-amber-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${total > 0 ? (count / total) * 100 : 0}%` }}
                    transition={{ duration: 0.8, delay: 0.5 + i * 0.1, ease: "easeOut" }}
                  />
                </div>
              </motion.div>
            ))}
            {Object.keys(warningCounts).length === 0 && (
              <p className="text-xs text-gray-400 text-center py-4">Sin advertencias</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
