import { useStore } from "@/hooks/useStore";
import { motion } from "framer-motion";
import { MapPin, CheckCircle, XCircle, TrendingUp } from "lucide-react";

export function Dashboard() {
  const rows = useStore((s) => s.rows);

  const total = rows.length;
  const found = rows.filter((r) => (r.geocode?.score ?? 0) > 0).length;
  const notFound = total - found;
  const avgScore = total > 0 ? Math.round(rows.reduce((sum, r) => sum + (r.geocode?.score ?? 0), 0) / total) : 0;

  const stats = [
    { label: "Total", value: total, icon: MapPin, color: "text-azimut-500", bg: "bg-azimut-50 dark:bg-azimut-950/30" },
    { label: "Encontradas", value: found, icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
    { label: "No encontradas", value: notFound, icon: XCircle, color: "text-red-500", bg: "bg-red-50 dark:bg-red-950/30" },
    { label: "Score promedio", value: `${avgScore}`, icon: TrendingUp, color: "text-violet-500", bg: "bg-violet-50 dark:bg-violet-950/30" },
  ];

  const scoreRanges = [
    { label: "Excelente (85+)", count: rows.filter((r) => (r.geocode?.score ?? 0) >= 85).length, color: "bg-emerald-500", max: total },
    { label: "Bueno (60-84)", count: rows.filter((r) => (r.geocode?.score ?? 0) >= 60 && (r.geocode?.score ?? 0) < 85).length, color: "bg-amber-500", max: total },
    { label: "Regular (35-59)", count: rows.filter((r) => (r.geocode?.score ?? 0) >= 35 && (r.geocode?.score ?? 0) < 60).length, color: "bg-orange-500", max: total },
    { label: "Bajo (<35)", count: rows.filter((r) => (r.geocode?.score ?? 0) > 0 && (r.geocode?.score ?? 0) < 35).length, color: "bg-red-500", max: total },
    { label: "Nulo (0)", count: rows.filter((r) => (r.geocode?.score ?? 0) === 0).length, color: "bg-gray-400", max: total },
  ];

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

      <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-800/50 p-6">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
          Distribución de scores
        </h3>
        <div className="space-y-3">
          {scoreRanges.map((r, i) => (
            <motion.div
              key={r.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-600 dark:text-gray-400">{r.label}</span>
                <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                  {r.count} ({total > 0 ? Math.round((r.count / total) * 100) : 0}%)
                </span>
              </div>
              <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full ${r.color} rounded-full`}
                  initial={{ width: 0 }}
                  animate={{ width: `${total > 0 ? (r.count / total) * 100 : 0}%` }}
                  transition={{ duration: 0.8, delay: 0.5 + i * 0.1, ease: "easeOut" }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
