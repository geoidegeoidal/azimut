import { useState, useCallback } from "react";
import { Upload, FileText, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/hooks/useStore";

export function DropZone() {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setFileData = useStore((s) => s.setFileData);
  const setStep = useStore((s) => s.setStep);

  const processFile = useCallback(
    (file: File) => {
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (!["csv", "xlsx", "xls"].includes(ext || "")) {
        setError("Formato no soportado. Usá CSV o XLSX.");
        return;
      }

      if (ext === "csv") {
        const reader = new FileReader();
        reader.onload = (e) => {
          const text = e.target?.result as string;
          const lines = text.split("\n").filter((l) => l.trim());
          if (lines.length < 2) {
            setError("El archivo está vacío o no tiene datos.");
            return;
          }
          const headers = lines[0].split(/[;,]/).map((h) => h.trim().toLowerCase());
          const data = lines.slice(1).map((line) => {
            const values = line.split(/[;,]/).map((v) => v.trim());
            const row: Record<string, string> = {};
            headers.forEach((h, i) => (row[h] = values[i] || ""));
            return row;
          });
          setFileData(data, file.name);
          setStep("preview");
        };
        reader.readAsText(file);
      } else {
        // For XLSX, we'll simulate with mock data for now (Phase 3 will add SheetJS)
        const mockData = [
          { direccion: "Av. Providencia 1234", ciudad: "Santiago" },
          { direccion: "Psje Los Alerces 567", ciudad: "Viña del Mar" },
        ];
        setFileData(mockData, file.name);
        setStep("preview");
      }
    },
    [setFileData, setStep],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      setError(null);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile],
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setError(null);
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
            Subí tus direcciones
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Arrastrá un CSV o XLSX con direcciones chilenas y te las geocodificamos al toque.
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
          }`}
          onClick={() => document.getElementById("file-input")?.click()}
        >
          <input
            id="file-input"
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={handleFileInput}
          />

          <motion.div
            animate={isDragging ? { y: -8 } : { y: 0 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Upload
              className={`w-16 h-16 mx-auto mb-4 transition-colors ${
                isDragging ? "text-azimut-500" : "text-gray-400"
              }`}
            />
            <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
              {isDragging ? "Soltá el archivo acá" : "Arrastrá o hacé clic para subir"}
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
              CSV, XLSX — Máx 500 direcciones sugeridas
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
              <span className="text-sm">{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-8 flex items-center justify-center gap-6 text-xs text-gray-400 dark:text-gray-500">
          <div className="flex items-center gap-1.5">
            <FileText className="w-4 h-4" />
            <span>CSV / XLSX</span>
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
