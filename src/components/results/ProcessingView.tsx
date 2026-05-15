import { ArrowLeft, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useStore } from "@/hooks/useStore";
import { RadialProgress } from "@/components/ui/RadialProgress";

export function ProcessingView() {
  const processing = useStore((s) => s.processing);
  const setStep = useStore((s) => s.setStep);
  const reset = useStore((s) => s.reset);

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center space-y-8"
      >
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Geocodificando direcciones
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Esto puede demorar un rato. Cada dirección se procesa con cuidado para darte el mejor resultado.
          </p>
        </div>

        <RadialProgress
          current={processing.current}
          total={processing.total}
          elapsed={processing.elapsed}
          paused={processing.paused}
        />

        <div className="flex items-center justify-center gap-4">
          <button
            onClick={reset}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Cancelar
          </button>
          <button
            onClick={() => setStep("results")}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium bg-azimut-500 text-white hover:bg-azimut-600 shadow-lg shadow-azimut-500/25 transition-all"
          >
            Ver resultados
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
