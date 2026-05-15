import { motion } from "framer-motion";

interface RadialProgressProps {
  current: number;
  total: number;
  elapsed: number;
  paused?: boolean;
}

export function RadialProgress({ current, total, elapsed, paused }: RadialProgressProps) {
  const pct = total > 0 ? (current / total) * 100 : 0;
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  const remaining = current > 0 ? Math.round(((total - current) / current) * elapsed) : 0;
  const remMins = Math.floor(remaining / 60);
  const remSecs = remaining % 60;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-36 h-36">
        <svg className="w-36 h-36 -rotate-90" viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="currentColor"
            className="text-gray-200 dark:text-gray-800"
            strokeWidth="8"
          />
          <motion.circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="url(#gradient)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b5bff" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-gray-900 dark:text-white">
            {Math.round(pct)}%
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {current}/{total}
          </span>
        </div>
      </div>

      <div className="mt-4 text-center space-y-1">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {paused ? "⏸ Pausado" : "⏳ Geocodificando..."}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {mins}m {secs}s transcurridos · ~{remMins}m {remSecs}s restantes
        </p>
      </div>
    </div>
  );
}
