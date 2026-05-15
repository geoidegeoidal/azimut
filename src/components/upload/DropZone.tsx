import { useState, useCallback } from "react";
import { Upload, FileText, AlertCircle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/hooks/useStore";
import { parseCSV, parseXLSX, validateFile } from "@/engine/parser";
import type { ParseError } from "@/engine/parser";

export function DropZone() {
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ParseError | null>(null);
  const setFileData = useStore((s) => s.setFileData);
  const setStep = useStore((s) => s.setStep);

  const processFile = useCallback(
    async (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      setError(null);
      setLoading(true);

      try {
        const ext = file.name.split(".").pop()?.toLowerCase();
        const result = ext === "csv"
          ? await parseCSV(file)
          : await parseXLSX(file);

        setFileData(result.data, result.fileName);
        setStep("preview");
      } catch (e) {
        setError(e as ParseError);
      } finally {
        setLoading(false);
      }
    },
    [setFileData, setStep],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile],
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
    },
    [processFile],
  );

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <motion.div
        className="w-full max-w-xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Sube tus direcciones
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Arrastra un CSV o XLSX con direcciones chilenas y te las geocodificamos al tiro.
          </p>
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 cursor-pointer ${
            isDragging
              ? "border-azimut-500 bg-azimut-50 dark:bg-azimut-950/30 scale-105"
              : "border-gray-300 dark:border-gray-700 hover:border-azimut-400 dark:hover:border-azimut-600 bg-white/50 dark:bg-gray-900/50"
          } ${loading ? "pointer-events-none opacity-70" : ""}`}
          onClick={() => !loading && document.getElementById("file-input")?.click()}
        >
          <input
            id="file-input"
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={handleFileInput}
          />

          <motion.div
            animate={isDragging ? { y: -8 } : loading ? { y: [0, -4, 0] } : { y: 0 }}
            transition={loading ? { repeat: Infinity, duration: 1.5 } : { type: "spring", stiffness: 300 }}
          >
            {loading ? (
              <Loader2 className="w-16 h-16 mx-auto mb-4 text-azimut-500 animate-spin" />
            ) : (
              <Upload
                className={`w-16 h-16 mx-auto mb-4 transition-colors ${
                  isDragging ? "text-azimut-500" : "text-gray-400"
                }`}
              />
            )}
            <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
              {loading
                ? "Leyendo archivo..."
                : isDragging
                  ? "Suelta el archivo aquí"
                  : "Arrastra o haz clic para subir"}
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
              CSV (con coma, punto y coma o tabulación) · XLSX (primera hoja) — Máx 500 direcciones sugeridas
            </p>
          </motion.div>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-4 flex items-center gap-2 text-red-500 bg-red-50 dark:bg-red-950/20 rounded-xl px-4 py-3"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{error.message}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-8 flex items-center justify-center gap-6 text-xs text-gray-400 dark:text-gray-500">
          <div className="flex items-center gap-1.5">
            <FileText className="w-4 h-4" />
            <span>CSV / XLSX (hasta 50 MB)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span>🔒</span>
            <span>Todo local, nada se sube</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span>⚡</span>
            <span>Sin API key</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
