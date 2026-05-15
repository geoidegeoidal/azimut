import { Compass } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

export function Header() {
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200/50 dark:border-gray-800/50 bg-white/60 dark:bg-gray-950/60 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <div className="relative">
          <Compass className="w-8 h-8 text-azimut-500" />
          <div className="absolute inset-0 w-8 h-8 text-azimut-300 animate-pulse">
            <Compass />
          </div>
        </div>
        <div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-azimut-500 via-violet-500 to-fuchsia-500 bg-clip-text text-transparent">
            Azimut
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 -mt-0.5">
            Geocodificador chileno
          </p>
        </div>
      </div>
      <ThemeToggle />
    </header>
  );
}
