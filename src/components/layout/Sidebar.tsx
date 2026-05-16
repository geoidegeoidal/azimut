import { Upload, FileCheck, Loader2, BarChart3, CheckCircle2, X } from "lucide-react";
import { useStore } from "@/hooks/useStore";
import type { WizardStep } from "@/types";

const STEPS: { key: WizardStep; label: string; icon: typeof Upload }[] = [
  { key: "upload", label: "Subir archivo", icon: Upload },
  { key: "preview", label: "Confirmar columna", icon: FileCheck },
  { key: "processing", label: "Geocodificando", icon: Loader2 },
  { key: "results", label: "Resultados", icon: BarChart3 },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const step = useStore((s) => s.step);

  return (
    <aside
      className={`w-72 border-r border-gray-200/50 dark:border-gray-800/50 bg-white/40 dark:bg-gray-950/40 backdrop-blur-xl flex flex-col
        fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out
        lg:relative lg:inset-auto lg:z-auto lg:translate-x-0 lg:transition-none
        ${open ? "translate-x-0" : "-translate-x-full"}`}
    >
      <button
        onClick={onClose}
        className="lg:hidden absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors z-10"
        aria-label="Cerrar menú"
      >
        <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
      </button>
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

      <div className="mt-auto p-6 border-t border-gray-200/50 dark:border-gray-800/50 space-y-3">
        <div className="bg-gradient-to-br from-azimut-50 to-violet-50 dark:from-azimut-950/30 dark:to-violet-950/30 rounded-xl p-4">
          <p className="text-xs font-medium text-azimut-700 dark:text-azimut-300">
            100% gratuito
          </p>
          <p className="text-xs text-azimut-600/70 dark:text-azimut-400/70 mt-1 mb-3">
            Sin API keys. Todo corre en tu navegador.
          </p>
          
          <div className="pt-3 border-t border-azimut-200/50 dark:border-azimut-800/50 space-y-2">
            <a 
              href="https://github.com/geoidegeoidal" 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center gap-2 text-xs text-azimut-700 dark:text-azimut-300 hover:text-azimut-500 transition-colors"
            >
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current" aria-hidden="true">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.03-2.683-.103-.253-.447-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z"></path>
              </svg>
              Creado por @geoidegeoidal
            </a>

            <a 
              href="https://link.mercadopago.cl/jorgeulloaroa" 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center justify-center gap-2 text-xs font-medium text-white bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700 py-1.5 px-3 rounded-lg transition-colors w-full shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><line x1="6" x2="6" y1="2" y2="4"/><line x1="10" x2="10" y1="2" y2="4"/><line x1="14" x2="14" y1="2" y2="4"/></svg>
              Regálame un café
            </a>
          </div>
        </div>
      </div>
    </aside>
  );
}
