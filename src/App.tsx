export default function App() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-azimut-50 via-white to-violet-50 dark:from-gray-950 dark:via-gray-900 dark:to-azimut-950">
      <div className="text-center space-y-6">
        <div className="flex items-center justify-center gap-4">
          <span className="text-5xl">🧭</span>
          <h1 className="text-6xl font-bold bg-gradient-to-r from-sky-400 via-violet-500 to-fuchsia-500 bg-clip-text text-transparent">
            Azimut
          </h1>
        </div>
        <p className="text-xl text-gray-600 dark:text-gray-400">
          Geocodificador y normalizador de direcciones chilenas
        </p>
        <p className="text-sm text-gray-400 dark:text-gray-500 font-mono">
          Sube un CSV o XLSX, normaliza, geocodifica y exporta.
        </p>
      </div>
    </div>
  );
}
