import { useState, useMemo } from "react";
import { FileText, ArrowRight, ArrowLeft, MapPin, FileQuestion } from "lucide-react";
import { motion } from "framer-motion";
import { useStore } from "@/hooks/useStore";
import { detectAddressColumn } from "@/engine/parser";

export function ColumnMapper() {
  const headers = useStore((s) => s.headers);
  const fileName = useStore((s) => s.fileName);
  const fileData = useStore((s) => s.fileData);
  const setAddressColumn = useStore((s) => s.setAddressColumn);
  const setStep = useStore((s) => s.setStep);

  const [selected, setSelected] = useState<string | null>(null);

  const suggested = useMemo(() => detectAddressColumn(headers), [headers]);

  const previewRows = useMemo(() => fileData.slice(0, 10), [fileData]);

  const handleConfirm = () => {
    if (selected) {
      setAddressColumn(selected);
      setStep("processing");
      setTimeout(() => setStep("results"), 3000);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1"
      >
        <div className="flex items-center gap-3 mb-6">
          <FileText className="w-6 h-6 text-azimut-500" />
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Confirmá la columna de direcciones
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {fileName} — {fileData.length} filas · {headers.length} columnas encontradas
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-800/50 overflow-hidden">
            <div className="p-4 border-b border-gray-200/50 dark:border-gray-800/50">
              <div className="flex items-center gap-2">
                <FileQuestion className="w-4 h-4 text-azimut-500" />
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  ¿Cuál columna tiene las direcciones?
                </p>
              </div>
              {suggested && (
                <p className="text-xs text-azimut-600 dark:text-azimut-400 mt-1.5 ml-6">
                  <MapPin className="w-3 h-3 inline mr-1" />
                  Sugerimos "{suggested}" — parece tener direcciones
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-4">
              {headers.map((h) => (
                <button
                  key={h}
                  onClick={() => setSelected(h)}
                  className={`px-4 py-3 rounded-xl text-sm font-medium transition-all truncate ${
                    selected === h
                      ? "bg-azimut-500 text-white shadow-lg shadow-azimut-500/25"
                      : h === suggested
                        ? "bg-azimut-50 dark:bg-azimut-950/30 text-azimut-700 dark:text-azimut-300 border border-azimut-200 dark:border-azimut-800"
                        : "bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                  title={h}
                >
                  {h}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-800/50 overflow-hidden">
            <div className="p-4 border-b border-gray-200/50 dark:border-gray-800/50">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Vista previa
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                Primeras {previewRows.length} de {fileData.length} filas
              </p>
            </div>
            <div className="overflow-x-auto max-h-80 overflow-y-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-200/50 dark:border-gray-800/50 bg-gray-50/50 dark:bg-gray-800/30">
                    <th className="text-left px-3 py-2 font-medium text-gray-500 dark:text-gray-400 w-8">#</th>
                    {headers.map((h) => (
                      <th
                        key={h}
                        className={`text-left px-3 py-2 font-medium truncate max-w-40 ${
                          h === selected || h === suggested
                            ? "text-azimut-600 dark:text-azimut-300"
                            : "text-gray-500 dark:text-gray-400"
                        }`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row, i) => (
                    <tr
                      key={i}
                      className="border-b border-gray-100 dark:border-gray-800/30 hover:bg-gray-50 dark:hover:bg-gray-800/20"
                    >
                      <td className="px-3 py-1.5 font-mono text-gray-400">{i + 1}</td>
                      {headers.map((h) => (
                        <td
                          key={h}
                          className={`px-3 py-1.5 truncate max-w-40 ${
                            h === selected || h === suggested
                              ? "font-medium text-gray-900 dark:text-white bg-azimut-50/50 dark:bg-azimut-950/20"
                              : "text-gray-600 dark:text-gray-400"
                          }`}
                        >
                          {row[h] || "—"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200/50 dark:border-gray-800/50">
        <button
          onClick={() => setStep("upload")}
          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </button>
        <button
          onClick={handleConfirm}
          disabled={!selected}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${
            selected
              ? "bg-azimut-500 text-white hover:bg-azimut-600 shadow-lg shadow-azimut-500/25"
              : "bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed"
          }`}
        >
          Geocodificar {fileData.length} direcciones
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
