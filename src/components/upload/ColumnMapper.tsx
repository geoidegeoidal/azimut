import { useState, useMemo, useCallback } from "react";
import { FileText, ArrowRight, ArrowLeft, MapPin, FileQuestion, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useStore } from "@/hooks/useStore";
import { detectAddressColumn } from "@/engine/parser";
import { normalizeBatch } from "@/engine/normalizer";

export function ColumnMapper() {
  const headers = useStore((s) => s.headers);
  const fileName = useStore((s) => s.fileName);
  const fileData = useStore((s) => s.fileData);
  const setAddressColumn = useStore((s) => s.setAddressColumn);
  const setStep = useStore((s) => s.setStep);
  const setRows = useStore((s) => s.setRows);
  const updateProcessing = useStore((s) => s.updateProcessing);

  const [selected, setSelected] = useState<string | null>(null);
  const [normalizing, setNormalizing] = useState(false);

  const suggested = useMemo(() => detectAddressColumn(headers), [headers]);

  const previewRows = useMemo(() => fileData.slice(0, 10), [fileData]);

  const normalizedPreview = useMemo(() => {
    if (!selected) return [];
    const addresses = fileData.slice(0, 10).map((row) => row[selected] || "");
    return normalizeBatch(addresses);
  }, [selected, fileData]);

  const handleConfirm = useCallback(() => {
    if (!selected) return;

    setAddressColumn(selected);
    setNormalizing(true);
    setStep("processing");

    const addresses = fileData.map((row, i) => ({
      index: i,
      address: row[selected] || "",
      original: { ...row },
    }));

    const total = addresses.length;
    let current = 0;
    const startTime = Date.now();

    const normalized = normalizeBatch(addresses.map((a) => a.address));

    const interval = setInterval(() => {
      current += Math.min(50, total - current);
      if (current >= total) {
        current = total;
        clearInterval(interval);

        const rows = addresses.map((a, i) => ({
          id: i + 1,
          original: a.original,
          normalized: normalized[i],
          selected: true,
        }));

        setRows(rows);
        const elapsed = Math.round((Date.now() - startTime) / 1000);
        updateProcessing({ current: total, total, elapsed });
        setNormalizing(false);
        setTimeout(() => setStep("results"), 500);
      } else {
        updateProcessing({ current, total, elapsed: Math.round((Date.now() - startTime) / 1000) });
      }
    }, 50);
  }, [selected, fileData, setAddressColumn, setStep, setRows, updateProcessing]);

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
                  disabled={normalizing}
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
                Vista previa de normalización
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                {selected ? `Columna "${selected}" — primeras ${previewRows.length} filas` : "Seleccioná una columna"}
              </p>
            </div>
            <div className="overflow-x-auto max-h-80 overflow-y-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-200/50 dark:border-gray-800/50 bg-gray-50/50 dark:bg-gray-800/30">
                    <th className="text-left px-3 py-2 font-medium text-gray-500 dark:text-gray-400 w-8">#</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-500 dark:text-gray-400 max-w-40">Original</th>
                    <th className="text-left px-3 py-2 font-medium text-azimut-600 dark:text-azimut-300 max-w-48">Normalizada</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-500 dark:text-gray-400">Comuna</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-500 dark:text-gray-400">⚠️</th>
                  </tr>
                </thead>
                <tbody>
                  {selected ? (
                    previewRows.map((row, i) => {
                      const norm = normalizedPreview[i];
                      return (
                        <tr
                          key={i}
                          className="border-b border-gray-100 dark:border-gray-800/30 hover:bg-gray-50 dark:hover:bg-gray-800/20"
                        >
                          <td className="px-3 py-1.5 font-mono text-gray-400">{i + 1}</td>
                          <td className="px-3 py-1.5 truncate max-w-40 text-gray-600 dark:text-gray-400">
                            {row[selected] || "—"}
                          </td>
                          <td className="px-3 py-1.5 truncate max-w-48 font-medium text-gray-900 dark:text-white">
                            {norm?.normalized || "—"}
                          </td>
                          <td className="px-3 py-1.5 text-gray-600 dark:text-gray-400">
                            {norm?.comuna || "—"}
                          </td>
                          <td className="px-3 py-1.5">
                            {norm?.warnings.length > 0 && (
                              <span className="text-amber-500" title={norm.warnings.join(", ")}>
                                ⚠️
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-3 py-8 text-center text-gray-400 dark:text-gray-500">
                        Seleccioná una columna para ver la normalización
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200/50 dark:border-gray-800/50">
        <button
          onClick={() => setStep("upload")}
          disabled={normalizing}
          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors disabled:opacity-50"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </button>
        <button
          onClick={handleConfirm}
          disabled={!selected || normalizing}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${
            selected && !normalizing
              ? "bg-azimut-500 text-white hover:bg-azimut-600 shadow-lg shadow-azimut-500/25"
              : "bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed"
          }`}
        >
          {normalizing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Normalizando...
            </>
          ) : (
            <>
              Normalizar y geocodificar {fileData.length} direcciones
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
