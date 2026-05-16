import { Compass, Menu } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200/50 dark:border-gray-800/50 bg-white/60 dark:bg-gray-950/60 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Abrir menú"
        >
          <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
        <div className="relative">
          <Compass className="w-7 h-7 sm:w-8 sm:h-8 text-azimut-500" />
          <div className="absolute inset-0 w-7 h-7 sm:w-8 sm:h-8 text-azimut-300 animate-pulse">
            <Compass />
          </div>
        </div>
        <div>
          <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-azimut-500 via-violet-500 to-fuchsia-500 bg-clip-text text-transparent">
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
