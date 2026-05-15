import { Upload, FileCheck, Loader2, BarChart3, CheckCircle2 } from "lucide-react";
import { useStore } from "@/hooks/useStore";
import type { WizardStep } from "@/types";

const STEPS: { key: WizardStep; label: string; icon: typeof Upload }[] = [
  { key: "upload", label: "Subir archivo", icon: Upload },
  { key: "preview", label: "Confirmar columna", icon: FileCheck },
  { key: "processing", label: "Geocodificando", icon: Loader2 },
  { key: "results", label: "Resultados", icon: BarChart3 },
];

export function Sidebar() {
  const step = useStore((s) => s.step);

  return (
    <aside className="w-72 border-r border-gray-200/50 dark:border-gray-800/50 bg-white/40 dark:bg-gray-950/40 backdrop-blur-xl flex flex-col">
      <div className="p-6 space-y-1">
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
          Progreso
        </h2>
        {STEPS.map((s, i) => {
          const isActive = s.key === step;
          const isPast =
            STEPS.findIndex((x) => x.key === step) > i;
          const Icon = s.icon;

          return (
            <div
              key={s.key}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 ${
                isActive
                  ? "bg-azimut-50 dark:bg-azimut-950/50 text-azimut-700 dark:text-azimut-300 shadow-sm"
                  : isPast
                    ? "text-gray-600 dark:text-gray-400"
                    : "text-gray-400 dark:text-gray-600"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                  isActive
                    ? "bg-azimut-500 text-white shadow-lg shadow-azimut-500/25"
                    : isPast
                      ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-400"
                }`}
              >
                {isPast ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <Icon className={`w-4 h-4 ${isActive ? "animate-spin" : ""}`} />
                )}
              </div>
              <div>
                <span className="text-sm font-medium">{s.label}</span>
                <span className="block text-xs text-gray-400 dark:text-gray-500">
                  Paso {i + 1} de {STEPS.length}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-auto p-6 border-t border-gray-200/50 dark:border-gray-800/50">
        <div className="bg-gradient-to-br from-azimut-50 to-violet-50 dark:from-azimut-950/30 dark:to-violet-950/30 rounded-xl p-4">
          <p className="text-xs font-medium text-azimut-700 dark:text-azimut-300">
            100% gratuito
          </p>
          <p className="text-xs text-azimut-600/70 dark:text-azimut-400/70 mt-1">
            Sin API keys. Sin límites. Todo corre en tu navegador.
          </p>
        </div>
      </div>
    </aside>
  );
}
